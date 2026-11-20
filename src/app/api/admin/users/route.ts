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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

async function sendWelcomeEmail({
  apiKey,
  from,
  to,
  name,
  academyName,
  role,
  temporaryPassword,
}: {
  apiKey: string
  from: string
  to: string
  name: string
  academyName: string
  role: AcademyRole
  temporaryPassword: string
}) {
  const safeName = escapeHtml(name)
  const safePassword = escapeHtml(temporaryPassword)
  const safeAcademyName = escapeHtml(academyName)
  const roleLabel = role === 'learner' ? 'learner' : role === 'instructor' ? 'instructor' : 'administrator'
  let loginUrl = ''
  try {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FIGMA_PUBLIC_URL
    if (configuredSiteUrl) {
      const parsedSiteUrl = new URL(configuredSiteUrl)
      if (parsedSiteUrl.protocol === 'https:' || parsedSiteUrl.protocol === 'http:') {
        loginUrl = parsedSiteUrl.toString()
      }
    }
  } catch {
    loginUrl = ''
  }
  const loginLink = loginUrl
    ? `<p style="margin:0 0 18px"><a href="${escapeHtml(loginUrl)}" style="display:inline-block;border-radius:10px;background:#5d866c;padding:12px 18px;color:#ffffff;font-weight:bold;text-decoration:none">Sign in to ${safeAcademyName}</a></p>`
    : ''
  const loginText = loginUrl ? ` Sign in here: ${loginUrl}` : ''
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your ${academyName} account is ready`,
      html: `
        <div style="margin:0;background:#f5f5f0;padding:32px 16px;font-family:Arial,sans-serif;color:#284633">
          <div style="max-width:560px;margin:0 auto;overflow:hidden;border-radius:18px;background:#ffffff">
            <div style="background:#31533d;padding:28px 32px;color:#ffffff">
              <p style="margin:0 0 8px;color:#e6d8c3;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">${safeAcademyName}</p>
              <h1 style="margin:0;font-size:25px;line-height:1.25">Welcome to your academy account</h1>
            </div>
            <div style="padding:30px 32px">
              <p style="margin:0 0 16px;font-size:16px">Hello ${safeName},</p>
              <p style="margin:0 0 22px;color:#52665a;line-height:1.6">An administrator created your ${roleLabel} account. Sign in with this email address and temporary password:</p>
              ${loginLink}
              <div style="margin:0 0 22px;border-radius:12px;background:#f5f5f0;padding:18px 20px">
                <p style="margin:0 0 10px;color:#789083;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Temporary password</p>
                <p style="margin:0;overflow-wrap:anywhere;color:#31533d;font-family:monospace;font-size:16px;font-weight:bold">${safePassword}</p>
              </div>
              <p style="margin:0;color:#52665a;line-height:1.6">You will be asked to choose a new password the first time you sign in. Keep this message private and delete it after changing your password.</p>
            </div>
            <div style="border-top:1px solid #e8ece8;padding:18px 32px;color:#789083;font-size:11px">Reaching learning heights</div>
          </div>
        </div>`,
      text: `Welcome to ${academyName}, ${name}. An administrator created your ${roleLabel} account. Sign in with ${to} and this temporary password: ${temporaryPassword}.${loginText} You will be asked to choose a new password after your first sign-in. Keep this message private and delete it after changing your password.`,
    }),
    signal: AbortSignal.timeout(12_000),
  })
  return response.ok
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
  const users = data.users.flatMap((user) => {
    const profile = profileById.get(user.id)
    if (!profile || !isAcademyRole(profile.role)) return []
    return [{
      id: user.id,
      name: profile.full_name || profile.username,
      email: user.email ?? '',
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

  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL
  if (!resendApiKey || !resendFromEmail) {
    return jsonError(
      'Account emails are not configured. Add the server-only RESEND_API_KEY and RESEND_FROM_EMAIL settings before creating accounts.',
      503,
    )
  }

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
  const role = values.role

  if (!fullName || fullName.length > 120) {
    return jsonError('Enter a name between 1 and 120 characters.', 400)
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Enter a valid email address.', 400)
  }
  if (!isAcademyRole(role)) return jsonError('Choose a valid academy role.', 400)

  const temporaryPassword = randomBytes(24).toString('base64url')
  const { data, error } = await authorization.context.adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, requires_password_change: true },
    app_metadata: { role },
  })
  if (error) return jsonError(error.message, 400)

  const { data: academySettings } = await authorization.context.adminClient
    .from('academy_settings')
    .select('organization_name')
    .eq('id', 'academy')
    .maybeSingle()
  const academyName = academySettings?.organization_name || 'St Dzikaz Academy'

  let emailSent = false
  try {
    emailSent = await sendWelcomeEmail({
      apiKey: resendApiKey,
      from: resendFromEmail,
      to: email,
      name: fullName,
      academyName,
      role,
      temporaryPassword,
    })
  } catch {
    emailSent = false
  }
  if (!emailSent) {
    const { error: rollbackError } = await authorization.context.adminClient.auth.admin.deleteUser(data.user.id)
    return jsonError(
      rollbackError
        ? 'The welcome email failed and the new account could not be removed. Remove the account from User management and check the email configuration.'
        : 'The account was not created because the welcome email could not be sent. Check the email provider settings and try again.',
      502,
    )
  }

  return NextResponse.json(
    { id: data.user.id, email: data.user.email, role, emailSent },
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
