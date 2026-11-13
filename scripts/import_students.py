import argparse
import datetime as dt
import hashlib
import json
import os
import posixpath
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WORKBOOK = ROOT / "private-imports" / "Databasef1.xlsx"
SPREADSHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
REQUIRED_COLUMNS = {
    "NAME",
    "SURNAME",
    "CLASS",
    "DOB",
    "NUMBER",
    "YEAR",
    "GENDER",
    "REG",
    "PASSWORD",
}


def column_index(reference):
    letters = re.match(r"[A-Z]+", reference)
    if not letters:
        raise ValueError("Workbook contains an invalid cell reference.")
    value = 0
    for character in letters.group():
        value = value * 26 + ord(character) - ord("A") + 1
    return value - 1


def load_shared_strings(archive):
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [
        "".join(node.text or "" for node in entry.findall(f".//{{{SPREADSHEET_NS}}}t"))
        for entry in root.findall(f"{{{SPREADSHEET_NS}}}si")
    ]


def load_number_formats(archive):
    try:
        root = ET.fromstring(archive.read("xl/styles.xml"))
    except KeyError:
        return []
    custom_formats = {
        int(item.attrib["numFmtId"]): item.attrib["formatCode"]
        for item in root.findall(f".//{{{SPREADSHEET_NS}}}numFmt")
    }
    xfs = root.find(f".//{{{SPREADSHEET_NS}}}cellXfs")
    if xfs is None:
        return []
    return [
        custom_formats.get(int(xf.attrib.get("numFmtId", "0")), "")
        for xf in xfs.findall(f"{{{SPREADSHEET_NS}}}xf")
    ]


def cell_value(cell, shared_strings, number_formats):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(f".//{{{SPREADSHEET_NS}}}t"))

    value_node = cell.find(f"{{{SPREADSHEET_NS}}}v")
    if value_node is None or value_node.text is None:
        return ""
    value = value_node.text
    if cell_type == "s":
        return shared_strings[int(value)]
    if cell_type in ("str", "b"):
        return value

    style_index = int(cell.attrib.get("s", "0"))
    number_format = number_formats[style_index] if style_index < len(number_formats) else ""
    if re.fullmatch(r"0+", number_format):
        return value.split(".")[0].zfill(len(number_format))
    try:
        number = float(value)
    except ValueError:
        return value
    return str(int(number)) if number.is_integer() else value


def read_workbook(path):
    try:
        archive = zipfile.ZipFile(path)
    except (OSError, zipfile.BadZipFile) as error:
        raise ValueError("Student workbook could not be opened as an Excel file.") from error

    with archive:
        shared_strings = load_shared_strings(archive)
        number_formats = load_number_formats(archive)
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target_by_id = {
            relation.attrib["Id"]: relation.attrib["Target"]
            for relation in relationships.findall(f"{{{PACKAGE_REL_NS}}}Relationship")
        }
        all_records = []

        for sheet in workbook.findall(f".//{{{SPREADSHEET_NS}}}sheet"):
            relation_id = sheet.attrib[f"{{{OFFICE_REL_NS}}}id"]
            target = target_by_id[relation_id]
            sheet_path = (
                target.lstrip("/")
                if target.startswith("/")
                else posixpath.normpath(posixpath.join("xl", target))
            )
            root = ET.fromstring(archive.read(sheet_path))
            rows = root.findall(f".//{{{SPREADSHEET_NS}}}sheetData/{{{SPREADSHEET_NS}}}row")
            if not rows:
                continue

            header_cells = {
                column_index(cell.attrib["r"]): cell_value(cell, shared_strings, number_formats).strip().upper()
                for cell in rows[0].findall(f"{{{SPREADSHEET_NS}}}c")
            }
            headers = {index: name for index, name in header_cells.items() if name}
            missing = REQUIRED_COLUMNS - set(headers.values())
            if missing:
                raise ValueError(f"A workbook sheet is missing required columns: {', '.join(sorted(missing))}.")

            for row_number, row in enumerate(rows[1:], start=2):
                values = {
                    column_index(cell.attrib["r"]): cell_value(cell, shared_strings, number_formats)
                    for cell in row.findall(f"{{{SPREADSHEET_NS}}}c")
                }
                record = {name: str(values.get(index, "")).strip() for index, name in headers.items()}
                if any(record.values()):
                    record["_row_number"] = row_number
                    all_records.append(record)

    return all_records


def normalized_registration(value):
    token = re.sub(r"[^a-z0-9]", "", value.casefold())
    if not token or len(token) > 56:
        raise ValueError("A registration number cannot be used to create a sign-in identifier.")
    return token


def auth_email_for_registration(value):
    return f"student+{normalized_registration(value)}@login.dzikaz.ac.zw"


def username_for_registration(value):
    suffix = hashlib.sha256(value.casefold().encode("utf-8")).hexdigest()[:20]
    return f"student_{suffix}"


def parse_date(value):
    if not value:
        return None
    try:
        return (dt.datetime(1899, 12, 30) + dt.timedelta(days=float(value))).date().isoformat()
    except ValueError:
        pass
    for date_format in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(value, date_format).date().isoformat()
        except ValueError:
            continue
    raise ValueError("A student date of birth is not a valid date.")


def prepare_records(records):
    prepared = []
    seen_registrations = set()
    seen_logins = set()
    for record in records:
        row = record["_row_number"]
        registration = record["REG"]
        password = record["PASSWORD"]
        full_name = " ".join(part for part in (record["NAME"], record["SURNAME"]) if part).strip()
        if not registration or not password or not full_name:
            raise ValueError(f"Required student data is missing from workbook row {row}.")
        if len(password) < 8:
            raise ValueError(f"A student password is shorter than 8 characters (workbook row {row}).")
        registration_key = registration.casefold()
        login_email = auth_email_for_registration(registration)
        if registration_key in seen_registrations or login_email.casefold() in seen_logins:
            raise ValueError(f"Duplicate student registration information was found at workbook row {row}.")
        seen_registrations.add(registration_key)
        seen_logins.add(login_email.casefold())
        prepared.append(
            {
                "registration_number": registration,
                "email": login_email,
                "password": password,
                "username": username_for_registration(registration),
                "full_name": full_name,
                "class_name": record["CLASS"],
                "date_of_birth": parse_date(record["DOB"]),
                "contact_number": record["NUMBER"],
                "academic_year": record["YEAR"],
                "gender": record["GENDER"],
                "_row_number": row,
            }
        )
    return prepared


def request_supabase(method, url, service_key, body=None, prefer=None):
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            content = response.read()
            return json.loads(content) if content else None
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Supabase rejected an import request (HTTP {error.code}).") from None
    except urllib.error.URLError as error:
        raise RuntimeError("Could not connect to Supabase. Check the URL and network connection.") from error


def import_records(records):
    project_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not project_url or not service_key:
        raise ValueError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the local environment.")

    auth_url = f"{project_url}/auth/v1/admin/users"
    existing_users = {}
    page = 1
    while True:
        query = urllib.parse.urlencode({"page": page, "per_page": 1000})
        result = request_supabase("GET", f"{auth_url}?{query}", service_key)
        users = result.get("users", []) if isinstance(result, dict) else result
        if not users:
            break
        for user in users:
            email = user.get("email")
            if email:
                existing_users[email.casefold()] = user["id"]
        if len(users) < 1000:
            break
        page += 1

    student_details = []
    created = 0
    existing = 0
    for record in records:
        user_id = existing_users.get(record["email"].casefold())
        if user_id:
            existing += 1
        else:
            user = request_supabase(
                "POST",
                auth_url,
                service_key,
                {
                    "email": record["email"],
                    "password": record["password"],
                    "email_confirm": True,
                    "user_metadata": {
                        "username": record["username"],
                        "full_name": record["full_name"],
                        "requires_password_change": True,
                    },
                },
            )
            user_id = user["id"]
            existing_users[record["email"].casefold()] = user_id
            created += 1
        student_details.append(
            {
                "profile_id": user_id,
                "registration_number": record["registration_number"],
                "class_name": record["class_name"],
                "date_of_birth": record["date_of_birth"],
                "contact_number": record["contact_number"],
                "academic_year": record["academic_year"],
                "gender": record["gender"],
            }
        )

    request_supabase(
        "POST",
        f"{project_url}/rest/v1/student_details?on_conflict=registration_number",
        service_key,
        student_details,
        prefer="resolution=merge-duplicates,return=minimal",
    )
    print(f"Import complete. Created {created} student accounts; refreshed details for {len(student_details)} records ({existing} accounts already existed).")


def main():
    parser = argparse.ArgumentParser(
        description="Import student accounts to Supabase Auth and protected student_details."
    )
    parser.add_argument("--file", type=Path, default=DEFAULT_WORKBOOK)
    parser.add_argument("--apply", action="store_true", help="Create/update accounts in Supabase; default is validation only.")
    args = parser.parse_args()
    try:
        records = prepare_records(read_workbook(args.file))
        if not records:
            raise ValueError("The workbook contains no student records.")
        if args.apply:
            import_records(records)
        else:
            print(f"Validated {len(records)} student records. No accounts or data were sent to Supabase.")
            print("Review the workbook locally, then rerun with --apply to import.")
    except (OSError, KeyError, ValueError, RuntimeError, zipfile.BadZipFile) as error:
        print(f"Student import failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
