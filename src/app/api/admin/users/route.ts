import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const roles = ['learner', 'instructor', 'admin'] as const
type AcademyRole = (typeof roles)[number]

function isAcademyRole(value: unknown): value is AcademyRole {
  return typeof value === 'string' && roles.includes(value as AcademyRole)
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

async function authorizeAdmin(request: Request) {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!accessToken) {
    return { response: jsonError('Sign in before managing users.', 401) } as const
  }

  const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseURL || !anonKey) {
    return { response: jsonError('User management is not configured on the server.', 503) } as const
  }
  if (!serviceRoleKey) {
    return {
      response: jsonError(
        'Admin user management needs the server-only SUPABASE_SERVICE_ROLE_KEY setting. Add it to the app host environment and redeploy.',
        503,
      ),
    } as const
  }

  const userClient = createClient(supabaseURL, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken)
  if (authError || !user) {
    return { response: jsonError('Your sign-in session is invalid or expired.', 401) } as const
  }

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) {
    return { response: jsonError('Could not verify administrator access.', 500) } as const
  }
  if (profile?.role !== 'admin') {
    return { response: jsonError('Only administrators can manage users.', 403) } as const
  }

  const adminClient = createClient(supabaseURL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return { context: { userClient, adminClient, userId: user.id } } as const
}

export async function GET(request: Request) {
  const authorization = await authorizeAdmin(request)
  if ('response' in authorization) return authorization.response

  const pageValue = new URL(request.url).searchParams.get('page') ?? '1'
  const page = Number(pageValue)
  if (!Number.isInteger(page) || page < 1) return jsonError('Page must be a positive integer.', 400)

  const perPage = 100
  const { data, error } = await authorization.context.adminClient.auth.admin.listUsers({
    page,
    perPage,
  })
  if (error) return jsonError(error.message, 400)

  const userIds = data.users.map((user) => user.id)
  const { data: profiles, error: profilesError } = userIds.length
    ? await authorization.context.userClient
        .from('profiles')
        .select('id, username, full_name, role')
        .in('id', userIds)
    : { data: [], error: null }
  if (profilesError) return jsonError('Could not load academy user profiles.', 500)

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const { data: studentDetails, error: studentDetailsError } = userIds.length
    ? await authorization.context.adminClient
        .from('student_details')
        .select('profile_id, registration_number')
        .in('profile_id', userIds)
    : { data: [], error: null }
  if (studentDetailsError) return jsonError('Could not load learner registration numbers.', 500)
  const registrationByProfileId = new Map(
    (studentDetails ?? []).map((details) => [details.profile_id, details.registration_number ?? '']),
  )

  const users = data.users.flatMap((user) => {
    const profile = profileById.get(user.id)
    if (!profile || !isAcademyRole(profile.role)) return []
    const registrationNumber = registrationByProfileId.get(user.id) ?? ''
    const isRegistrationLogin = user.email?.endsWith('@login.dzikaz.ac.zw') === true
    return [{
      id: user.id,
      name: profile.full_name || profile.username,
      email: isRegistrationLogin ? '' : user.email ?? '',
      registrationNumber,
      role: profile.role,
    }]
  })

  return NextResponse.json({
    users,
    nextPage: data.users.length === perPage ? page + 1 : null,
  })
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin(request)
  if ('response' in authorization) return authorization.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Request body must be valid JSON.', 400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Request body must be an object.', 400)
  }

  const values = body as Record<string, unknown>
  const fullName = typeof values.fullName === 'string' ? values.fullName.trim() : ''
  const email = typeof values.email === 'string' ? values.email.trim().toLowerCase() : ''
  const school = typeof values.school === 'string' ? values.school.trim() : ''
  const phone = typeof values.phone === 'string' ? values.phone.trim() : ''
  const registrationInput = typeof values.registrationNumber === 'string' ? values.registrationNumber.trim() : ''
  const role = values.role

  if (!fullName || fullName.length > 120) {
    return jsonError('Enter a name between 1 and 120 characters.', 400)
  }
  if (!isAcademyRole(role)) return jsonError('Choose a valid academy role.', 400)
  if (school.length > 120) return jsonError('School or organisation name must be 120 characters or fewer.', 400)
  if (phone.length > 40) return jsonError('Phone number must be 40 characters or fewer.', 400)
  if (role !== 'admin' && (!school || !phone)) {
    return jsonError('Enter a school or organisation and phone number for learner and teacher accounts.', 400)
  }

  let accountEmail = email
  let registrationNumber = ''
  if (role === 'learner') {
    registrationNumber = registrationInput.toUpperCase()
    if (!/^(?:[A-Z]\d{6}[A-Z]|[A-Z]\d{4}[A-Z]{3})$/.test(registrationNumber)) {
      return jsonError('Enter a REG number in one of these formats: one letter, six digits, one letter; or one letter, four digits, three letters.', 400)
    }
    accountEmail = `student+${registrationNumber.toLowerCase()}@login.dzikaz.ac.zw`
    const { data: existingRegistration, error: registrationError } = await authorization.context.adminClient
      .from('student_details')
      .select('profile_id')
      .ilike('registration_number', registrationNumber)
      .maybeSingle()
    if (registrationError) return jsonError('Could not verify that registration number.', 500)
    if (existingRegistration) return jsonError('A learner with that registration number already exists.', 409)
  } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Enter a valid email address for staff accounts.', 400)
  }

  const temporaryPassword = randomBytes(24).toString('base64url')
  const { data, error } = await authorization.context.adminClient.auth.admin.createUser({
    email: accountEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, requires_password_change: true },
    app_metadata: { role },
  })
  if (error) return jsonError(error.message, 400)

  const { error: profileSaveError } = await authorization.context.adminClient
    .from('profiles')
    .update({ school, phone })
    .eq('id', data.user.id)
  if (profileSaveError) {
    const { error: rollbackError } = await authorization.context.adminClient.auth.admin.deleteUser(data.user.id)
    return jsonError(
      rollbackError
        ? `Could not save the school and phone details (${profileSaveError.message}), and the new account could not be rolled back. Remove account ${data.user.id} manually.`
        : `Could not save the school and phone details: ${profileSaveError.message}`,
      500,
    )
  }

  if (role === 'learner') {
    const { data: learnerDetails, error: registrationSaveError } = await authorization.context.adminClient
      .from('student_details')
      .update({ registration_number: registrationNumber, contact_number: phone })
      .eq('profile_id', data.user.id)
      .select('profile_id')
      .maybeSingle()
    if (registrationSaveError || !learnerDetails) {
      const { error: rollbackError } = await authorization.context.adminClient.auth.admin.deleteUser(data.user.id)
      const detail = registrationSaveError?.message ?? 'The learner profile was not created.'
      return jsonError(
        rollbackError
          ? `Could not save the learner registration/contact details (${detail}), and the new account could not be rolled back. Remove account ${data.user.id} manually.`
          : `Could not save the learner registration/contact details: ${detail}`,
        500,
      )
    }
  }

  return NextResponse.json(
    {
      id: data.user.id,
      email: role === 'learner' ? '' : data.user.email,
      loginIdentifier: role === 'learner' ? registrationNumber : data.user.email,
      registrationNumber: role === 'learner' ? registrationNumber : '',
      role,
      temporaryPassword,
    },
    { status: 201 },
  )
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdmin(request)
  if ('response' in authorization) return authorization.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Request body must be valid JSON.', 400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Request body must be an object.', 400)
  }

  const userId = (body as Record<string, unknown>).userId
  if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return jsonError('Choose a valid user account.', 400)
  }
  if (userId === authorization.context.userId) {
    return jsonError('You cannot remove your own administrator account.', 400)
  }

  const { data: target, error: targetError } = await authorization.context.userClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (targetError) return jsonError('Could not verify the selected account.', 500)
  if (!target) return jsonError('That academy account was not found.', 404)

  if (target.role === 'admin') {
    const { count, error: countError } = await authorization.context.userClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if (countError) return jsonError('Could not verify the remaining administrator accounts.', 500)
    if ((count ?? 0) <= 1) {
      return jsonError('The last administrator account cannot be removed.', 400)
    }
  }

  const { error } = await authorization.context.adminClient.auth.admin.deleteUser(userId)
  if (error) return jsonError(error.message, 400)

  return NextResponse.json({ id: userId })
}
