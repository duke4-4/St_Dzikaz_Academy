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

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!accessToken) return jsonError('Sign in before adding a user.', 401)

  const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseURL || !anonKey || !serviceRoleKey) {
    return jsonError('User creation is not configured on the server.', 503)
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
  const password = typeof values.password === 'string' ? values.password : ''
  const role = values.role

  if (!fullName || fullName.length > 120) {
    return jsonError('Enter a name between 1 and 120 characters.', 400)
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Enter a valid email address.', 400)
  }
  if (password.length < 8 || password.length > 128) {
    return jsonError('Use a temporary password between 8 and 128 characters.', 400)
  }
  if (!isAcademyRole(role)) return jsonError('Choose a valid academy role.', 400)

  const userClient = createClient(supabaseURL, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken)
  if (authError || !user) return jsonError('Your sign-in session is invalid or expired.', 401)

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) return jsonError('Could not verify administrator access.', 500)
  if (profile?.role !== 'admin') return jsonError('Only administrators can add users.', 403)

  const adminClient = createClient(supabaseURL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, requires_password_change: true },
    app_metadata: { role },
  })
  if (createError) return jsonError(createError.message, 400)

  return NextResponse.json({ id: data.user.id, email: data.user.email, role }, { status: 201 })
}
