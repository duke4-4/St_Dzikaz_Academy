'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Image from 'next/image'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import academyLogo from '../../../public/assets/st_dzikaz_logo.png'

type Role = 'Learner' | 'Instructor' | 'Admin'
type IconName =
  | 'home'
  | 'book'
  | 'path'
  | 'chart'
  | 'award'
  | 'users'
  | 'settings'
  | 'bell'
  | 'search'
  | 'chevron'
  | 'play'
  | 'clock'
  | 'calendar'
  | 'plus'
  | 'more'
  | 'check'
  | 'trend'
  | 'file'
  | 'logout'
  | 'user'
  | 'x'
  | 'trash'
  | 'edit'
  | 'camera'
  | 'mail'

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-7h6v7" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z" />
      <path d="M4 6.5v13M8 8h8" />
    </>
  ),
  path: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3H9a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2h8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="m8.5 12-1 9 4.5-2 4.5 2-1-9" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.55-1H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.03a1.7 1.7 0 0 0 1-1.55V3h4v.08a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.03a1.7 1.7 0 0 0 1.55 1H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  play: <path d="m9 7 8 5-8 5z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-9" />
      <path d="M15 6h6v6" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 7h3l2-3h6l2 3h3v13H4Z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
}

function Icon({
  name,
  size = 20,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const navByRole: Record<Role, { label: string; icon: IconName }[]> = {
  Learner: [
    { label: 'Overview', icon: 'home' },
    { label: 'My learning', icon: 'book' },
    { label: 'Classrooms', icon: 'users' },
    { label: 'My marks', icon: 'chart' },
    { label: 'Messages', icon: 'mail' },
    { label: 'Notice board', icon: 'bell' },
    { label: 'Calendar', icon: 'calendar' },
  ],
  Instructor: [
    { label: 'Overview', icon: 'home' },
    { label: 'My subjects', icon: 'book' },
    { label: 'My classes', icon: 'users' },
    { label: 'Lessons & resources', icon: 'file' },
    { label: 'Assignments', icon: 'path' },
    { label: 'Submissions & grading', icon: 'chart' },
    { label: 'Student performance', icon: 'trend' },
    { label: 'Messages', icon: 'mail' },
    { label: 'Notice board', icon: 'bell' },
    { label: 'Calendar', icon: 'calendar' },
  ],
  Admin: [
    { label: 'Overview', icon: 'home' },
    { label: 'Users', icon: 'users' },
    { label: 'Classes & Grades', icon: 'users' },
    { label: 'Subjects', icon: 'book' },
    { label: 'Teacher Assignments', icon: 'user' },
    { label: 'Student Enrolments', icon: 'users' },
    { label: 'Academic Reports', icon: 'chart' },
    { label: 'Settings', icon: 'settings' },
    { label: 'Notice board', icon: 'bell' },
    { label: 'Calendar', icon: 'calendar' },
  ],
}

type Notice = {
  id: string
  title: string
  body: string
  audience: 'Everyone' | Role
  date: string
}

type Subject = {
  id: string
  name: string
  level: 'O Level' | 'A Level'
  code: string
  learners: number
  archived_at?: string | null
  description?: string
  assignmentClassId?: string
  assignmentClassName?: string
  lessonCount?: number
  assignmentCount?: number
}

type AcademicClass = { id: string; name: string; grade: string; stream: string; description: string; academic_year_id: string }
type AcademicSubject = { id: string; name: string; level: 'O Level' | 'A Level'; code: string; description: string; archived_at: string | null }
type AcademicPerson = { id: string; full_name: string; username: string; role: 'learner' | 'instructor' | 'admin' }

function academicClassLabel(item: Pick<AcademicClass, 'name' | 'grade' | 'stream'>) {
  const name = item.name.trim()
  const grade = item.grade.trim()
  const label = grade && grade.toLowerCase() !== name.toLowerCase() ? `${name} (${grade})` : name || grade
  return item.stream ? `${label} · Section ${item.stream}` : label
}

type Profile = {
  name: string
  username: string
  bio: string
  email: string
  school: string
  phone: string
  image?: string
  avatarFile?: File
}

type ManagedUser = {
  id: string
  name: string
  email: string
  registrationNumber: string
  role: 'learner' | 'instructor' | 'admin'
}

function isManagedUser(value: unknown): value is ManagedUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.registrationNumber === 'string' &&
    (user.role === 'learner' || user.role === 'instructor' || user.role === 'admin')
  )
}

function isClassroomLearnerProfile(
  value: unknown,
): value is { id: string; full_name: string; username: string } {
  if (!value || typeof value !== 'object') return false
  const profile = value as Record<string, unknown>
  return (
    typeof profile.id === 'string' &&
    typeof profile.full_name === 'string' &&
    typeof profile.username === 'string'
  )
}

const profileDefaults: Record<Role, Profile> = {
  Learner: {
    name: '',
    username: '',
    bio: '',
    email: '',
    school: '',
    phone: '',
  },
  Instructor: {
    name: '',
    username: '',
    bio: '',
    email: '',
    school: '',
    phone: '',
  },
  Admin: {
    name: '',
    username: '',
    bio: '',
    email: '',
    school: '',
    phone: '',
  },
}

const initialNotices: Notice[] = [
  {
    id: 'notice-1',
    title: 'June examination timetable is now available',
    body: 'Check the calendar for Mathematics, English and Science revision sessions before the ZIMSEC June examinations.',
    audience: 'Everyone',
    date: 'Today',
  },
  {
    id: 'notice-2',
    title: 'O Level Mathematics revision clinic',
    body: 'Join Mr Kunda on Saturday for an intensive paper 2 revision clinic covering algebra and geometry.',
    audience: 'Learner',
    date: 'Yesterday',
  },
]

function Logo({ compact = false, academyName = 'St Dzikaz Academy' }: { compact?: boolean; academyName?: string }) {
  return (
    <div className="flex items-center gap-3">
      <LogoImage className="h-10 w-10 shrink-0 rounded-xl" />
      {!compact && (
        <div>
          <div className="font-display text-lg font-bold leading-none tracking-tight">
            {academyName}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[.18em] text-white/55">
            Reaching learning heights
          </div>
        </div>
      )}
    </div>
  )
}

function Sidebar({
  role,
  active,
  setActive,
  profile,
  academyName,
  onProfile,
  onLogout,
}: {
  role: Role
  active: string
  setActive: (v: string) => void
  profile: Profile
  academyName: string
  onProfile: () => void
  onLogout: () => void
}) {
  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden max-h-dvh w-[250px] flex-col overflow-hidden bg-[#5D866C] px-3 py-3 text-white lg:flex">
      <div className="shrink-0 px-1">
        <Logo academyName={academyName} />
      </div>
      <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
        <p className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-white/45">
          Workspace
        </p>
        {navByRole[role].map((item) => (
          <button
            key={item.label}
            onClick={() => setActive(item.label)}
            className={`flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${active === item.label ? 'bg-white text-[#31533d] shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <Icon name={item.icon} size={16} className="shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="shrink-0 space-y-0.5 border-t border-white/15 pt-2">
        <button
          onClick={onProfile}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white"
        >
          <Icon name="user" size={16} />
          Edit profile
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white"
        >
          <Icon name="logout" size={16} />
          Log out
        </button>
        <div className="mt-2 flex min-w-0 items-center gap-2.5 rounded-lg bg-[#31533d]/40 p-2">
          <Avatar initials={initials(profile.name)} image={profile.image} small />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{profile.name}</p>
            <p className="text-[10px] text-white/50">{role} account</p>
          </div>
          <Icon name="more" size={15} className="ml-auto shrink-0 text-white/50" />
        </div>
      </div>
    </aside>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({
  initials,
  small = false,
  image,
}: {
  initials: string
  small?: boolean
  image?: string
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#C2A68C] font-bold text-[#31533d] ${small ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'}`}
    >
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
  )
}

function Header({
  role,
  profile,
  academyName,
  onProfile,
  onNavigate,
}: {
  role: Role
  profile: Profile
  academyName: string
  onProfile: () => void
  onNavigate: (page: string) => void
}) {
  const [now, setNow] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#31533d]/10 bg-[#F5F5F0]/90 px-5 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <Logo compact academyName={academyName} />
        <span className="font-display max-w-36 truncate font-bold text-[#31533d]">{academyName}</span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const query = search.toLowerCase()
          if (query.includes('message')) onNavigate('Messages')
          else if (query.includes('mark')) onNavigate(role === 'Learner' ? 'My marks' : 'Marks')
          else if (query.includes('notice')) onNavigate('Notice board')
          else if (query.includes('calendar') || query.includes('event')) onNavigate('Calendar')
          else if (role === 'Instructor' && (query.includes('subject') || query.includes('course')))
            onNavigate('My subjects')
          else if (role === 'Learner') onNavigate('My learning')
          else onNavigate(role === 'Admin' ? 'Users' : role === 'Instructor' ? 'My classes' : 'My learning')
        }}
        className="hidden w-full max-w-sm items-center gap-2 rounded-xl border border-[#31533d]/10 bg-white px-3.5 py-2.5 text-[#789083] md:flex"
      >
        <Icon name="search" size={18} />
        <input
          aria-label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#789083]"
          placeholder="Search courses, paths, people..."
        />
      </form>
      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden text-right xl:block">
          <p className="text-xs font-bold text-[#31533d]">
            {now?.toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' }) ?? '--:--'}
          </p>
          <p className="text-[10px] text-[#789083]">
            {now?.toLocaleDateString('en-ZW', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) ?? 'Loading date'}
          </p>
        </div>
        <button
          onClick={() => onNavigate('Notice board')}
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#31533d]/10 bg-white text-[#31533d]"
        >
          <Icon name="bell" size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#C2A68C]" />
        </button>
        <button
          onClick={onProfile}
          aria-label="Open profile"
          className="block rounded-full ring-2 ring-transparent transition hover:ring-[#C2A68C]"
        >
          <Avatar initials={initials(profile.name)} image={profile.image} />
        </button>
      </div>
    </header>
  )
}

function StatCard({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string
  value: string
  detail: string
  icon: IconName
  accent?: boolean
}) {
  return (
    <div className={`card p-5 ${accent ? 'bg-[#5D866C] text-white' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold ${accent ? 'text-white/60' : 'text-[#789083]'}`}>
            {label}
          </p>
          <p className="font-display mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${accent ? 'bg-white/12 text-[#E6D8C3]' : 'bg-[#E6D8C3]/55 text-[#5D866C]'}`}
        >
          <Icon name={icon} size={19} />
        </span>
      </div>
      <p className={`mt-3 text-[11px] ${accent ? 'text-white/65' : 'text-[#789083]'}`}>{detail}</p>
    </div>
  )
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-lg font-bold tracking-tight text-[#284633]">{title}</h2>
      {action && (
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="flex items-center gap-1 text-xs font-bold text-[#5D866C] hover:text-[#31533d]"
          >
            {action}
            <Icon name="chevron" size={14} />
          </button>
        ) : (
          <span className="text-xs font-semibold text-[#789083]">{action}</span>
        )
      )}
    </div>
  )
}

function ProgressRing({ value, size = 76 }: { value: number; size?: number }) {
  const r = 29,
    c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 70 70" className="-rotate-90">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#E6D8C3" strokeWidth="7" opacity=".55" />
        <circle
          cx="35"
          cy="35"
          r={r}
          fill="none"
          stroke="#5D866C"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-extrabold text-[#31533d]">
        {value}%
      </span>
    </div>
  )
}

function learnerTimeGreeting(date: Date) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function LearnerDashboard({ name, userId, supabase }: { name: string; userId: string; supabase: SupabaseClient }) {
  const [completedLessons, setCompletedLessons] = useState(0)
  const [totalLessons, setTotalLessons] = useState(0)
  const [progressLoading, setProgressLoading] = useState(true)
  const [progressSaving, setProgressSaving] = useState(false)
  const [progressError, setProgressError] = useState('')
  const [enrolledSubjects, setEnrolledSubjects] = useState<{ id: string; name: string; level: string; code: string }[]>([])
  const [learnerClasses, setLearnerClasses] = useState<string[]>([])
  const [greeting, setGreeting] = useState('Welcome')
  const [marksCount, setMarksCount] = useState(0)
  const [learningTab, setLearningTab] = useState<'overview' | 'subjects' | 'progress'>('overview')
  const [subjectSearch, setSubjectSearch] = useState('')
  const [subjectLevel, setSubjectLevel] = useState('all')
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    setGreeting(learnerTimeGreeting(new Date()))
  }, [])

  useEffect(() => {
    let active = true
    const loadOverview = async () => {
      setDashboardLoading(true)
      setProgressLoading(true)
      setDashboardError('')
      setProgressError('')
      setEnrolledSubjects([])
      setLearnerClasses([])
      setCompletedLessons(0)
      setTotalLessons(0)
      setMarksCount(0)
      const [enrollments, classEnrollments, marks] = await Promise.all([
        supabase.from('enrollments').select('subject_id').eq('learner_id', userId),
        supabase.from('student_class_enrollments').select('class_id').eq('student_id', userId),
        supabase.from('marks').select('id', { count: 'exact', head: true }).eq('learner_id', userId),
      ])
      if (!active) return
      if (enrollments.error) setDashboardError(enrollments.error.message)
      else if (classEnrollments.error) setDashboardError(classEnrollments.error.message)
      else if (marks.error) setDashboardError(marks.error.message)
      else {
        const classIds = [...new Set((classEnrollments.data ?? []).map((item) => item.class_id))]
        const classResult = classIds.length
          ? await supabase.from('classes').select('id, name, grade, stream').in('id', classIds)
          : { data: [], error: null }
        if (!active) return
        if (classResult.error) setDashboardError(classResult.error.message)
        else {
          const classLabels = (classResult.data ?? []).map((item) => {
            const level = item.grade?.trim() || item.name.trim()
            return `${level}${item.stream?.trim().toUpperCase() ?? ''}`
          })
          setLearnerClasses([...new Set(classLabels)])
        }
        const classSubjects = classIds.length
          ? await supabase.from('class_subjects').select('subject_id').in('class_id', classIds)
          : { data: [], error: null }
        if (classSubjects.error) setDashboardError(classSubjects.error.message)
        const subjectIds = [...new Set([
          ...(enrollments.data ?? []).map((item) => item.subject_id),
          ...(classSubjects.data ?? []).map((item) => item.subject_id),
        ])]
        if (subjectIds.length) {
          const { data, error } = await supabase.from('subjects').select('id, name, level, code').in('id', subjectIds)
          if (!active) return
          if (error) setDashboardError(error.message)
          else setEnrolledSubjects(data ?? [])
        }
        const { data: lessons, error: lessonError } = classIds.length
          ? await supabase.from('lessons').select('id').in('class_id', classIds).eq('is_published', true)
          : { data: [], error: null }
        if (!active) return
        if (lessonError) setProgressError(`Could not load lesson progress: ${lessonError.message}`)
        else {
          const lessonIds = (lessons ?? []).map((lesson) => lesson.id)
          setTotalLessons(lessonIds.length)
          if (lessonIds.length) {
            const { count, error } = await supabase.from('lesson_completions').select('id', { count: 'exact', head: true }).eq('learner_id', userId).in('lesson_id', lessonIds)
            if (!active) return
            if (error) setProgressError(`Could not load lesson progress: ${error.message}`)
            else setCompletedLessons(count ?? 0)
          } else setCompletedLessons(0)
        }
        setMarksCount(marks.count ?? 0)
      }
      setProgressLoading(false)
      setDashboardLoading(false)
    }
    void loadOverview()
    return () => { active = false }
  }, [supabase, userId])

  const courseProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
  const visibleSubjects = enrolledSubjects.filter((subject) => {
    const query = subjectSearch.trim().toLowerCase()
    const matchesQuery = `${subject.name} ${subject.code} ${subject.level}`.toLowerCase().includes(query)
    return matchesQuery && (subjectLevel === 'all' || subject.level === subjectLevel)
  })
  const learningTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subjects', label: 'My subjects' },
    { id: 'progress', label: 'Learning progress' },
  ] as const
  const progressCard = (
    <div className="card overflow-hidden">
      <div className="grid md:grid-cols-[190px_1fr]">
        <div className="relative flex min-h-44 items-end overflow-hidden bg-[#31533d] p-5 text-white">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[22px] border-[#C2A68C]/35" />
          <div className="absolute right-9 top-14 h-24 w-24 rotate-45 border-2 border-[#E6D8C3]/40" />
          <div className="relative"><span className="rounded-md bg-[#E6D8C3] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#31533d]">Class learning</span><p className="font-display mt-3 text-xl font-bold leading-tight">Lesson progress</p></div>
        </div>
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold text-[#5D866C]">{totalLessons ? `${completedLessons} of ${totalLessons} published lessons complete` : 'No published lessons yet'}</p><h3 className="font-display mt-1 text-xl font-bold text-[#284633]">Your class lesson progress</h3></div>
            <ProgressRing value={courseProgress} size={70} />
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#708277]">Progress reflects published lessons in your enrolled classes and lessons you have marked complete.</p>
          {progressError && <p role="alert" className="mt-3 text-xs text-[#8a5548]">{progressError}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardFrame eyebrow="Learner dashboard" title={`${greeting}, ${name}`} subtitle={`${learnerClasses.length ? learnerClasses.join(', ') : dashboardLoading ? 'Loading your class…' : 'Your class has not been assigned yet'} · Your learning activity and enrolled subjects, all in one place.`}>
      {dashboardError && <p role="alert" className="mb-5 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">Could not load some learning information: {dashboardError}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Enrolled subjects" value={dashboardLoading ? '…' : enrolledSubjects.length.toLocaleString()} detail="Current subject enrollments" icon="book" accent />
        <StatCard label="Marks recorded" value={dashboardLoading ? '…' : marksCount.toLocaleString()} detail="Assessment results available to you" icon="chart" />
        <StatCard label="Lessons completed" value={progressLoading ? '…' : `${completedLessons} / ${totalLessons}`} detail={`${courseProgress}% of published class lessons`} icon="check" />
      </div>
      <div className="mt-7 border-b border-[#31533d]/15">
        <div role="tablist" aria-label="Learner overview sections" className="flex flex-wrap gap-2">
          {learningTabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={learningTab === item.id} onClick={() => setLearningTab(item.id)} className={`rounded-t-xl border-b-2 px-4 py-3 text-sm font-bold transition ${learningTab === item.id ? 'border-[#5D866C] bg-white text-[#31533d]' : 'border-transparent text-[#789083] hover:text-[#31533d]'}`}>{item.label}</button>)}
        </div>
      </div>
      <div className="mt-6">
        {learningTab === 'overview' && <div role="tabpanel" className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div><div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-display text-lg font-bold text-[#284633]">Your subjects</h2><p className="mt-1 text-xs text-[#789083]">Subjects you are enrolled in.</p></div><button type="button" onClick={() => setLearningTab('subjects')} className="text-xs font-bold text-[#5D866C] hover:text-[#31533d]">View all →</button></div>
            <div className="card divide-y divide-[#31533d]/8">{enrolledSubjects.slice(0, 4).map((subject) => <div key={subject.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="text-sm font-bold text-[#284633]">{subject.name}</p><p className="mt-1 text-[10px] text-[#789083]">{subject.code}</p></div><span className="rounded-full bg-[#E6D8C3]/45 px-3 py-1 text-[10px] font-bold text-[#5D866C]">{subject.level}</span></div>)}{!enrolledSubjects.length && <p className="p-5 text-sm text-[#789083]">{dashboardLoading ? 'Loading enrolled subjects…' : 'You are not enrolled in any subjects yet.'}</p>}</div>
          </div>
          <div><div className="mb-4"><h2 className="font-display text-lg font-bold text-[#284633]">Learning progress</h2><p className="mt-1 text-xs text-[#789083]">Pick up where you left off.</p></div>{progressCard}</div>
        </div>}
        {learningTab === 'subjects' && <section role="tabpanel">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-xl font-bold text-[#284633]">My subjects</h2><p className="mt-1 text-sm text-[#789083]">{visibleSubjects.length} of {enrolledSubjects.length} enrolled subjects</p></div>
            <div className="flex flex-wrap gap-3"><label className="relative"><span className="sr-only">Search subjects</span><Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#789083]" /><input className="form-input pl-9" value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder="Search subjects" /></label><label><span className="sr-only">Filter by level</span><select className="form-input min-w-36" value={subjectLevel} onChange={(event) => setSubjectLevel(event.target.value)}><option value="all">All levels</option><option value="O Level">O Level</option><option value="A Level">A Level</option></select></label></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleSubjects.map((subject) => <article key={subject.id} className="card p-5"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E6D8C3]/55 text-[#5D866C]"><Icon name="book" /></span><span className="rounded-full bg-[#5D866C]/10 px-3 py-1 text-[10px] font-bold text-[#5D866C]">{subject.level}</span></div><h3 className="font-display mt-5 text-lg font-bold text-[#284633]">{subject.name}</h3><p className="mt-1 text-xs text-[#789083]">Syllabus code {subject.code}</p></article>)}{!visibleSubjects.length && <p className="card p-5 text-sm text-[#789083]">{dashboardLoading ? 'Loading subjects…' : 'No subjects match those filters.'}</p>}</div>
        </section>}
        {learningTab === 'progress' && <section role="tabpanel" className="mx-auto max-w-3xl">{progressCard}</section>}
      </div>
    </DashboardFrame>
  )
}
function LegacyInstructorDashboard() {
  return (
    <DashboardFrame
      eyebrow="Instructor dashboard"
      title="Your classroom at a glance"
      subtitle="Track learner momentum and focus where your support matters most."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total students"
          value="1,284"
          detail="+84 in the last 30 days"
          icon="users"
          accent
        />
        <StatCard label="Active courses" value="8" detail="3 drafts in progress" icon="book" />
        <StatCard label="Avg. completion" value="76%" detail="+5.4% vs last month" icon="chart" />
        <StatCard label="Assignments due" value="23" detail="12 need your review" icon="file" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div>
          <SectionTitle title="Course performance" action="View analytics" />
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[1.5fr_.65fr_.65fr_.45fr] gap-4 border-b border-[#31533d]/8 bg-[#E6D8C3]/18 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#789083] md:grid">
              <span>Course</span>
              <span>Students</span>
              <span>Progress</span>
              <span />
            </div>
            <CourseRow title="Data Foundations" students="468" progress={82} color="#5D866C" />
            <CourseRow title="Python for Beginners" students="356" progress={74} color="#C2A68C" />
            <CourseRow title="SQL Essentials" students="291" progress={68} color="#789083" />
            <CourseRow title="Data Storytelling" students="169" progress={91} color="#31533d" />
          </div>
        </div>
        <div>
          <SectionTitle title="Engagement" action="Last 30 days" />
          <div className="card p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-[#789083]">Active learners</p>
                <p className="font-display mt-1 text-3xl font-bold text-[#284633]">892</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#5D866C]">
                <Icon name="trend" size={14} /> 12.5%
              </span>
            </div>
            <svg viewBox="0 0 360 145" className="mt-4 w-full overflow-visible">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5D866C" stopOpacity=".28" />
                  <stop offset="1" stopColor="#5D866C" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 70, 110].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="360"
                  y2={y}
                  stroke="#E6D8C3"
                  strokeDasharray="4 4"
                />
              ))}
              <path
                d="M0 117 C35 110 49 86 78 91 S125 72 151 76 S190 45 220 59 S267 40 291 43 S330 20 360 28 V145 H0Z"
                fill="url(#area)"
              />
              <path
                d="M0 117 C35 110 49 86 78 91 S125 72 151 76 S190 45 220 59 S267 40 291 43 S330 20 360 28"
                fill="none"
                stroke="#5D866C"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="360" cy="28" r="5" fill="#5D866C" stroke="white" strokeWidth="3" />
            </svg>
            <div className="flex justify-between text-[9px] font-bold text-[#8b9890]">
              <span>1 MAY</span>
              <span>8 MAY</span>
              <span>15 MAY</span>
              <span>22 MAY</span>
              <span>30 MAY</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div>
          <SectionTitle title="Recent student activity" action="See all" />
          <div className="card divide-y divide-[#31533d]/8">
            <Activity
              initials="LM"
              name="Leya Mbewe"
              text="completed Python for Beginners"
              time="8 min ago"
            />
            <Activity
              initials="SK"
              name="Sam Kunda"
              text="submitted a SQL Essentials project"
              time="24 min ago"
            />
            <Activity
              initials="TN"
              name="Thoko Ndlovu"
              text="earned the Data Foundations certificate"
              time="1 hr ago"
            />
          </div>
        </div>
        <div>
          <SectionTitle title="Needs attention" />
          <div className="card p-5">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E6D8C3]/60 text-[#5D866C]">
                <Icon name="clock" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#284633]">12 submissions to review</h3>
                <p className="mt-1 text-xs leading-5 text-[#789083]">
                  Oldest submission has been waiting for 2 days.
                </p>
                <button className="mt-3 text-xs font-bold text-[#5D866C]">Start reviewing →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardFrame>
  )
}

function InstructorDashboard({ supabase, userId, onOpenSubjects }: { supabase: SupabaseClient; userId: string; onOpenSubjects: () => void }) {
  const [stats, setStats] = useState<{ subjects: number; classes: number; learners: number; lessons: number; assignments: number } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const load = async () => {
      const { data: rows, error: assignmentError } = await supabase.from('teacher_assignments').select('subject_id, class_id').eq('teacher_id', userId)
      if (!active) return
      if (assignmentError) { setError(assignmentError.message); return }
      const classIds = [...new Set((rows ?? []).map((item) => item.class_id))]
      const subjectIds = [...new Set((rows ?? []).map((item) => item.subject_id))]
      if (!classIds.length || !subjectIds.length) { setStats({ subjects: 0, classes: 0, learners: 0, lessons: 0, assignments: 0 }); return }
      const [learners, lessons, assignments] = await Promise.all([
        supabase.from('student_class_enrollments').select('student_id', { count: 'exact' }).in('class_id', classIds),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('teacher_id', userId),
        supabase.from('classroom_assignments').select('id', { count: 'exact', head: true }).eq('created_by', userId),
      ])
      const failure = [learners, lessons, assignments].find((item) => item.error)
      if (failure?.error) { setError(failure.error.message); return }
      if (active) setStats({ subjects: subjectIds.length, classes: classIds.length, learners: learners.data?.length ?? 0, lessons: lessons.count ?? 0, assignments: assignments.count ?? 0 })
    }
    void load()
    return () => { active = false }
  }, [supabase, userId])
  return <DashboardFrame eyebrow="Teacher dashboard" title="Your teaching workspace" subtitle="A live summary of the subjects and classes allocated to you.">
    {error && <p role="alert" className="mb-4 rounded-xl bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">Could not load teaching activity: {error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Assigned subjects" value={stats?.subjects.toLocaleString() ?? '…'} detail="Subjects in your allocation" icon="book" accent /><StatCard label="My classes" value={stats?.classes.toLocaleString() ?? '…'} detail="Classes you teach" icon="users" /><StatCard label="Enrolled learners" value={stats?.learners.toLocaleString() ?? '…'} detail="Across assigned classes" icon="users" /><StatCard label="Lessons & assignments" value={stats ? `${stats.lessons} / ${stats.assignments}` : '…'} detail="Lessons / assignments created" icon="file" /></div>
    <section className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6"><div><h2 className="font-display text-lg font-bold">My Subjects</h2><p className="mt-1 text-sm text-[#789083]">Open an assigned subject to manage its lessons, resources, submissions, and learners.</p></div><button type="button" onClick={onOpenSubjects} className="primary-button">Open My Subjects</button></section>
  </DashboardFrame>
}

type AdminOverviewData = {
  totals: { users: number; learners: number; instructors: number; admins: number; subjects: number; enrollments: number; classes: number; teacherAssignments: number }
  monthlySignups: { label: string; count: number }[]
  topSubjects: { id: string; name: string; level: string; enrollments: number }[]
  recentUsers: { id: string; name: string; role: string; createdAt: string }[]
}

function formatAcademicDataError(error: unknown) {
  const detail: { code?: unknown; message?: unknown } = error && typeof error === 'object'
    ? error as { code?: unknown; message?: unknown }
    : {}
  const message = typeof detail.message === 'string' ? detail.message : ''
  if (detail.code === 'PGRST205' || /could not find the table .* in the schema cache/i.test(message)) {
    return 'The academic structure is not available in Supabase yet. Apply supabase/migrations/202611210001_academic_structure.sql. If it was already applied, refresh the Supabase API schema cache, then reload this page.'
  }
  return message || 'Could not load the academic data.'
}

function AdminDashboard({
  supabase,
  onManageUsers,
}: {
  supabase: SupabaseClient
  onManageUsers: () => void
}) {
  const [overview, setOverview] = useState<AdminOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const roleCounts = await Promise.all(
        (['learner', 'instructor', 'admin'] as const).map(async (role) => {
          const result = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', role)
          if (result.error) throw result.error
          return result.count ?? 0
        }),
      )
      const [userCountResult, enrollmentCountResult, classesCountResult, teacherAssignmentsResult, subjectsResult, recentUsersResult, classSubjectsResult] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('student_class_enrollments').select('id', { count: 'exact', head: true }),
          supabase.from('classes').select('id', { count: 'exact', head: true }),
          supabase.from('teacher_assignments').select('id', { count: 'exact', head: true }),
          supabase.from('subjects').select('id, name, level, archived_at').is('archived_at', null),
          supabase
            .from('profiles')
            .select('id, full_name, username, role, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('class_subjects').select('subject_id, class_id'),
        ])
      if (userCountResult.error) throw userCountResult.error
      if (enrollmentCountResult.error) throw enrollmentCountResult.error
      if (classesCountResult.error) throw classesCountResult.error
      if (teacherAssignmentsResult.error) throw teacherAssignmentsResult.error
      if (subjectsResult.error) throw subjectsResult.error
      if (recentUsersResult.error) throw recentUsersResult.error
      if (classSubjectsResult.error) throw classSubjectsResult.error

      const now = new Date()
      const months = Array.from({ length: 6 }, (_, index) => {
        const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - 4 + index, 1)
        return { month, nextMonth }
      })
      const monthlySignups = await Promise.all(
        months.map(async ({ month, nextMonth }) => {
          const result = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', month.toISOString())
            .lt('created_at', nextMonth.toISOString())
          if (result.error) throw result.error
          return {
            label: month.toLocaleDateString('en-ZW', { month: 'short' }),
            count: result.count ?? 0,
          }
        }),
      )

      const subjectsWithCounts = await Promise.all(
        (subjectsResult.data ?? []).map(async (subject) => {
          const classIds = [...new Set((classSubjectsResult.data ?? []).filter((item) => item.subject_id === subject.id).map((item) => item.class_id))]
          const result = classIds.length
            ? await supabase.from('student_class_enrollments').select('student_id').in('class_id', classIds)
            : { data: [], error: null }
          if (result.error) throw result.error
          return {
            id: subject.id,
            name: subject.name,
            level: subject.level,
            enrollments: new Set((result.data ?? []).map((item) => item.student_id)).size,
          }
        }),
      )
      setOverview({
        totals: {
          users: userCountResult.count ?? 0,
          learners: roleCounts[0],
          instructors: roleCounts[1],
          admins: roleCounts[2],
          subjects: subjectsWithCounts.length,
          enrollments: enrollmentCountResult.count ?? 0,
          classes: classesCountResult.count ?? 0,
          teacherAssignments: teacherAssignmentsResult.count ?? 0,
        },
        monthlySignups,
        topSubjects: subjectsWithCounts.sort((a, b) => b.enrollments - a.enrollments),
        recentUsers: (recentUsersResult.data ?? []).map((user) => ({
          id: user.id,
          name: user.full_name || user.username,
          role: user.role,
          createdAt: user.created_at,
        })),
      })
    } catch (loadError) {
      setError(formatAcademicDataError(loadError))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const downloadReport = () => {
    if (!overview) return
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [
      ['Metric', 'Value'],
      ['Total users', overview.totals.users],
      ['Learners', overview.totals.learners],
      ['Instructors', overview.totals.instructors],
      ['Administrators', overview.totals.admins],
      ['Active subjects', overview.totals.subjects],
      ['Course enrollments', overview.totals.enrollments],
      ['Classes', overview.totals.classes],
      ['Teacher assignments', overview.totals.teacherAssignments],
      ['', ''],
      ['Month', 'New accounts'],
      ...overview.monthlySignups.map(({ label, count }) => [label, count] as [string, number]),
      ['', ''],
      ['Subject', 'Level', 'Enrollments'],
      ...overview.topSubjects.map(({ name, level, enrollments }) => [name, level, enrollments]),
    ]
    const report = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([report], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'dzikaz-academy-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const totals = overview?.totals
  const formatMetric = (value: number | undefined) =>
    overview ? (value ?? 0).toLocaleString() : loading ? '…' : '—'
  const rolePercent = (count: number) =>
    totals?.users ? Math.round((count / totals.users) * 100) : 0
  const maxMonthlySignups = Math.max(1, ...(overview?.monthlySignups.map((month) => month.count) ?? []))

  return (
    <DashboardFrame
      eyebrow="Admin dashboard"
      title="Academy overview"
      subtitle="Live account, enrollment, and subject activity from the academy database."
      action={overview ? 'Download report' : undefined}
      onAction={downloadReport}
    >
      {error && (
        <div role="alert" className="mb-5 rounded-xl bg-[#9b7466]/10 p-4 text-sm text-[#8a5548]">
          Could not load the overview: {error}
          <button type="button" onClick={() => void loadOverview()} className="ml-3 font-bold underline">
            Try again
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total accounts" value={formatMetric(totals?.users)} detail="Registered academy users" icon="users" accent />
        <StatCard label="Learners" value={formatMetric(totals?.learners)} detail="Learner accounts" icon="users" />
        <StatCard label="Instructors" value={formatMetric(totals?.instructors)} detail="Instructor accounts" icon="user" />
        <StatCard label="Classes & allocations" value={formatMetric(totals?.classes)} detail={`${formatMetric(totals?.teacherAssignments)} teacher assignments · ${formatMetric(totals?.enrollments)} class enrollments`} icon="book" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle title="New accounts" action="Refresh" onAction={() => void loadOverview()} />
          <div className="card p-5 md:p-6">
            <div className="flex flex-wrap gap-6">
              <MetricDot color="#5D866C" label="New accounts, last 6 months" value={formatMetric(overview?.monthlySignups.reduce((sum, item) => sum + item.count, 0))} />
              <MetricDot color="#C2A68C" label="Current enrollments" value={formatMetric(totals?.enrollments)} />
            </div>
            <div className="relative mt-8 flex h-52 items-end gap-3 border-b border-l border-[#31533d]/10 px-4">
              {overview?.monthlySignups.map((month) => (
                <div key={month.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-[#789083]">{month.count}</span>
                  <div className="flex h-[78%] w-full items-end justify-center">
                    <div
                      className="w-8 max-w-full rounded-t-md bg-[#5D866C] transition-all"
                      title={`${month.count} accounts`}
                      style={{ height: `${month.count ? Math.max(4, (month.count / maxMonthlySignups) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-[#8b9890]">{month.label}</span>
                </div>
              ))}
              {!overview && !loading && <p className="absolute inset-0 grid place-items-center text-sm text-[#789083]">No account data yet.</p>}
              {loading && !overview && <p className="absolute inset-0 grid place-items-center text-sm text-[#789083]">Loading account activity…</p>}
            </div>
          </div>
        </div>
        <div>
          <SectionTitle title="User distribution" />
          <div className="card p-6">
            <div className="flex items-center justify-center gap-8">
              <div
                className="relative h-36 w-36 rounded-full"
                style={{
                  background: `conic-gradient(#5D866C 0 ${rolePercent(totals?.learners ?? 0)}%, #C2A68C ${rolePercent(totals?.learners ?? 0)}% ${rolePercent((totals?.learners ?? 0) + (totals?.instructors ?? 0))}%, #E6D8C3 ${rolePercent((totals?.learners ?? 0) + (totals?.instructors ?? 0))}% 100%)`,
                }}
              >
                <div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="font-display text-2xl font-bold text-[#284633]">{formatMetric(totals?.users)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#789083]">Users</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Legend color="#5D866C" label="Learners" value={`${(totals?.learners ?? 0).toLocaleString()} · ${rolePercent(totals?.learners ?? 0)}%`} />
                <Legend color="#C2A68C" label="Instructors" value={`${(totals?.instructors ?? 0).toLocaleString()} · ${rolePercent(totals?.instructors ?? 0)}%`} />
                <Legend color="#E6D8C3" label="Admins" value={`${(totals?.admins ?? 0).toLocaleString()} · ${rolePercent(totals?.admins ?? 0)}%`} />
              </div>
            </div>
            <button type="button" onClick={onManageUsers} className="mt-7 w-full rounded-xl border border-[#31533d]/12 py-3 text-xs font-bold text-[#5D866C] hover:bg-[#F5F5F0]">
              Manage users
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle title="Most enrolled subjects" action="Download report" onAction={downloadReport} />
          <div className="card overflow-hidden">
            {overview?.topSubjects.length ? overview.topSubjects.slice(0, 5).map((subject, index) => (
              <RankRow
                key={subject.id}
                rank={String(index + 1).padStart(2, '0')}
                title={subject.name}
                category={subject.level}
                score={`${subject.enrollments.toLocaleString()} enrolled`}
              />
            )) : (
              <p className="p-5 text-sm text-[#789083]">{loading ? 'Loading subjects…' : 'No active subjects yet.'}</p>
            )}
          </div>
        </div>
        <div>
          <SectionTitle title="Recent account activity" action="Manage users" onAction={onManageUsers} />
          <div className="card divide-y divide-[#31533d]/8">
            {overview?.recentUsers.length ? overview.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#284633]">{user.name}</p>
                  <p className="mt-1 text-[10px] capitalize text-[#789083]">{user.role}</p>
                </div>
                <time className="shrink-0 text-[10px] text-[#929e97]" dateTime={user.createdAt}>
                  {new Date(user.createdAt).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
              </div>
            )) : (
              <p className="p-5 text-sm text-[#789083]">{loading ? 'Loading accounts…' : 'No account activity yet.'}</p>
            )}
          </div>
        </div>
      </div>
    </DashboardFrame>
  )
}

function AdminSettingsPage({
  supabase,
  organizationName,
  onOrganizationNameChange,
  onManageUsers,
}: {
  supabase: SupabaseClient
  organizationName: string
  onOrganizationNameChange: (name: string) => void
  onManageUsers: () => void
}) {
  const [section, setSection] = useState<'academy' | 'access' | 'communication'>('academy')
  const [nameDraft, setNameDraft] = useState(organizationName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => setNameDraft(organizationName), [organizationName])

  const saveOrganizationName = async (event: FormEvent) => {
    event.preventDefault()
    const name = nameDraft.trim()
    if (!name || name.length > 100) {
      setError('Use an academy name between 1 and 100 characters.')
      setMessage('')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    const { data: savedSetting, error: saveError } = await supabase
      .from('academy_settings')
      .update({ organization_name: name })
      .eq('id', 'academy')
      .select('id')
      .maybeSingle()
    setSaving(false)
    if (saveError || !savedSetting) {
      setError(saveError?.message ?? 'Only an administrator can change the academy name.')
      return
    }
    onOrganizationNameChange(name)
    setMessage('Academy name updated.')
  }

  return (
    <DashboardFrame
      eyebrow="Admin dashboard"
      title="Settings"
      subtitle="Manage the academy identity and review account access."
    >
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="card h-fit overflow-hidden p-2">
          {([
            ['academy', 'Academy'],
            ['access', 'Access & privacy'],
            ['communication', 'Email delivery'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={section === key}
              onClick={() => setSection(key)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${section === key ? 'bg-[#E6D8C3]/45 text-[#31533d]' : 'text-[#789083] hover:bg-[#F5F5F0]'}`}
            >
              {label}
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </nav>

        <div className="space-y-5">
          {section === 'academy' ? (
            <section role="tabpanel" className="card overflow-hidden">
              <div className="border-b border-[#31533d]/10 px-6 py-5">
                <h2 className="font-display text-lg font-bold text-[#284633]">Academy identity</h2>
                <p className="mt-1 text-sm text-[#789083]">This name appears in the academy navigation and sign-in screen.</p>
              </div>
              <form onSubmit={saveOrganizationName} className="flex flex-wrap items-end gap-3 p-6">
                <div className="min-w-[220px] flex-1">
                  <Field label="Organization name">
                    <input
                      className="form-input"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      maxLength={100}
                      required
                    />
                  </Field>
                </div>
                <button type="submit" disabled={saving} className="primary-button disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save name'}
                </button>
              </form>
              {error && <p role="alert" className="mx-6 mb-5 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
              {message && <p role="status" className="mx-6 mb-5 rounded-lg bg-[#5D866C]/10 p-3 text-sm text-[#31533d]">{message}</p>}
            </section>
          ) : section === 'access' ? (
            <section role="tabpanel" className="space-y-5">
              <div className="card overflow-hidden">
                <div className="border-b border-[#31533d]/10 px-6 py-5">
                  <h2 className="font-display text-lg font-bold text-[#284633]">Accounts & roles</h2>
                  <p className="mt-1 text-sm text-[#789083]">Administrators control roles and academy accounts.</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#31533d]">User management</p>
                    <p className="mt-1 max-w-xl text-xs leading-5 text-[#789083]">Create learner, instructor, or administrator accounts and remove accounts that are no longer needed.</p>
                  </div>
                  <button type="button" onClick={onManageUsers} className="secondary-button">Manage users</button>
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="border-b border-[#31533d]/10 px-6 py-5">
                  <h2 className="font-display text-lg font-bold text-[#284633]">Privacy & data</h2>
                  <p className="mt-1 text-sm text-[#789083]">Access follows the signed-in account’s academy role.</p>
                </div>
                <ul className="divide-y divide-[#31533d]/8 px-6">
                  <li className="flex items-start gap-3 py-4">
                    <Icon name="check" size={18} className="mt-0.5 text-[#5D866C]" />
                    <div><p className="text-sm font-semibold text-[#31533d]">Student records stay restricted</p><p className="mt-1 text-xs leading-5 text-[#789083]">Student details and submissions are limited by database access policies.</p></div>
                  </li>
                  <li className="flex items-start gap-3 py-4">
                    <Icon name="check" size={18} className="mt-0.5 text-[#5D866C]" />
                    <div><p className="text-sm font-semibold text-[#31533d]">Account roles are administrator-managed</p><p className="mt-1 text-xs leading-5 text-[#789083]">Users cannot promote their own account through profile settings.</p></div>
                  </li>
                </ul>
              </div>
            </section>
          ) : (
            <section role="tabpanel" className="card overflow-hidden">
              <div className="border-b border-[#31533d]/10 px-6 py-5">
                <h2 className="font-display text-lg font-bold text-[#284633]">Email delivery paused</h2>
                <p className="mt-1 text-sm text-[#789083]">Automated academy account emails are disabled until sender-domain setup is complete.</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E6D8C3]/55 text-[#5D866C]"><Icon name="mail" /></span>
                  <div>
                    <p className="text-sm font-semibold text-[#31533d]">Account credentials</p>
                    <p className="mt-1 max-w-xl text-xs leading-5 text-[#789083]">Automated account emails are paused while the academy sender domain is being configured. User Management shows a new account&apos;s temporary password once so you can share it securely. Supabase Auth verification and password-recovery emails are separate.</p>
                  </div>
                </div>
                <button type="button" onClick={onManageUsers} className="secondary-button">Create an account</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardFrame>
  )
}

function AdminAcademicPage({ supabase, section }: { supabase: SupabaseClient; section: string }) {
  const [years, setYears] = useState<{ id: string; name: string }[]>([])
  const [terms, setTerms] = useState<{ id: string; academic_year_id: string; name: string; starts_on: string | null; ends_on: string | null }[]>([])
  const [classes, setClasses] = useState<AcademicClass[]>([])
  const [subjects, setSubjects] = useState<AcademicSubject[]>([])
  const [classSubjects, setClassSubjects] = useState<{ id: string; subject_id: string; class_id: string; academic_year_id: string }[]>([])
  const [people, setPeople] = useState<AcademicPerson[]>([])
  const [assignments, setAssignments] = useState<{ id: string; teacher_id: string; subject_id: string; class_id: string; academic_year_id: string }[]>([])
  const [enrollments, setEnrollments] = useState<{ id: string; student_id: string; class_id: string }[]>([])
  const [issues, setIssues] = useState<{ id: string; source_table: string; source_id: string; reason: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [editingSubject, setEditingSubject] = useState<AcademicSubject | null>(null)
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [subjectLevel, setSubjectLevel] = useState<'O Level' | 'A Level'>('O Level')
  const [subjectDescription, setSubjectDescription] = useState('')
  const [className, setClassName] = useState('')
  const [classGrade, setClassGrade] = useState('Form 1')
  const [classStream, setClassStream] = useState('')
  const [classDescription, setClassDescription] = useState('')
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()))
  const [termName, setTermName] = useState('')
  const [termYearId, setTermYearId] = useState('')
  const [termStart, setTermStart] = useState('')
  const [termEnd, setTermEnd] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [assignmentSubjectId, setAssignmentSubjectId] = useState('')
  const [assignmentClassId, setAssignmentClassId] = useState('')
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [subjectOfferId, setSubjectOfferId] = useState('')
  const [offeredClassId, setOfferedClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [enrollmentClassId, setEnrollmentClassId] = useState('')
  const [materialSubjectId, setMaterialSubjectId] = useState('')
  const [materialClassId, setMaterialClassId] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialFile, setMaterialFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [yearResult, classResult, subjectResult, peopleResult, assignmentResult, enrollmentResult, issueResult, classSubjectsResult, termResult] = await Promise.all([
      supabase.from('academic_years').select('id, name').order('name', { ascending: false }),
      supabase.from('classes').select('id, name, grade, stream, description, academic_year_id').order('name'),
      supabase.from('subjects').select('id, name, level, code, description, archived_at').order('name'),
      supabase.from('profiles').select('id, full_name, username, role').in('role', ['learner', 'instructor']).order('full_name'),
      supabase.from('teacher_assignments').select('id, teacher_id, subject_id, class_id, academic_year_id'),
      supabase.from('student_class_enrollments').select('id, student_id, class_id'),
      supabase.from('academic_migration_issues').select('id, source_table, source_id, reason').order('recorded_at'),
      supabase.from('class_subjects').select('id, subject_id, class_id, academic_year_id'),
      supabase.from('academic_terms').select('id, academic_year_id, name, starts_on, ends_on').order('starts_on'),
    ])
    const failed = [yearResult, classResult, subjectResult, peopleResult, assignmentResult, enrollmentResult, issueResult, classSubjectsResult, termResult].find((result) => result.error)
    if (failed?.error) setError(`Could not load academic management data: ${formatAcademicDataError(failed.error)}`)
    else {
      setYears(yearResult.data ?? [])
      setClasses(classResult.data ?? [])
      setSubjects(subjectResult.data ?? [])
      setPeople((peopleResult.data ?? []) as AcademicPerson[])
      setAssignments(assignmentResult.data ?? [])
      setEnrollments(enrollmentResult.data ?? [])
      setIssues(issueResult.data ?? [])
      setClassSubjects(classSubjectsResult.data ?? [])
      setTerms(termResult.data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { void load() }, [load])

  const saveSubject = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setMessage(''); setSaving(true)
    const values = { name: subjectName.trim(), code: subjectCode.trim(), level: subjectLevel, description: subjectDescription.trim() }
    const result = editingSubject
      ? await supabase.from('subjects').update(values).eq('id', editingSubject.id).select('id').maybeSingle()
      : await supabase.from('subjects').insert(values).select('id').maybeSingle()
    setSaving(false)
    if (result.error || !result.data) { setError(result.error?.message ?? 'Subject was not saved.'); return }
    setSubjectName(''); setSubjectCode(''); setSubjectDescription(''); setEditingSubject(null)
    setMessage(editingSubject ? 'Subject updated.' : 'Subject created.')
    await load()
  }

  const saveClass = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setMessage(''); setSaving(true)
    const yearName = academicYear.trim()
    const { data: year, error: yearError } = await supabase.from('academic_years').upsert({ name: yearName }, { onConflict: 'name' }).select('id').single()
    if (yearError) { setSaving(false); setError(yearError.message); return }
    const values = { name: className.trim(), grade: classGrade.trim(), stream: classStream, description: classDescription.trim(), academic_year_id: year.id }
    const result = editingClass
      ? await supabase.from('classes').update(values).eq('id', editingClass.id).select('id').maybeSingle()
      : await supabase.from('classes').insert(values).select('id').maybeSingle()
    setSaving(false)
    if (result.error || !result.data) { setError(result.error?.message ?? 'Class was not saved.'); return }
    setClassName(''); setClassGrade('Form 1'); setClassStream(''); setClassDescription(''); setEditingClass(null)
    setMessage(editingClass ? 'Class updated.' : 'Class created.')
    await load()
  }

  const createAssignment = async (event: FormEvent) => {
    event.preventDefault()
    const selectedClass = classes.find((item) => item.id === assignmentClassId)
    if (!selectedClass) return
    if (!classSubjects.some((item) => item.subject_id === assignmentSubjectId && item.class_id === selectedClass.id)) {
      setError('Offer this subject to the selected class before assigning a teacher.')
      return
    }
    setSaving(true); setError(''); setMessage('')
    const values = { teacher_id: teacherId, subject_id: assignmentSubjectId, class_id: selectedClass.id, academic_year_id: selectedClass.academic_year_id }
    const { error: saveError } = editingAssignment
      ? await supabase.from('teacher_assignments').update(values).eq('id', editingAssignment)
      : await supabase.from('teacher_assignments').insert(values)
    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    setMessage(editingAssignment ? 'Teacher assignment updated.' : 'Teacher assignment created.')
    setEditingAssignment(null); setTeacherId(''); setAssignmentSubjectId(''); setAssignmentClassId(''); await load()
  }

  const offerSubjectToClass = async (event: FormEvent) => {
    event.preventDefault()
    const selectedClass = classes.find((item) => item.id === offeredClassId)
    if (!selectedClass) return
    setSaving(true); setError(''); setMessage('')
    const { error: offerError } = await supabase.from('class_subjects').insert({ subject_id: subjectOfferId, class_id: selectedClass.id, academic_year_id: selectedClass.academic_year_id })
    setSaving(false)
    if (offerError) { setError(offerError.message); return }
    setMessage('Subject is now offered to that class.'); setSubjectOfferId(''); setOfferedClassId(''); await load()
  }

  const createEnrollment = async (event: FormEvent) => {
    event.preventDefault()
    const selectedClass = classes.find((item) => item.id === enrollmentClassId)
    if (!selectedClass) return
    setSaving(true); setError(''); setMessage('')
    const { error: saveError } = await supabase.from('student_class_enrollments').insert({ student_id: studentId, class_id: selectedClass.id, academic_year_id: selectedClass.academic_year_id })
    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    setMessage('Student enrolled in class.'); await load()
  }

  const createTerm = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    const { error: termError } = await supabase.from('academic_terms').insert({ academic_year_id: termYearId, name: termName.trim(), starts_on: termStart || null, ends_on: termEnd || null })
    setSaving(false)
    if (termError) { setError(termError.message); return }
    setTermName(''); setTermStart(''); setTermEnd(''); setMessage('Academic term created.'); await load()
  }

  const uploadSubjectMaterial = async (event: FormEvent) => {
    event.preventDefault()
    if (!materialSubjectId || !materialClassId || !materialFile || !materialTitle.trim()) return
    if (!classSubjects.some((item) => item.subject_id === materialSubjectId && item.class_id === materialClassId)) {
      setError('Offer this subject to the selected class before uploading material.')
      return
    }
    setSaving(true); setError(''); setMessage('')
    let storagePath = ''
    let fileUploaded = false
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error(userError?.message ?? 'Your admin session is no longer valid.')
      const mimeType = getClassroomFileMimeType(materialFile)
      storagePath = `subjects/${materialSubjectId}/classes/${materialClassId}/materials/${crypto.randomUUID()}-${safeClassroomFileName(materialFile.name)}`
      const { error: uploadError } = await supabase.storage.from(classroomBucket).upload(storagePath, materialFile, { contentType: mimeType, upsert: false })
      if (uploadError) throw uploadError
      fileUploaded = true
      const { error: insertError } = await supabase.from('classroom_documents').insert({
        subject_id: materialSubjectId, class_id: materialClassId, uploaded_by: user.id,
        title: materialTitle.trim(), file_name: materialFile.name, storage_path: storagePath,
        mime_type: mimeType, size_bytes: materialFile.size,
      })
      if (insertError) throw insertError
      setMaterialTitle(''); setMaterialFile(null); setMessage('Subject material uploaded for the selected class.')
    } catch (uploadError) {
      let errorMessage = uploadError instanceof Error ? uploadError.message : 'Could not upload the subject material.'
      if (fileUploaded && storagePath) {
        const { error: cleanupError } = await supabase.storage.from(classroomBucket).remove([storagePath])
        if (cleanupError) errorMessage = `${errorMessage} Temporary upload cleanup failed: ${cleanupError.message}`
      }
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const removeRecord = async (table: 'teacher_assignments' | 'student_class_enrollments' | 'classes', id: string, prompt: string) => {
    if (!window.confirm(prompt)) return
    const { error: removeError } = await supabase.from(table).delete().eq('id', id)
    if (removeError) setError(removeError.message)
    else { setMessage('Record removed.'); await load() }
  }
  const filteredSubjects = subjects.filter((item) => `${item.name} ${item.code} ${item.level}`.toLowerCase().includes(search.trim().toLowerCase()))
  const teachers = people.filter((item) => item.role === 'instructor')
  const learners = people.filter((item) => item.role === 'learner')
  const panelTitle: Record<string, string> = {
    'Classes & Grades': 'Classes & Grades', Subjects: 'Subjects', 'Teacher Assignments': 'Teacher Assignments',
    'Student Enrolments': 'Student Enrolments', 'Academic Reports': 'Academic Reports',
  }

  return <DashboardFrame eyebrow="Academic administration" title={panelTitle[section] ?? 'Academic Reports'} subtitle="Manage the academy structure and assignments from live records.">
    {(error || message) && <p role={error ? 'alert' : 'status'} className={`mb-4 rounded-xl p-3 text-sm ${error ? 'bg-[#9b7466]/10 text-[#8a5548]' : 'bg-[#5D866C]/10 text-[#31533d]'}`}>{error || message}</p>}
    {loading ? <div className="card p-6 text-sm text-[#789083]">Loading academic records…</div> : <>
      {section === 'Subjects' && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
        <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#31533d]/10 p-5"><h2 className="font-display text-lg font-bold">Available subjects <span className="ml-1 text-sm font-medium text-[#789083]">{subjects.length}</span></h2><input className="form-input max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects" aria-label="Search subjects" /></div>
          <div className="divide-y divide-[#31533d]/8">{filteredSubjects.map((subject) => <article key={subject.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-[#284633]">{subject.name} <span className="text-xs font-normal text-[#789083]">{subject.code} · {subject.level}</span></p><p className="mt-1 text-xs text-[#789083]">{subject.description || 'No description'}{subject.archived_at ? ' · Inactive' : ''}</p></div><div className="flex gap-2"><button type="button" className="secondary-button" onClick={() => { setEditingSubject(subject); setSubjectName(subject.name); setSubjectCode(subject.code); setSubjectLevel(subject.level); setSubjectDescription(subject.description) }}>Edit</button><button type="button" className="secondary-button" onClick={async () => { const archived_at = subject.archived_at ? null : new Date().toISOString(); const { error: updateError } = await supabase.from('subjects').update({ archived_at }).eq('id', subject.id); if (updateError) setError(updateError.message); else { setMessage(archived_at ? 'Subject deactivated. Historical records are retained.' : 'Subject reactivated.'); await load() } }}>{subject.archived_at ? 'Reactivate' : 'Deactivate'}</button></div></article>)}{!filteredSubjects.length && <p className="p-5 text-sm text-[#789083]">No subjects match your search.</p>}</div>
        </section>
        <div className="space-y-5">
          <form onSubmit={offerSubjectToClass} className="card space-y-4 p-5"><h2 className="font-display text-lg font-bold">Offer a subject to a class</h2><p className="text-xs leading-5 text-[#789083]">Subjects exist independently of teachers. Allocate a teacher separately in Teacher Assignments.</p><Field label="Subject"><select className="form-input" value={subjectOfferId} onChange={(event) => setSubjectOfferId(event.target.value)} required><option value="">Select subject</option>{subjects.filter((item) => !item.archived_at).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></Field><Field label="Class"><select className="form-input" value={offeredClassId} onChange={(event) => setOfferedClassId(event.target.value)} required><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{academicClassLabel(item)} · {years.find((year) => year.id === item.academic_year_id)?.name}</option>)}</select></Field><button className="primary-button" disabled={saving}>Associate subject and class</button><div className="border-t border-[#31533d]/8 pt-3">{classSubjects.map((item) => <p key={item.id} className="py-1 text-xs text-[#789083]">{subjects.find((subject) => subject.id === item.subject_id)?.name} · {academicClassLabel(classes.find((cls) => cls.id === item.class_id) ?? { name: 'Class', grade: '', stream: '' })}</p>)}</div></form>
          <form onSubmit={saveSubject} className="card space-y-4 p-5"><h2 className="font-display text-lg font-bold">{editingSubject ? 'Edit subject' : 'Create subject'}</h2><Field label="Subject name"><input className="form-input" value={subjectName} onChange={(event) => setSubjectName(event.target.value)} maxLength={120} required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Subject code"><input className="form-input" value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} maxLength={40} required /></Field><Field label="Level"><select className="form-input" value={subjectLevel} onChange={(event) => setSubjectLevel(event.target.value as AcademicSubject['level'])}><option>O Level</option><option>A Level</option></select></Field></div><Field label="Description"><textarea className="form-input min-h-24" value={subjectDescription} onChange={(event) => setSubjectDescription(event.target.value)} maxLength={1000} /></Field><div className="flex justify-end gap-2">{editingSubject && <button type="button" className="secondary-button" onClick={() => { setEditingSubject(null); setSubjectName(''); setSubjectCode(''); setSubjectDescription('') }}>Cancel</button>}<button className="primary-button" disabled={saving}>{saving ? 'Saving…' : editingSubject ? 'Save subject' : 'Create subject'}</button></div></form>
          <form onSubmit={uploadSubjectMaterial} className="card space-y-4 p-5">
            <div><h2 className="font-display text-lg font-bold">Upload subject material</h2><p className="mt-1 text-xs leading-5 text-[#789083]">Admins can add a resource for any class offering. Assigned teachers can also upload resources from their subject workspace.</p></div>
            <Field label="Subject"><select className="form-input" value={materialSubjectId} onChange={(event) => { setMaterialSubjectId(event.target.value); setMaterialClassId('') }} required><option value="">Select subject</option>{subjects.filter((item) => !item.archived_at).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></Field>
            <Field label="Class"><select className="form-input" value={materialClassId} onChange={(event) => setMaterialClassId(event.target.value)} required><option value="">Select class</option>{classes.filter((item) => classSubjects.some((offering) => offering.subject_id === materialSubjectId && offering.class_id === item.id)).map((item) => <option key={item.id} value={item.id}>{academicClassLabel(item)}</option>)}</select></Field>
            <Field label="Resource title"><input className="form-input" value={materialTitle} onChange={(event) => setMaterialTitle(event.target.value)} maxLength={160} required placeholder="e.g. Form 1 algebra notes" /></Field>
            <Field label="PDF, Word, or PowerPoint file"><input key={materialFile ? 'selected-material' : 'empty-material'} className="form-input" type="file" accept=".pdf,.doc,.docx,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => setMaterialFile(event.target.files?.[0] ?? null)} required /></Field>
            <button className="primary-button" disabled={saving || !materialSubjectId || !materialClassId}>{saving ? 'Uploading…' : 'Upload material'}</button>
          </form>
        </div>
      </div>}

      {section === 'Classes & Grades' && (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
            <section className="card divide-y divide-[#31533d]/8">
              <h2 className="font-display p-5 text-lg font-bold">Classes by academic year</h2>
              {classes.map((item) => (
                <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{academicClassLabel(item)}</p>
                    <p className="text-xs text-[#789083]">{years.find((year) => year.id === item.academic_year_id)?.name} · {item.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="secondary-button" type="button" onClick={() => { setEditingClass(item); setClassName(item.name); setClassGrade(item.grade); setClassStream(item.stream); setClassDescription(item.description); setAcademicYear(years.find((year) => year.id === item.academic_year_id)?.name ?? '') }}>Edit</button>
                    <button className="secondary-button" type="button" onClick={() => void removeRecord('classes', item.id, `Remove ${academicClassLabel(item)}? This only succeeds when no enrollments or assignments reference this class.`)}>Remove</button>
                  </div>
                </article>
              ))}
              {!classes.length && <p className="p-5 text-sm text-[#789083]">No classes created yet.</p>}
            </section>
            <form onSubmit={saveClass} className="card space-y-4 p-5">
              <h2 className="font-display text-lg font-bold">{editingClass ? 'Edit class' : 'Create class or grade'}</h2>
              <Field label="Class name"><input className="form-input" value={className} onChange={(event) => setClassName(event.target.value)} maxLength={100} required placeholder="e.g. Form 1" /></Field>
              <Field label="Form level">
                <select className="form-input" value={classGrade} onChange={(event) => setClassGrade(event.target.value)} required>
                  {!['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'].includes(classGrade) && <option value={classGrade}>{classGrade}</option>}
                  {['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'].map((form) => <option key={form} value={form}>{form}</option>)}
                </select>
              </Field>
              <Field label="Section (optional)">
                <select className="form-input" value={classStream} onChange={(event) => setClassStream(event.target.value)}>
                  <option value="">No section</option>
                  {['A', 'B', 'C', 'D', 'E'].map((sectionName) => <option key={sectionName} value={sectionName}>Section {sectionName}</option>)}
                </select>
              </Field>
              <Field label="Academic year"><input className="form-input" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} maxLength={40} required placeholder="e.g. 2026" /></Field>
              <Field label="Description"><textarea className="form-input min-h-20" value={classDescription} onChange={(event) => setClassDescription(event.target.value)} maxLength={500} /></Field>
              <div className="flex justify-end gap-2">
                {editingClass && <button type="button" className="secondary-button" onClick={() => { setEditingClass(null); setClassName(''); setClassGrade('Form 1'); setClassStream(''); setClassDescription('') }}>Cancel</button>}
                <button className="primary-button" disabled={saving}>{saving ? 'Saving?' : editingClass ? 'Save class' : 'Create class'}</button>
              </div>
            </form>
          </div>
          <section className="card mt-6 p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <form onSubmit={createTerm} className="space-y-4">
                <h2 className="font-display text-lg font-bold">Academic terms</h2>
                <Field label="Academic year"><select className="form-input" value={termYearId} onChange={(event) => setTermYearId(event.target.value)} required><option value="">Select year</option>{years.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="Term name"><input className="form-input" value={termName} onChange={(event) => setTermName(event.target.value)} maxLength={40} required placeholder="Term 1" /></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="Starts"><input className="form-input" type="date" value={termStart} onChange={(event) => setTermStart(event.target.value)} /></Field><Field label="Ends"><input className="form-input" type="date" value={termEnd} onChange={(event) => setTermEnd(event.target.value)} /></Field></div>
                <button className="primary-button" disabled={saving}>Add term</button>
              </form>
              <div>
                <h3 className="font-semibold">Configured terms</h3>
                {terms.length ? terms.map((term) => <div key={term.id} className="flex items-center justify-between gap-3 border-b border-[#31533d]/8 py-3 text-sm"><span>{term.name} · {years.find((item) => item.id === term.academic_year_id)?.name}</span><span className="text-xs text-[#789083]">{term.starts_on || 'Date TBD'} ? {term.ends_on || 'Date TBD'}</span><button type="button" className="secondary-button" onClick={() => void (async () => { if (!window.confirm(`Remove ${term.name}?`)) return; const { error: removeError } = await supabase.from('academic_terms').delete().eq('id', term.id); if (removeError) setError(removeError.message); else await load() })()}>Remove</button></div>) : <p className="mt-3 text-sm text-[#789083]">No terms configured.</p>}
              </div>
            </div>
          </section>
        </>
      )}

      {section === 'Teacher Assignments' && <div className="space-y-5"><form onSubmit={createAssignment} className="card grid gap-4 p-5 md:grid-cols-4"><Field label="Teacher"><select className="form-input" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} required><option value="">Select teacher</option>{teachers.map((item) => <option key={item.id} value={item.id}>{item.full_name || item.username}</option>)}</select></Field><Field label="Subject"><select className="form-input" value={assignmentSubjectId} onChange={(event) => setAssignmentSubjectId(event.target.value)} required><option value="">Select subject</option>{subjects.filter((item) => !item.archived_at).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></Field><Field label="Class"><select className="form-input" value={assignmentClassId} onChange={(event) => setAssignmentClassId(event.target.value)} required><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{academicClassLabel(item)} · {years.find((year) => year.id === item.academic_year_id)?.name}</option>)}</select></Field><div className="flex items-end gap-2"><button className="primary-button w-full" disabled={saving}>{saving ? 'Saving…' : editingAssignment ? 'Save allocation' : 'Assign teacher'}</button>{editingAssignment && <button type="button" className="secondary-button" onClick={() => { setEditingAssignment(null); setTeacherId(''); setAssignmentSubjectId(''); setAssignmentClassId('') }}>Cancel</button>}</div></form><section className="card divide-y divide-[#31533d]/8"><h2 className="font-display p-5 text-lg font-bold">Current teacher assignments</h2>{assignments.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{people.find((person) => person.id === item.teacher_id)?.full_name || 'Teacher'} · {subjects.find((subject) => subject.id === item.subject_id)?.name}</p><p className="text-xs text-[#789083]">{academicClassLabel(classes.find((cls) => cls.id === item.class_id) ?? { name: 'Class', grade: '', stream: '' })} · {years.find((year) => year.id === item.academic_year_id)?.name}</p></div><div className="flex gap-2"><button className="secondary-button" type="button" onClick={() => { setEditingAssignment(item.id); setTeacherId(item.teacher_id); setAssignmentSubjectId(item.subject_id); setAssignmentClassId(item.class_id) }}>Edit</button><button className="secondary-button" type="button" onClick={() => void removeRecord('teacher_assignments', item.id, 'Remove this teacher allocation? Existing lessons, submissions, and grades will be retained.')}>Remove</button></div></article>)}{!assignments.length && <p className="p-5 text-sm text-[#789083]">No teacher assignments yet.</p>}</section></div>}

      {section === 'Student Enrolments' && <div className="space-y-5"><form onSubmit={createEnrollment} className="card grid gap-4 p-5 md:grid-cols-3"><Field label="Student"><select className="form-input" value={studentId} onChange={(event) => setStudentId(event.target.value)} required><option value="">Select student</option>{learners.map((item) => <option key={item.id} value={item.id}>{item.full_name || item.username} · {item.username}</option>)}</select></Field><Field label="Class"><select className="form-input" value={enrollmentClassId} onChange={(event) => setEnrollmentClassId(event.target.value)} required><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{academicClassLabel(item)} · {years.find((year) => year.id === item.academic_year_id)?.name}</option>)}</select></Field><div className="flex items-end"><button className="primary-button w-full" disabled={saving}>{saving ? 'Saving…' : 'Enroll student'}</button></div></form><section className="card divide-y divide-[#31533d]/8"><h2 className="font-display p-5 text-lg font-bold">Class enrollments</h2>{enrollments.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-semibold">{people.find((person) => person.id === item.student_id)?.full_name || 'Student'} <span className="text-xs font-normal text-[#789083]">{people.find((person) => person.id === item.student_id)?.username}</span></p><p className="text-xs text-[#789083]">{academicClassLabel(classes.find((cls) => cls.id === item.class_id) ?? { name: 'Class', grade: '', stream: '' })}</p></div><button type="button" className="secondary-button" onClick={() => void removeRecord('student_class_enrollments', item.id, 'Remove this class enrollment? Existing marks and submissions will be preserved.')}>Remove enrollment</button></article>)}{!enrollments.length && <p className="p-5 text-sm text-[#789083]">No class enrollments yet.</p>}</section></div>}

      {section === 'Academic Reports' && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Academic years" value={years.length.toLocaleString()} detail="Years configured" icon="calendar" accent /><StatCard label="Classes" value={classes.length.toLocaleString()} detail="Across all years" icon="users" /><StatCard label="Active subjects" value={subjects.filter((item) => !item.archived_at).length.toLocaleString()} detail="Global subjects" icon="book" /><StatCard label="Teacher allocations" value={assignments.length.toLocaleString()} detail="Subject and class assignments" icon="user" /></div><section className="card overflow-hidden"><h2 className="font-display p-5 text-lg font-bold">Legacy records needing review</h2>{issues.length ? issues.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-2 border-t border-[#31533d]/8 p-4 text-sm"><span>{item.source_table} · {item.source_id}</span><span className="text-[#789083]">{item.reason}</span></div>) : <p className="border-t border-[#31533d]/8 p-5 text-sm text-[#789083]">All records with class and year data were matched.</p>}</section></div>}
    </>}
  </DashboardFrame>
}

function AdminUsersPage({ supabase }: { supabase: SupabaseClient }) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [removingUserId, setRemovingUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [role, setRole] = useState<'learner' | 'instructor' | 'admin'>('learner')
  const [userTab, setUserTab] = useState<'all' | ManagedUser['role']>('all')
  const [userSearch, setUserSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [createdCredential, setCreatedCredential] = useState<{ loginIdentifier: string; temporaryPassword: string; isLearner: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMore(true)
    else setLoadingUsers(true)
    setUsersError('')

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw new Error(`Could not verify your session: ${sessionError.message}`)
      if (!session) throw new Error('Your session expired. Sign in again to manage users.')
      setCurrentUserId(session.user.id)

      const response = await fetch(`/api/admin/users/?page=${page}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result: unknown = await response.json()
      const responseBody =
        typeof result === 'object' && result !== null
          ? (result as Record<string, unknown>)
          : {}
      if (!response.ok) {
        throw new Error(
          typeof responseBody.error === 'string'
            ? responseBody.error
            : 'Could not load academy users.',
        )
      }
      if (!Array.isArray(responseBody.users)) {
        throw new Error('The server returned an invalid user list.')
      }

      const loadedUsers = responseBody.users.filter(isManagedUser)
      setUsers((current) => append ? [...current, ...loadedUsers] : loadedUsers)
      setNextPage(
        typeof responseBody.nextPage === 'number' ? responseBody.nextPage : null,
      )
    } catch (loadError) {
      setUsersError(
        loadError instanceof Error ? loadError.message : 'Could not load academy users.',
      )
    } finally {
      setLoadingUsers(false)
      setLoadingMore(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const addUser = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setCreatedCredential(null)

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      setError(`Could not verify your session: ${sessionError.message}`)
      return
    }
    if (!session) {
      setError('Your session expired. Sign in again before adding a user.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/users/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email: role === 'learner' ? '' : email, registrationNumber: role === 'learner' ? registrationNumber : '', role }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const errorMessage =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'Could not create the account.'
        throw new Error(errorMessage)
      }

      const responseBody =
        typeof result === 'object' && result !== null
          ? (result as Record<string, unknown>)
          : {}
      if (typeof responseBody.temporaryPassword !== 'string') {
        throw new Error('The account may have been created, but its temporary password was not returned. Check the account list before retrying.')
      }
      const loginIdentifier = typeof responseBody.loginIdentifier === 'string'
        ? responseBody.loginIdentifier
        : email.trim()
      const isLearner = role === 'learner'
      setCreatedCredential({ loginIdentifier, temporaryPassword: responseBody.temporaryPassword, isLearner })
      setMessage(`Account created for ${loginIdentifier}. No email was sent; share the temporary password securely.`)
      setFullName('')
      setEmail('')
      setRegistrationNumber('')
      setRole('learner')
      await loadUsers()
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Could not create the account.',
      )
    } finally {
      setSaving(false)
    }
  }

  const copyTemporaryPassword = async () => {
    if (!createdCredential) return
    try {
      await navigator.clipboard.writeText(createdCredential.temporaryPassword)
      setError('')
      setMessage('Temporary password copied. Share it securely; no email was sent.')
    } catch {
      setError('Clipboard access failed. Select the password above and copy it manually.')
    }
  }

  const removeUser = async (user: ManagedUser) => {
    const accountIdentifier = user.registrationNumber
      ? `registration number ${user.registrationNumber}`
      : user.email
    if (
      !window.confirm(
        `Permanently remove ${user.name} (${accountIdentifier})? Linked profile data and learner records may also be deleted. Staff accounts with assigned records may need those records reassigned first.`,
      )
    ) return

    setUsersError('')
    setRemovingUserId(user.id)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw new Error(`Could not verify your session: ${sessionError.message}`)
      if (!session) throw new Error('Your session expired. Sign in again to manage users.')

      const response = await fetch('/api/admin/users/', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const result: unknown = await response.json()
      const responseBody =
        typeof result === 'object' && result !== null
          ? (result as Record<string, unknown>)
          : {}
      if (!response.ok) {
        throw new Error(
          typeof responseBody.error === 'string'
            ? responseBody.error
            : 'Could not remove the account.',
        )
      }
      setUsers((current) => current.filter((item) => item.id !== user.id))
    } catch (removeError) {
      setUsersError(
        removeError instanceof Error ? removeError.message : 'Could not remove the account.',
      )
    } finally {
      setRemovingUserId('')
    }
  }

  const visibleUsers = users.filter((user) => {
    const matchesRole = userTab === 'all' || user.role === userTab
    const query = userSearch.trim().toLowerCase()
    const matchesSearch = `${user.name} ${user.email} ${user.registrationNumber} ${user.role}`.toLowerCase().includes(query)
    return matchesRole && matchesSearch
  })

  const exportUsers = () => {
    const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`
    const rows = [
      ['Name', 'Email', 'Registration number', 'Role'],
      ...visibleUsers.map((user) => [user.name, user.email, user.registrationNumber, user.role]),
    ]
    const blobUrl = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    )
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = 'dzikaz-academy-users.csv'
    link.click()
    URL.revokeObjectURL(blobUrl)
  }

  return (
    <DashboardFrame
      eyebrow="Admin dashboard"
      title="User management"
      subtitle="Create learner accounts with registration numbers, and staff accounts with email addresses. Automated email is paused."
    >
      <form onSubmit={addUser} className="card max-w-2xl space-y-5 p-6">
        <p className="rounded-lg bg-[#E6D8C3]/35 p-3 text-xs leading-5 text-[#52665a]">No email will be sent. Learners sign in with their registration number; teachers and admins sign in with email. Copy and share each temporary password securely.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className="form-input"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={120}
              required
            />
          </Field>
          {role === 'learner' ? (
            <Field label="Registration number">
              <input
                className="form-input"
                autoComplete="off"
                autoCapitalize="characters"
                value={registrationNumber}
                onChange={(event) => setRegistrationNumber(event.target.value.toUpperCase())}
                maxLength={8}
                pattern="([A-Za-z][0-9]{6}[A-Za-z]|[A-Za-z][0-9]{4}[A-Za-z]{3})"
                required
                placeholder="e.g. A123456B"
              />
              <p className="mt-1 text-[11px] text-[#789083]">Use the REG format: one letter + six digits + one letter, or one letter + four digits + three letters.</p>
            </Field>
          ) : (
            <Field label="Email address">
              <input
                className="form-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
                placeholder="name@gmail.com"
              />
            </Field>
          )}
          <Field label="Academy role">
            <select
              className="form-input"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as 'learner' | 'instructor' | 'admin')
              }
            >
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-[#9b7466]/10 p-3 text-xs text-[#8a5548]">
            {error}
          </p>
        )}
        {message && (
          <div role="status" className="rounded-lg bg-[#5D866C]/10 p-3 text-xs text-[#31533d]">
            <p>{message}</p>
            {createdCredential && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-[#5D866C]/20 bg-white p-3"><div className="min-w-0 flex-1"><p className="font-semibold">Sign-in {createdCredential.isLearner ? 'registration number' : 'email'}: {createdCredential.loginIdentifier}</p><p className="mt-1 text-xs text-[#789083]">Temporary password</p><code className="block select-all break-all font-mono">{createdCredential.temporaryPassword}</code></div><button type="button" className="secondary-button" onClick={() => void copyTemporaryPassword()}>Copy password</button></div>}
          </div>
        )}
        <button disabled={saving} className="primary-button disabled:opacity-60">
          {saving ? 'Creating account…' : 'Add user'}
        </button>
      </form>
      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#31533d]/10 px-5 py-4">
          <div>
            <h2 className="font-display font-bold text-[#284633]">Academy accounts</h2>
            <p className="mt-1 text-xs text-[#789083]">
              Add admins here by selecting the Admin role above, or remove accounts below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loadingUsers}
            className="secondary-button"
          >
            Refresh
          </button>
        </div>
        <div className="border-b border-[#31533d]/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="tablist" aria-label="Filter academy accounts" className="flex flex-wrap gap-1 rounded-xl bg-[#F5F5F0] p-1">
              {([
                ['all', 'All'],
                ['learner', 'Learners'],
                ['instructor', 'Instructors'],
                ['admin', 'Admins'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={userTab === key}
                  onClick={() => setUserTab(key)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${userTab === key ? 'bg-[#31533d] text-white' : 'text-[#789083] hover:text-[#31533d]'}`}
                >
                  {label} <span className="ml-1 opacity-70">{users.filter((user) => key === 'all' || user.role === key).length}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative w-full max-w-64">
                <span className="sr-only">Search academy accounts</span>
                <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#789083]" />
                <input className="form-input min-w-0 !pl-10" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" />
              </label>
              <button type="button" onClick={exportUsers} disabled={!visibleUsers.length} className="secondary-button disabled:opacity-50">
                <Icon name="file" size={15} /> Export CSV
              </button>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[#929e97]">Showing {visibleUsers.length} of {users.length} loaded accounts{nextPage ? '. Load more to include additional accounts.' : '.'}</p>
        </div>
        {usersError && (
          <p role="alert" className="m-4 rounded-lg bg-[#9b7466]/10 p-3 text-xs text-[#8a5548]">
            {usersError}
          </p>
        )}
        {loadingUsers ? (
          <p className="p-5 text-sm text-[#789083]">Loading academy accounts…</p>
        ) : visibleUsers.length === 0 ? (
          <p className="p-5 text-sm text-[#789083]">No accounts found.</p>
        ) : (
          <ul className="divide-y divide-[#31533d]/8">
            {visibleUsers.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#284633]">
                    {user.name}{user.id === currentUserId ? ' (you)' : ''}
                  </p>
                  <p className="truncate text-xs text-[#789083]">{user.email || (user.registrationNumber ? `Registration number: ${user.registrationNumber}` : 'No email address')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#F5F5F0] px-3 py-1 text-[10px] font-bold capitalize text-[#5D866C]">
                    {user.role}
                  </span>
                  <button
                    type="button"
                    disabled={user.id === currentUserId || removingUserId === user.id}
                    onClick={() => void removeUser(user)}
                    className="rounded-lg px-3 py-2 text-xs font-bold text-[#8a5548] hover:bg-[#9b7466]/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {removingUserId === user.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {nextPage && !loadingUsers && (
          <div className="border-t border-[#31533d]/10 p-4 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void loadUsers(nextPage, true)}
              className="text-xs font-bold text-[#5D866C] disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load more accounts'}
            </button>
          </div>
        )}
      </section>
    </DashboardFrame>
  )
}

function DashboardFrame({
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  action?: string
  onAction?: () => void
  children: ReactNode
}) {
  return (
    <main className="mx-auto max-w-[1500px] p-5 pb-12 md:p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#5D866C]">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#284633] md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[#718078]">{subtitle}</p>
        </div>
        {action && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5D866C] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#4d765c]"
          >
            <Icon name={action.startsWith('+') ? 'plus' : 'file'} size={16} />
            {action.replace('+ ', '')}
          </button>
        )}
      </div>
      {children}
    </main>
  )
}

function CourseMini({
  title,
  tag,
  lessons,
  tone,
}: {
  title: string
  tag: string
  lessons: string
  tone: 'green' | 'sand'
}) {
  return (
    <button className="card group flex items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl ${tone === 'green' ? 'bg-[#5D866C] text-white' : 'bg-[#E6D8C3] text-[#5D866C]'}`}
      >
        <Icon name={tone === 'green' ? 'chart' : 'users'} size={26} />
      </div>
      <div>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#789083]">
          {tag}
        </span>
        <h3 className="font-display mt-1 font-bold text-[#284633]">{title}</h3>
        <p className="mt-1 text-[11px] text-[#789083]">{lessons}</p>
      </div>
      <Icon
        name="chevron"
        size={16}
        className="ml-auto text-[#9aa69f] transition group-hover:translate-x-1"
      />
    </button>
  )
}

function Timeline({
  time,
  title,
  type,
  last = false,
}: {
  time: string
  title: string
  type: string
  last?: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#5D866C] ring-4 ring-[#E6D8C3]/60" />
        {!last && <span className="my-1 w-px flex-1 bg-[#E6D8C3]" />}
      </div>
      <div className={last ? '' : 'pb-6'}>
        <p className="text-[10px] font-bold text-[#5D866C]">{time}</p>
        <h3 className="mt-1 text-sm font-bold text-[#284633]">{title}</h3>
        <p className="mt-1 text-[11px] text-[#789083]">{type}</p>
      </div>
    </div>
  )
}

function CourseRow({
  title,
  students,
  progress,
  color,
}: {
  title: string
  students: string
  progress: number
  color: string
}) {
  return (
    <div className="grid items-center gap-3 border-b border-[#31533d]/8 px-5 py-4 last:border-0 md:grid-cols-[1.5fr_.65fr_.65fr_.45fr] md:gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#E6D8C3]/50 text-[#5D866C]">
          <Icon name="book" size={17} />
        </span>
        <span className="text-sm font-bold text-[#284633]">{title}</span>
      </div>
      <span className="text-xs text-[#789083]">{students} students</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-[#E6D8C3]/55">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] font-bold text-[#5D866C]">{progress}%</span>
      </div>
      <button className="justify-self-end text-[#8b9890]">
        <Icon name="more" size={17} />
      </button>
    </div>
  )
}

function Activity({
  initials,
  name,
  text,
  time,
}: {
  initials: string
  name: string
  text: string
  time: string
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Avatar initials={initials} small />
      <p className="min-w-0 flex-1 text-xs text-[#718078]">
        <strong className="text-[#284633]">{name}</strong> {text}
      </p>
      <span className="hidden text-[10px] text-[#929e97] sm:block">{time}</span>
    </div>
  )
}

function MetricDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#789083]">{label}</p>
        <p className="font-display mt-1 text-xl font-bold text-[#284633]">{value}</p>
      </div>
    </div>
  )
}
function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-[#718078]">{label}</span>
      </div>
      <p className="ml-[18px] mt-0.5 text-sm font-bold text-[#284633]">{value}</p>
    </div>
  )
}
function RankRow({
  rank,
  title,
  category,
  score,
}: {
  rank: string
  title: string
  category: string
  score: string
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#31533d]/8 px-5 py-4 last:border-0">
      <span className="font-display text-lg font-bold text-[#C2A68C]">{rank}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#284633]">{title}</p>
        <p className="mt-0.5 text-[10px] text-[#789083]">{category}</p>
      </div>
      <span className="rounded-lg bg-[#E6D8C3]/45 px-3 py-1.5 text-xs font-bold text-[#5D866C]">
        {score}
      </span>
    </div>
  )
}
function Status({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#52665a]">{label}</span>
      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#5D866C]">
        <span className="h-2 w-2 rounded-full bg-[#5D866C] ring-4 ring-[#5D866C]/10" />
        Operational
      </span>
    </div>
  )
}

function NoticeBoard({
  role,
  notices,
  setNotices,
  userId,
  supabase,
}: {
  role: Role
  notices: Notice[]
  setNotices: (items: Notice[]) => void
  userId: string
  supabase: SupabaseClient
}) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<Notice['audience']>('Everyone')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const loadNotices = async () => {
      const { data, error: queryError } = await supabase
        .from('notices')
        .select('id, title, body, audience, created_at')
        .order('created_at', { ascending: false })
      if (!active) return
      if (queryError) {
        setError(queryError.message)
        return
      }
      setNotices((data ?? []).map((notice) => ({
        ...notice,
        audience: notice.audience === 'everyone' ? 'Everyone' : notice.audience[0].toUpperCase() + notice.audience.slice(1),
        date: new Date(notice.created_at).toLocaleDateString(),
      })))
    }
    void loadNotices()
    return () => { active = false }
  }, [setNotices, supabase])
  const visible = notices.filter((item) => item.audience === 'Everyone' || item.audience === role)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !body.trim()) return
    setError('')
    const { data, error: insertError } = await supabase
      .from('notices')
      .insert({
        title: title.trim(),
        body: body.trim(),
        audience: audience.toLowerCase(),
        created_by: userId,
      })
      .select('id, title, body, audience, created_at')
      .single()
    if (insertError) {
      setError(insertError.message)
      return
    }
    setNotices([{
      ...data,
      audience: data.audience === 'everyone' ? 'Everyone' : data.audience[0].toUpperCase() + data.audience.slice(1),
      date: 'Just now',
    }, ...notices])
    setTitle('')
    setBody('')
    setShowForm(false)
  }

  return (
    <DashboardFrame
      eyebrow="Academy updates"
      title="Notice board"
      subtitle="Important announcements for the Dzikaz learning community."
      action={role !== 'Learner' ? '+ Add notice' : undefined}
      onAction={role !== 'Learner' ? () => setShowForm(true) : undefined}
    >
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Publish a new notice</h2>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          <Field label="Notice title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Mock examination timetable"
              className="form-input"
            />
          </Field>
          <Field label="Audience">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Notice['audience'])}
              className="form-input"
            >
              <option>Everyone</option>
              <option>Learner</option>
              <option>Instructor</option>
              <option>Admin</option>
            </select>
          </Field>
          <Field label="Message" wide>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              placeholder="Write the announcement..."
              className="form-input resize-none"
            />
          </Field>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="secondary-button">
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Publish notice
            </button>
          </div>
        </form>
      )}
      <div className="grid gap-4">
        {visible.map((notice, index) => (
          <article key={notice.id} className="card flex gap-4 p-5 md:p-6">
            <span
              className={`mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl ${index === 0 ? 'bg-[#5D866C] text-white' : 'bg-[#E6D8C3]/55 text-[#5D866C]'}`}
            >
              <Icon name="bell" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-bold text-[#284633]">{notice.title}</h2>
                <span className="rounded-full bg-[#E6D8C3]/50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#5D866C]">
                  {notice.audience}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#718078]">{notice.body}</p>
              <p className="mt-3 text-[10px] font-semibold text-[#9aa49e]">
                {notice.date} · St Dzikaz Academy
              </p>
            </div>
            {role === 'Admin' && (
              <button
                onClick={async () => {
                  const { error: deleteError } = await supabase.from('notices').delete().eq('id', notice.id)
                  if (deleteError) setError(deleteError.message)
                  else setNotices(notices.filter((item) => item.id !== notice.id))
                }}
                aria-label={`Delete ${notice.title}`}
                className="h-9 w-9 shrink-0 rounded-lg text-[#9b7466] hover:bg-[#9b7466]/10"
              >
                <Icon name="trash" size={17} className="mx-auto" />
              </button>
            )}
          </article>
        ))}
      </div>
    </DashboardFrame>
  )
}

type AcademyEvent = {
  id: string
  title: string
  description: string
  location: string
  starts_at: string
  ends_at: string
  audience: string
}

function CalendarPage({ role, userId, supabase }: {
  role: Role
  userId: string
  supabase: SupabaseClient
}) {
  const [events, setEvents] = useState<AcademyEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [audience, setAudience] = useState('everyone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const canManage = role === 'Instructor' || role === 'Admin'

  useEffect(() => {
    let active = true
    const loadEvents = async () => {
      const { data, error: queryError } = await supabase
        .from('events')
        .select('id, title, description, location, starts_at, ends_at, audience')
        .gte('ends_at', new Date().toISOString())
        .order('starts_at')
      if (!active) return
      if (queryError) setError(queryError.message)
      else setEvents(data ?? [])
      setLoading(false)
    }
    void loadEvents()
    return () => { active = false }
  }, [supabase])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const start = new Date(startsAt)
    const end = new Date(endsAt)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setError('Choose a valid end time after the start time.')
      return
    }
    const { data, error: insertError } = await supabase
      .from('events')
      .insert({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        audience,
        created_by: userId,
      })
      .select('id, title, description, location, starts_at, ends_at, audience')
      .single()
    if (insertError) {
      setError(insertError.message)
      return
    }
    setEvents((current) => [...current, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setTitle('')
    setDescription('')
    setLocation('')
    setStartsAt('')
    setEndsAt('')
    setShowForm(false)
  }

  const calendarUrl = (event: AcademyEvent) => {
    const formatDate = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const details = [event.description, event.location].filter(Boolean).join('\n')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(event.starts_at)}/${formatDate(event.ends_at)}&details=${encodeURIComponent(details)}`
  }
  return (
    <DashboardFrame
      eyebrow="Learning schedule"
      title="Events calendar"
      subtitle="Stay on track with revision sessions, assessments, and academy events."
      action={canManage ? '+ Add event' : undefined}
      onAction={canManage ? () => setShowForm(true) : undefined}
    >
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
          <div className="flex items-center justify-between md:col-span-2">
            <h2 className="font-display font-bold">Create an event</h2>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close"><Icon name="x" /></button>
          </div>
          <Field label="Event title">
            <input className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
          </Field>
          <Field label="Audience">
            <select className="form-input" value={audience} onChange={(event) => setAudience(event.target.value)}>
              <option value="everyone">Everyone</option>
              <option value="learner">Learners</option>
              <option value="instructor">Instructors</option>
              <option value="admin">Administrators</option>
            </select>
          </Field>
          <Field label="Starts">
            <input className="form-input" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
          </Field>
          <Field label="Ends">
            <input className="form-input" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required />
          </Field>
          <Field label="Location">
            <input className="form-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Online or venue" />
          </Field>
          <Field label="Description">
            <input className="form-input" value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={() => setShowForm(false)} className="secondary-button">Cancel</button>
            <button className="primary-button">Publish event</button>
          </div>
        </form>
      )}
      <div className="card overflow-hidden">
        <div className="border-b border-[#31533d]/8 bg-[#E6D8C3]/20 px-6 py-4">
          <h2 className="font-display font-bold">Upcoming events</h2>
        </div>
        {loading ? <p className="p-6 text-sm text-[#789083]">Loading events…</p> : events.length ? (
          <div className="divide-y divide-[#31533d]/8">
            {events.map((event) => (
              <article key={event.id} className="flex items-center gap-4 p-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#5D866C] text-center text-white">
                  <div>
                    <p className="text-[9px] font-bold tracking-wider">{new Date(event.starts_at).toLocaleDateString('en-ZW', { month: 'short' }).toUpperCase()}</p>
                    <p className="font-display text-xl font-bold leading-none">{new Date(event.starts_at).getDate()}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">{event.title}</h3>
                  <p className="mt-1 text-xs text-[#789083]">{new Date(event.starts_at).toLocaleString()} – {new Date(event.ends_at).toLocaleTimeString()} · {event.location || 'Online'}</p>
                  {event.description && <p className="mt-2 text-sm text-[#718078]">{event.description}</p>}
                </div>
                <a href={calendarUrl(event)} target="_blank" rel="noreferrer" className="secondary-button hidden sm:inline-flex">Add to Google Calendar</a>
                {canManage && (
                  <button
                    onClick={async () => {
                      const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id)
                      if (deleteError) setError(deleteError.message)
                      else setEvents((current) => current.filter((item) => item.id !== event.id))
                    }}
                    aria-label={`Delete ${event.title}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#9b7466]/20 text-[#9b7466] hover:bg-[#9b7466]/10"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : <p className="p-6 text-sm text-[#789083]">No upcoming events have been added.</p>}
      </div>
    </DashboardFrame>
  )
}

function SubjectsPage({
  subjects,
  setSubjects,
  userId,
  supabase,
}: {
  subjects: Subject[]
  setSubjects: (subjects: Subject[]) => void
  userId: string
  supabase: SupabaseClient
}) {
  const [editing, setEditing] = useState<Subject | null>(null)
  const [classroomSubject, setClassroomSubject] = useState<Subject | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState<Subject['level']>('O Level')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadSubjects = async () => {
      const { data, error: queryError } = await supabase
        .from('subjects')
        .select('id, name, level, code, archived_at')
        .eq('instructor_id', userId)
        .order('name')
      if (!active) return
      if (queryError) {
        setError(queryError.message)
        return
      }
      const subjectIds = (data ?? []).map((subject) => subject.id)
      const { data: enrollments, error: enrollmentError } = subjectIds.length
        ? await supabase.from('enrollments').select('subject_id').in('subject_id', subjectIds)
        : { data: [], error: null }
      if (!active) return
      if (enrollmentError) {
        setError(enrollmentError.message)
        return
      }
      const learnerCounts = new Map<string, number>()
      for (const enrollment of enrollments ?? []) {
        learnerCounts.set(enrollment.subject_id, (learnerCounts.get(enrollment.subject_id) ?? 0) + 1)
      }
      setSubjects((data ?? []).map((subject) => ({
        ...subject,
        learners: learnerCounts.get(subject.id) ?? 0,
      })))
    }
    void loadSubjects()
    return () => { active = false }
  }, [setSubjects, supabase, userId])

  const openEdit = (subject: Subject) => {
    setEditing(subject)
    setName(subject.name)
    setLevel(subject.level)
    setCode(subject.code)
    setShowForm(true)
  }
  const reset = () => {
    setEditing(null)
    setName('')
    setCode('')
    setLevel('O Level')
    setShowForm(false)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !code.trim()) return
    setError('')
    const values = { name: name.trim(), level, code: code.trim() }
    const result = editing
      ? await supabase.from('subjects').update(values).eq('id', editing.id).select('id, name, level, code, archived_at').single()
      : await supabase.from('subjects').insert({ ...values, instructor_id: userId }).select('id, name, level, code, archived_at').single()
    if (result.error) {
      setError(result.error.message)
      return
    }
    const savedSubject = { ...result.data, learners: editing?.learners ?? 0 }
    setSubjects(editing
      ? subjects.map((subject) => subject.id === editing.id ? savedSubject : subject)
      : [...subjects, savedSubject])
    reset()
  }
  const visibleSubjects = subjects.filter((subject) => Boolean(subject.archived_at) === showArchived)
  if (classroomSubject) {
    return (
      <ClassroomWorkspace
        role="Instructor"
        subject={classroomSubject}
        userId={userId}
        supabase={supabase}
        onBack={() => setClassroomSubject(null)}
      />
    )
  }
  return (
    <DashboardFrame
      eyebrow="Instructor workspace"
      title="My ZIMSEC subjects"
      subtitle="Create, organise, and manage the subjects you teach."
      action="+ Add subject"
      onAction={() => setShowForm(true)}
    >
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 md:grid-cols-3">
          <Field label="Subject name">
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Geography"
              required
            />
          </Field>
          <Field label="ZIMSEC level">
            <select
              className="form-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as Subject['level'])}
            >
              <option>O Level</option>
              <option>A Level</option>
            </select>
          </Field>
          <Field label="Syllabus code">
            <input
              className="form-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 4022"
              required
            />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-3">
            <button type="button" onClick={reset} className="secondary-button">
              Cancel
            </button>
            <button className="primary-button">{editing ? 'Save changes' : 'Add subject'}</button>
          </div>
        </form>
      )}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowArchived((current) => !current)}
          className="text-xs font-bold text-[#5D866C] hover:underline"
        >
          {showArchived ? 'Show active subjects' : 'Show archived subjects'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleSubjects.map((subject, index) => (
          <article key={subject.id} className="card p-5">
            <div className="flex items-start justify-between">
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl ${index % 2 ? 'bg-[#E6D8C3] text-[#5D866C]' : 'bg-[#5D866C] text-white'}`}
              >
                <Icon name="book" />
              </span>
              <span className="rounded-full bg-[#F5F5F0] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#789083]">
                {subject.level}
              </span>
            </div>
            <h2 className="font-display mt-5 text-lg font-bold">{subject.name}</h2>
            <p className="mt-1 text-xs text-[#789083]">
              Syllabus {subject.code} · {subject.learners} learners
              {subject.archived_at ? ' · Archived' : ''}
            </p>
            <div className="mt-5 flex gap-2 border-t border-[#31533d]/8 pt-4">
              <button
                type="button"
                onClick={() => setClassroomSubject(subject)}
                className="secondary-button flex-1"
              >
                Open classroom
              </button>
              <button onClick={() => openEdit(subject)} className="secondary-button flex-1">
                <Icon name="edit" size={14} /> Edit
              </button>
              <button
                onClick={async () => {
                  if (
                    !subject.archived_at &&
                    !window.confirm(`Archive ${subject.name}? Its classroom documents, attendance, and student work will be retained.`)
                  ) return
                  const archivedAt = subject.archived_at ? null : new Date().toISOString()
                  const { error: archiveError } = await supabase
                    .from('subjects')
                    .update({ archived_at: archivedAt })
                    .eq('id', subject.id)
                  if (archiveError) setError(archiveError.message)
                  else {
                    setSubjects(subjects.map((item) =>
                      item.id === subject.id ? { ...item, archived_at: archivedAt } : item,
                    ))
                  }
                }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#9b7466]/20 text-[#9b7466] hover:bg-[#9b7466]/10"
                aria-label={`${subject.archived_at ? 'Restore' : 'Archive'} ${subject.name}`}
                title={subject.archived_at ? 'Restore subject' : 'Archive subject'}
              >
                <Icon name={subject.archived_at ? 'check' : 'trash'} size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </DashboardFrame>
  )
}

type ClassroomDocument = {
  id: string
  title: string
  file_name: string
  storage_path: string
  created_at: string
}

type ClassroomLesson = { id: string; title: string; description: string; content: string; is_published: boolean; created_at: string; completed_at?: string | null }

type ClassroomAssignment = {
  id: string
  class_id: string | null
  assessment_type: 'assignment' | 'quiz'
  quiz_questions: { prompt: string; options: string[] }[]
  title: string
  instructions: string
  max_score: number
  due_at: string | null
}

type ClassroomSubmission = {
  id: string
  assignment_id: string
  learner_id: string
  file_name: string
  storage_path: string
  submitted_at: string
}

type ClassroomMark = {
  id: string
  assignment_id: string
  learner_id: string
  score: number
  max_score: number
  feedback: string
}

type ClassroomQuizAttempt = { id: string; assignment_id: string; learner_id: string; answers: number[]; score: number; submitted_at: string }

type ClassroomLearner = {
  id: string
  name: string
  username: string
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

const classroomBucket = 'classroom-files'
const classroomFileSizeLimit = 10 * 1024 * 1024
const classroomFileTypes: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

function getClassroomFileMimeType(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mimeType = classroomFileTypes[extension]
  if (!mimeType) throw new Error('Choose a PDF, DOC, DOCX, or PPTX file.')
  if (file.size > classroomFileSizeLimit) throw new Error('Files must be 10 MB or smaller.')
  if (file.type && file.type !== mimeType) throw new Error('The selected file type does not match its extension.')
  return mimeType
}

function safeClassroomFileName(fileName: string) {
  return fileName.replace(/[^\w.-]+/g, '_').slice(-120)
}

function ClassroomsPage({
  role,
  userId,
  supabase,
}: {
  role: 'Learner' | 'Instructor'
  userId: string
  supabase: SupabaseClient
}) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadSubjects = async () => {
      setLoading(true)
      setError('')
      try {
        let classIds: string[] = []
        let assignmentRows: { class_id: string; subject_id: string }[] = []
        if (role === 'Learner') {
          const { data: classRows, error: classError } = await supabase
            .from('student_class_enrollments').select('class_id').eq('student_id', userId)
          if (classError) throw classError
          classIds = [...new Set((classRows ?? []).map((item) => item.class_id))]
          const { data, error: assignmentError } = classIds.length
            ? await supabase.from('class_subjects').select('class_id, subject_id').in('class_id', classIds)
            : { data: [], error: null }
          if (assignmentError) throw assignmentError
          assignmentRows = data ?? []
        } else {
          const { data, error: assignmentError } = await supabase
            .from('teacher_assignments').select('class_id, subject_id').eq('teacher_id', userId)
          if (assignmentError) throw assignmentError
          assignmentRows = data ?? []
          classIds = [...new Set(assignmentRows.map((item) => item.class_id))]
        }
        const subjectIds = [...new Set(assignmentRows.map((item) => item.subject_id))]
        const [subjectResult, classResult] = await Promise.all([
          subjectIds.length
            ? supabase.from('subjects').select('id, name, level, code, archived_at').in('id', subjectIds)
            : Promise.resolve({ data: [], error: null }),
          classIds.length
            ? supabase.from('classes').select('id, name, grade, stream').in('id', classIds)
            : Promise.resolve({ data: [], error: null }),
        ])
        if (subjectResult.error) throw subjectResult.error
        if (classResult.error) throw classResult.error
        const subjectById = new Map((subjectResult.data ?? []).map((item) => [item.id, item]))
        const classById = new Map((classResult.data ?? []).map((item) => [item.id, academicClassLabel(item)]))
        const mappedSubjects = await Promise.all(assignmentRows.map(async (assignment) => {
          const subject = subjectById.get(assignment.subject_id)
          if (!subject || subject.archived_at) return null
          const [learnerCount, lessonCount, assignmentCount] = await Promise.all([
            supabase.from('student_class_enrollments').select('id', { count: 'exact', head: true }).eq('class_id', assignment.class_id),
            supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('class_id', assignment.class_id).eq('subject_id', assignment.subject_id),
            supabase.from('classroom_assignments').select('id', { count: 'exact', head: true }).eq('class_id', assignment.class_id).eq('subject_id', assignment.subject_id),
          ])
          const countError = [learnerCount, lessonCount, assignmentCount].find((item) => item.error)
          if (countError?.error) throw countError.error
          return { ...subject, learners: learnerCount.count ?? 0, lessonCount: lessonCount.count ?? 0, assignmentCount: assignmentCount.count ?? 0, assignmentClassId: assignment.class_id, assignmentClassName: classById.get(assignment.class_id) ?? 'Class' }
        }))
        if (active) setSubjects(mappedSubjects.filter((item): item is NonNullable<typeof item> => item !== null))
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load classrooms.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadSubjects()
    return () => { active = false }
  }, [role, supabase, userId])

  if (selectedSubject) {
    return (
      <ClassroomWorkspace
        role={role}
        subject={selectedSubject}
        classId={selectedSubject.assignmentClassId}
        userId={userId}
        supabase={supabase}
        onBack={() => setSelectedSubject(null)}
      />
    )
  }

  return (
    <DashboardFrame
      eyebrow={role === 'Learner' ? 'Learner workspace' : 'Instructor workspace'}
      title={role === 'Learner' ? 'My classes' : 'My subjects'}
      subtitle={role === 'Learner' ? 'Open a subject from your enrolled class to view published lessons and classwork.' : 'Assigned subjects and classes with live learner, lesson, and assignment totals.'}
    >
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
      {loading ? (
        <div className="card p-6 text-sm text-[#789083]">Loading classrooms…</div>
      ) : subjects.length === 0 ? (
        <div className="card p-6 text-sm text-[#789083]">
          {role === 'Learner'
            ? 'You are not enrolled in a classroom yet. Ask a teacher or administrator for enrollment.'
            : 'No classes have been allocated to you yet. Ask an administrator to assign a subject and class.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSelectedSubject(subject)}
              className="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#5D866C] text-white">
                <Icon name="book" />
              </span>
              <h2 className="font-display mt-5 text-lg font-bold">{subject.name}</h2>
              <p className="mt-1 text-xs text-[#789083]">
                {subject.assignmentClassName} · {subject.level} · Syllabus {subject.code}
              </p>
              {role === 'Instructor' && <p className="mt-3 text-xs text-[#789083]">{subject.learners} students · {subject.lessonCount} lessons · {subject.assignmentCount} assignments</p>}
            </button>
          ))}
        </div>
      )}
    </DashboardFrame>
  )
}

function ClassroomWorkspace({
  role,
  subject,
  classId,
  userId,
  supabase,
  onBack,
}: {
  role: 'Learner' | 'Instructor'
  subject: Subject
  classId?: string
  userId: string
  supabase: SupabaseClient
  onBack: () => void
}) {
  const [documents, setDocuments] = useState<ClassroomDocument[]>([])
  const [lessons, setLessons] = useState<ClassroomLesson[]>([])
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([])
  const [submissions, setSubmissions] = useState<ClassroomSubmission[]>([])
  const [learners, setLearners] = useState<ClassroomLearner[]>([])
  const [marks, setMarks] = useState<ClassroomMark[]>([])
  const [quizAttempts, setQuizAttempts] = useState<ClassroomQuizAttempt[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonPublished, setLessonPublished] = useState(false)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentType, setAssignmentType] = useState<'assignment' | 'quiz'>('assignment')
  const [quizQuestion, setQuizQuestion] = useState('')
  const [quizOptions, setQuizOptions] = useState<[string, string, string, string]>(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState('0')
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [assignmentInstructions, setAssignmentInstructions] = useState('')
  const [assignmentDue, setAssignmentDue] = useState('')
  const [assignmentMaxScore, setAssignmentMaxScore] = useState('100')
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | undefined>>({})
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})
  const [savingAction, setSavingAction] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const archived = Boolean(subject.archived_at)
  const loadClassroom = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: documentRows, error: documentsError } = await supabase
        .from('classroom_documents')
        .select('id, title, file_name, storage_path, created_at')
        .eq('subject_id', subject.id)
        .or(classId ? `class_id.eq.${classId},class_id.is.null` : 'class_id.is.null')
        .order('created_at', { ascending: false })
      if (documentsError) throw documentsError

      const { data: lessonRows, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, description, content, is_published, created_at')
        .eq('subject_id', subject.id)
        .eq('class_id', classId ?? '')
        .order('created_at', { ascending: false })
      if (lessonsError) throw lessonsError
      const lessonIds = (lessonRows ?? []).map((lesson) => lesson.id)
      const { data: completionRows, error: completionError } = role === 'Learner' && lessonIds.length
        ? await supabase.from('lesson_completions').select('lesson_id, completed_at').eq('learner_id', userId).in('lesson_id', lessonIds)
        : { data: [], error: null }
      if (completionError) throw completionError
      const completedAtByLesson = new Map((completionRows ?? []).map((item) => [item.lesson_id, item.completed_at]))

      const { data: assignmentRows, error: assignmentsError } = await supabase
        .from('classroom_assignments')
        .select('id, class_id, title, assessment_type, quiz_questions, instructions, max_score, due_at')
        .eq('subject_id', subject.id)
        .or(classId ? `class_id.eq.${classId},class_id.is.null` : 'class_id.is.null')
        .order('created_at', { ascending: false })
      if (assignmentsError) throw assignmentsError

      const { data: enrollmentRows, error: enrollmentsError } = classId
        ? await supabase.from('student_class_enrollments').select('student_id').eq('class_id', classId)
        : await supabase.from('enrollments').select('learner_id').eq('subject_id', subject.id)
      if (enrollmentsError) throw enrollmentsError
      const learnerIds = [...new Set((enrollmentRows ?? []).map((row) => 'student_id' in row ? row.student_id : row.learner_id))]
      const { data: learnerRows, error: learnersError } = learnerIds.length
        ? await supabase.rpc('lookup_subject_profiles', { requested_ids: learnerIds })
        : { data: [], error: null }
      if (learnersError) throw learnersError

      const assignmentIds = (assignmentRows ?? []).map((item) => item.id)
      const { data: submissionRows, error: submissionsError } = assignmentIds.length
        ? await supabase
            .from('classroom_submissions')
            .select('id, assignment_id, learner_id, file_name, storage_path, submitted_at')
            .in('assignment_id', assignmentIds)
        : { data: [], error: null }
      if (submissionsError) throw submissionsError

      const { data: markRows, error: marksError } = assignmentIds.length
        ? await supabase
            .from('marks')
            .select('id, assignment_id, learner_id, score, max_score, feedback')
            .in('assignment_id', assignmentIds)
        : { data: [], error: null }
      if (marksError) throw marksError

      const { data: quizAttemptRows, error: quizAttemptsError } = assignmentIds.length
        ? await supabase.from('classroom_quiz_attempts').select('id, assignment_id, learner_id, answers, score, submitted_at').in('assignment_id', assignmentIds)
        : { data: [], error: null }
      if (quizAttemptsError) throw quizAttemptsError

      const { data: attendanceRows, error: attendanceError } = await supabase
        .from('classroom_attendance')
        .select('learner_id, status')
        .eq('subject_id', subject.id)
        .or(classId ? `class_id.eq.${classId},class_id.is.null` : 'class_id.is.null')
        .eq('attendance_date', attendanceDate)
        .eq('class_id', classId ?? '')
      if (attendanceError) throw attendanceError

      setDocuments(documentRows ?? [])
      setLessons((lessonRows ?? []).map((lesson) => ({ ...lesson, completed_at: completedAtByLesson.get(lesson.id) ?? null })))
      setAssignments(assignmentRows ?? [])
      const verifiedLearners: { id: string; full_name: string; username: string }[] =
        Array.isArray(learnerRows)
          ? learnerRows.filter(
              (item: unknown): item is { id: string; full_name: string; username: string } =>
                isClassroomLearnerProfile(item),
            )
          : []
      setLearners(verifiedLearners.map((item) => ({
        id: item.id,
        name: item.full_name || item.username,
        username: item.username,
      })))
      setSubmissions(submissionRows ?? [])
      setMarks(markRows ?? [])
      setQuizAttempts((quizAttemptRows ?? []) as ClassroomQuizAttempt[])
      setAttendance(Object.fromEntries(
        (attendanceRows ?? []).map((row) => [row.learner_id, row.status as AttendanceStatus]),
      ))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load classroom data.')
    } finally {
      setLoading(false)
    }
  }, [attendanceDate, classId, role, subject.id, supabase, userId])

  useEffect(() => {
    void loadClassroom()
  }, [loadClassroom])

  const downloadFile = async (storagePath: string, fileName: string) => {
    setError('')
    const { data, error: downloadError } = await supabase.storage
      .from(classroomBucket)
      .download(storagePath)
    if (downloadError) {
      setError(downloadError.message)
      return
    }
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const toggleLessonCompletion = async (lesson: ClassroomLesson) => {
    if (savingAction === `lesson-completion:${lesson.id}`) return
    setError(''); setMessage(''); setSavingAction(`lesson-completion:${lesson.id}`)
    const result = lesson.completed_at
      ? await supabase.from('lesson_completions').delete().eq('lesson_id', lesson.id).eq('learner_id', userId)
      : await supabase.from('lesson_completions').insert({ lesson_id: lesson.id, learner_id: userId })
    setSavingAction('')
    if (result.error) setError(result.error.message)
    else { setMessage(lesson.completed_at ? 'Lesson marked as incomplete.' : 'Lesson marked complete.'); await loadClassroom() }
  }

  const uploadMaterial = async (event: FormEvent) => {
    event.preventDefault()
    if (!documentFile || !documentTitle.trim()) return
    setError('')
    setMessage('')
    setSavingAction('document')
    try {
      const mimeType = getClassroomFileMimeType(documentFile)
      const fileName = safeClassroomFileName(documentFile.name)
      const storagePath = `subjects/${subject.id}/classes/${classId}/materials/${crypto.randomUUID()}-${fileName}`
      const { error: uploadError } = await supabase.storage
        .from(classroomBucket)
        .upload(storagePath, documentFile, { contentType: mimeType, upsert: false })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('classroom_documents').insert({
        subject_id: subject.id,
        class_id: classId,
        uploaded_by: userId,
        title: documentTitle.trim(),
        file_name: documentFile.name,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: documentFile.size,
      })
      if (insertError) {
        const { error: cleanupError } = await supabase.storage.from(classroomBucket).remove([storagePath])
        throw new Error(cleanupError ? `${insertError.message} Temporary upload cleanup failed: ${cleanupError.message}` : insertError.message)
      }
      setDocumentTitle('')
      setDocumentFile(null)
      setMessage('Classroom document added.')
      await loadClassroom()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload the document.')
    } finally {
      setSavingAction('')
    }
  }

  const saveLesson = async (event: FormEvent) => {
    event.preventDefault()
    if (!classId || !lessonTitle.trim() || !lessonContent.trim()) return
    setError(''); setMessage(''); setSavingAction('lesson')
    const values = { subject_id: subject.id, class_id: classId, teacher_id: userId, title: lessonTitle.trim(), description: lessonDescription.trim(), content: lessonContent.trim(), is_published: lessonPublished }
    const result = editingLesson
      ? await supabase.from('lessons').update(values).eq('id', editingLesson)
      : await supabase.from('lessons').insert(values)
    setSavingAction('')
    if (result.error) { setError(result.error.message); return }
    setLessonTitle(''); setLessonDescription(''); setLessonContent(''); setLessonPublished(false); setEditingLesson(null)
    setMessage('Lesson saved.'); await loadClassroom()
  }

  const createAssignment = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSavingAction('assignment')
    const maxScore = Number(assignmentMaxScore)
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setError('Maximum score must be greater than zero.')
      setSavingAction('')
      return
    }
    if (assignmentType === 'quiz' && (!quizQuestion.trim() || quizOptions.some((item) => !item.trim()))) {
      setError('Enter a question and all four answer options for the quiz.')
      setSavingAction('')
      return
    }
    const { data: createdAssignment, error: insertError } = await supabase.from('classroom_assignments').insert({
      subject_id: subject.id,
      class_id: classId,
      created_by: userId,
      title: assignmentTitle.trim(),
      instructions: assignmentInstructions.trim(),
      max_score: maxScore,
      due_at: assignmentDue ? new Date(assignmentDue).toISOString() : null,
      assessment_type: assignmentType,
      quiz_questions: assignmentType === 'quiz' ? [{ prompt: quizQuestion.trim(), options: quizOptions.map((item) => item.trim()) }] : [],
    }).select('id').single()
    if (insertError) setError(insertError.message)
    else {
      if (assignmentType === 'quiz') {
        const { error: keyError } = await supabase.from('classroom_quiz_answer_key').insert({
          assignment_id: createdAssignment.id,
          question_index: 0,
          correct_option: Number(correctOption),
        })
        if (keyError) {
          const { error: rollbackError } = await supabase.from('classroom_assignments').delete().eq('id', createdAssignment.id)
          setError(rollbackError ? `Quiz setup failed and the draft could not be removed: ${keyError.message}` : `Quiz could not be configured: ${keyError.message}`)
          setSavingAction('')
          return
        }
      }
      setAssignmentTitle('')
      setAssignmentInstructions('')
      setAssignmentDue('')
      setAssignmentMaxScore('100')
      setAssignmentType('assignment'); setQuizQuestion(''); setQuizOptions(['', '', '', '']); setCorrectOption('0')
      setMessage(assignmentType === 'quiz' ? 'Quiz created.' : 'Assignment created.')
      await loadClassroom()
    }
    setSavingAction('')
  }

  const submitQuiz = async (event: FormEvent, assignment: ClassroomAssignment) => {
    event.preventDefault()
    const answer = quizAnswers[assignment.id]
    if (!Number.isInteger(answer)) { setError('Choose an answer before submitting the quiz.'); return }
    setError(''); setMessage(''); setSavingAction(`quiz:${assignment.id}`)
    const { error: submitError } = await supabase.from('classroom_quiz_attempts').insert({ assignment_id: assignment.id, learner_id: userId, answers: [answer] })
    setSavingAction('')
    if (submitError) { setError(submitError.message); return }
    setMessage('Quiz submitted and graded.')
    await loadClassroom()
  }

  const submitWork = async (event: FormEvent, assignment: ClassroomAssignment) => {
    event.preventDefault()
    const file = submissionFiles[assignment.id]
    if (!file) {
      setError('Choose a PDF, DOC, or DOCX file to submit.')
      return
    }
    setError('')
    setMessage('')
    setSavingAction(`submission:${assignment.id}`)
    try {
      const mimeType = getClassroomFileMimeType(file)
      const oldSubmission = submissions.find((item) => item.assignment_id === assignment.id && item.learner_id === userId)
      const storagePath = assignment.class_id
        ? `subjects/${subject.id}/classes/${assignment.class_id}/submissions/${assignment.id}/${userId}/${crypto.randomUUID()}-${safeClassroomFileName(file.name)}`
        : `subjects/${subject.id}/submissions/${assignment.id}/${userId}/${crypto.randomUUID()}-${safeClassroomFileName(file.name)}`
      const { error: uploadError } = await supabase.storage
        .from(classroomBucket)
        .upload(storagePath, file, { contentType: mimeType, upsert: false })
      if (uploadError) throw uploadError

      const submissionValues = {
        file_name: file.name,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: file.size,
        submitted_at: new Date().toISOString(),
      }
      const { error: saveError } = oldSubmission
        ? await supabase
            .from('classroom_submissions')
            .update(submissionValues)
            .eq('id', oldSubmission.id)
        : await supabase.from('classroom_submissions').insert({
            ...submissionValues,
            assignment_id: assignment.id,
            learner_id: userId,
          })
      if (saveError) {
        const { error: cleanupError } = await supabase.storage.from(classroomBucket).remove([storagePath])
        throw new Error(cleanupError ? `${saveError.message} Temporary upload cleanup failed: ${cleanupError.message}` : saveError.message)
      }
      if (oldSubmission) {
        const { error: cleanupError } = await supabase.storage
          .from(classroomBucket)
          .remove([oldSubmission.storage_path])
        if (cleanupError) throw cleanupError
      }
      setSubmissionFiles((current) => ({ ...current, [assignment.id]: undefined }))
      setMessage('Work submitted successfully.')
      await loadClassroom()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your work.')
    } finally {
      setSavingAction('')
    }
  }

  const saveAttendance = async (event: FormEvent) => {
    event.preventDefault()
    if (!learners.length) {
      setError('Enroll students in this subject before recording attendance.')
      return
    }
    setError('')
    setMessage('')
    setSavingAction('attendance')
    const rows = learners.map((learner) => ({
      subject_id: subject.id,
      class_id: classId,
      learner_id: learner.id,
      attendance_date: attendanceDate,
      status: attendance[learner.id] ?? 'present',
      recorded_by: userId,
    }))
    const { error: saveError } = await supabase
      .from('classroom_attendance')
      .upsert(rows, { onConflict: 'subject_id,learner_id,attendance_date' })
    if (saveError) setError(saveError.message)
    else {
      setMessage('Attendance saved.')
      await loadClassroom()
    }
    setSavingAction('')
  }

  const markSubmission = async (
    event: FormEvent,
    assignment: ClassroomAssignment,
    submission: ClassroomSubmission,
  ) => {
    event.preventDefault()
    const score = Number(scoreDrafts[submission.id] ?? marks.find(
      (mark) => mark.assignment_id === assignment.id && mark.learner_id === submission.learner_id,
    )?.score)
    if (!Number.isFinite(score) || score < 0 || score > assignment.max_score) {
      setError(`Enter a score from 0 to ${assignment.max_score}.`)
      return
    }
    setError('')
    setMessage('')
    setSavingAction(`mark:${submission.id}`)
    const existingMark = marks.find(
      (mark) => mark.assignment_id === assignment.id && mark.learner_id === submission.learner_id,
    )
    const markValues = {
      learner_id: submission.learner_id,
      subject_id: subject.id,
      class_id: classId,
      assignment_id: assignment.id,
      recorded_by: userId,
      assessment_name: assignment.title,
      score,
      max_score: assignment.max_score,
      assessed_on: new Date().toISOString().slice(0, 10),
      feedback: feedbackDrafts[submission.id] ?? existingMark?.feedback ?? '',
    }
    const result = existingMark
      ? await supabase.from('marks').update(markValues).eq('id', existingMark.id)
      : await supabase.from('marks').insert(markValues)
    if (result.error) setError(result.error.message)
    else {
      setMessage(`Work marked for ${learners.find((learner) => learner.id === submission.learner_id)?.name ?? 'student'}.`)
      await loadClassroom()
    }
    setSavingAction('')
  }

  return (
    <DashboardFrame
      eyebrow={role === 'Learner' ? 'Learner classroom' : 'Instructor classroom'}
      title={subject.name}
      subtitle={`${subject.assignmentClassName ?? 'Class'} · ${subject.level} · Syllabus ${subject.code}${archived ? ' · Archived (read only)' : ''}`}
      action="Back"
      onAction={onBack}
    >
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-[#5D866C]/10 p-3 text-sm text-[#31533d]">{message}</p>}
      {loading ? (
        <div className="card p-6 text-sm text-[#789083]">Loading classroom…</div>
      ) : (
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Lessons</h2><p className="mt-1 text-xs text-[#789083]">Teacher-created lesson notes for this subject and class.</p></div></div>
            {role === 'Instructor' && !archived && <form onSubmit={saveLesson} className="mt-5 grid gap-3 md:grid-cols-2">
              <input className="form-input" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} maxLength={160} placeholder="Lesson title" required />
              <input className="form-input" value={lessonDescription} onChange={(event) => setLessonDescription(event.target.value)} maxLength={500} placeholder="Short description" />
              <textarea className="form-input min-h-36 md:col-span-2" value={lessonContent} onChange={(event) => setLessonContent(event.target.value)} maxLength={20000} placeholder="Lesson notes and learning content" required />
              <label className="flex items-center gap-2 text-sm text-[#52665a]"><input type="checkbox" checked={lessonPublished} onChange={(event) => setLessonPublished(event.target.checked)} /> Publish for enrolled students</label>
              <div className="flex justify-end gap-2"><button type="button" className="secondary-button" onClick={() => { setEditingLesson(null); setLessonTitle(''); setLessonDescription(''); setLessonContent(''); setLessonPublished(false) }}>Clear</button><button disabled={savingAction === 'lesson'} className="primary-button">{savingAction === 'lesson' ? 'Saving…' : editingLesson ? 'Save lesson' : 'Add lesson'}</button></div>
            </form>}
            {lessons.length ? <div className="mt-5 divide-y divide-[#31533d]/8">{lessons.map((lesson) => <article key={lesson.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{lesson.title}</h3>{role === 'Learner' && <span className="rounded-full bg-[#E6D8C3]/45 px-2 py-1 text-[10px] font-semibold text-[#5D866C]">{lesson.completed_at ? 'Completed' : 'In progress'}</span>}</div>{lesson.description && <p className="mt-1 text-sm text-[#789083]">{lesson.description}</p>}<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52665a]">{lesson.content}</p></div>{role === 'Learner' ? <button type="button" className="secondary-button" disabled={savingAction === `lesson-completion:${lesson.id}`} onClick={() => void toggleLessonCompletion(lesson)}>{savingAction === `lesson-completion:${lesson.id}` ? 'Saving…' : lesson.completed_at ? 'Undo completion' : 'Mark complete'}</button> : <div className="flex items-center gap-2"><span className="rounded-full bg-[#E6D8C3]/45 px-2 py-1 text-[10px] font-semibold text-[#5D866C]">{lesson.is_published ? 'Published' : 'Draft'}</span><button type="button" className="secondary-button" onClick={() => { setEditingLesson(lesson.id); setLessonTitle(lesson.title); setLessonDescription(lesson.description); setLessonContent(lesson.content); setLessonPublished(lesson.is_published); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button><button type="button" className="secondary-button" onClick={async () => { if (!window.confirm(`Delete lesson “${lesson.title}”?`)) return; const { error: deleteError } = await supabase.from('lessons').delete().eq('id', lesson.id); if (deleteError) setError(deleteError.message); else { setMessage('Lesson deleted.'); await loadClassroom() } }}>Delete</button></div>}</div></article>)}</div> : <p className="mt-4 text-sm text-[#789083]">No published lessons yet.</p>}
          </section>
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Class documents</h2>
              <p className="mt-1 text-xs text-[#789083]">PDF, Word, and PowerPoint files, up to 10 MB each.</p>
              </div>
            </div>
            {role === 'Instructor' && !archived && (
              <form onSubmit={uploadMaterial} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]">
                <input className="form-input" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} maxLength={160} placeholder="Document title" required />
                <input className="form-input" type="file" accept=".pdf,.doc,.docx,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} required />
                <button disabled={savingAction === 'document'} className="primary-button disabled:opacity-60">
                  {savingAction === 'document' ? 'Uploading…' : 'Add document'}
                </button>
              </form>
            )}
            {documents.length ? (
              <ul className="mt-4 divide-y divide-[#31533d]/8">
                {documents.map((documentItem) => (
                  <li key={documentItem.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{documentItem.title}</p>
                      <p className="truncate text-xs text-[#789083]">{documentItem.file_name}</p>
                    </div>
                    <button type="button" onClick={() => void downloadFile(documentItem.storage_path, documentItem.file_name)} className="secondary-button">
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-[#789083]">No class documents yet.</p>}
          </section>

          {role === 'Instructor' && !archived && (
            <section className="card p-5">
              <h2 className="font-display text-lg font-bold">Students and attendance</h2>
              <p className="mt-1 text-xs text-[#789083]">View enrolled learners and record attendance for a class date.</p>
              <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-[#789083]">
                Enrolled students ({learners.length})
              </h3>
              <form onSubmit={saveAttendance} className="mt-4">
                <Field label="Attendance date">
                  <input className="form-input max-w-xs" type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} required />
                </Field>
                {learners.length ? (
                  <>
                    <ul className="mt-4 divide-y divide-[#31533d]/8">
                      {learners.map((learner) => (
                        <li key={learner.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <span className="text-sm font-semibold">{learner.name}</span>
                          <select
                            className="form-input max-w-44"
                            value={attendance[learner.id] ?? 'present'}
                            onChange={(event) => setAttendance((current) => ({ ...current, [learner.id]: event.target.value as AttendanceStatus }))}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                          </select>
                        </li>
                      ))}
                    </ul>
                    <button disabled={savingAction === 'attendance'} className="primary-button mt-4 disabled:opacity-60">
                      {savingAction === 'attendance' ? 'Saving…' : 'Save attendance'}
                    </button>
                  </>
                ) : <p className="mt-4 text-sm text-[#789083]">No students are enrolled in this subject yet.</p>}
              </form>
            </section>
          )}

          <section className="card p-5">
            <h2 className="font-display text-lg font-bold">Assignments</h2>
            <p className="mt-1 text-xs text-[#789083]">Students submit PDF or Word work; teachers can review and mark it here.</p>
            {role === 'Instructor' && !archived && (
              <form onSubmit={createAssignment} className="mt-5 grid gap-3 md:grid-cols-2">
                <Field label="Assessment type"><select className="form-input" value={assignmentType} onChange={(event) => setAssignmentType(event.target.value as 'assignment' | 'quiz')}><option value="assignment">Assignment</option><option value="quiz">Multiple-choice quiz</option></select></Field>
                <input className="form-input" value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} maxLength={160} placeholder={assignmentType === 'quiz' ? 'Quiz title' : 'Assignment title'} required />
                <input className="form-input" type="datetime-local" value={assignmentDue} onChange={(event) => setAssignmentDue(event.target.value)} aria-label="Due date (optional)" />
                <textarea className="form-input min-h-24 md:col-span-2" value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} maxLength={5000} placeholder="Instructions (optional)" />
                {assignmentType === 'quiz' && <div className="grid gap-3 md:col-span-2"><Field label="Question"><textarea className="form-input min-h-20" value={quizQuestion} onChange={(event) => setQuizQuestion(event.target.value)} maxLength={1000} required /></Field><div className="grid gap-3 sm:grid-cols-2">{quizOptions.map((option, index) => <Field key={index} label={`Option ${String.fromCharCode(65 + index)}`}><input className="form-input" value={option} onChange={(event) => setQuizOptions((current) => current.map((value, optionIndex) => optionIndex === index ? event.target.value : value) as [string, string, string, string])} maxLength={300} required /></Field>)}</div><Field label="Correct option"><select className="form-input" value={correctOption} onChange={(event) => setCorrectOption(event.target.value)}>{quizOptions.map((_, index) => <option key={index} value={index}>{String.fromCharCode(65 + index)}</option>)}</select></Field></div>}
                <Field label="Maximum score">
                  <input className="form-input" type="number" min="0.01" step="0.01" value={assignmentMaxScore} onChange={(event) => setAssignmentMaxScore(event.target.value)} required />
                </Field>
                <div className="flex items-end justify-end">
                  <button disabled={savingAction === 'assignment'} className="primary-button disabled:opacity-60">
                    {savingAction === 'assignment' ? 'Creating…' : assignmentType === 'quiz' ? 'Create quiz' : 'Create assignment'}
                  </button>
                </div>
              </form>
            )}
            {assignments.length ? (
              <div className="mt-5 space-y-4">
                {assignments.map((assignment) => {
                  const mySubmission = submissions.find((item) => item.assignment_id === assignment.id && item.learner_id === userId)
                  const assignmentSubmissions = submissions.filter((item) => item.assignment_id === assignment.id)
                  return (
                    <article key={assignment.id} className="rounded-xl border border-[#31533d]/10 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold">{assignment.title}</h3>
                          {assignment.instructions && <p className="mt-1 whitespace-pre-wrap text-sm text-[#789083]">{assignment.instructions}</p>}
                          <p className="mt-2 text-xs text-[#789083]">
                            Max score: {assignment.max_score}
                            {assignment.due_at ? ` · Due ${new Date(assignment.due_at).toLocaleString()}` : ''}
                          </p>
                        </div>
                      </div>
                      {role === 'Learner' ? (
                        <div className="mt-4 border-t border-[#31533d]/8 pt-4">
                          {assignment.assessment_type === 'quiz' ? (() => {
                            const attempt = quizAttempts.find((item) => item.assignment_id === assignment.id && item.learner_id === userId)
                            const question = assignment.quiz_questions[0]
                            return attempt ? <p className="rounded-lg bg-[#5D866C]/10 p-3 text-sm">Quiz submitted {new Date(attempt.submitted_at).toLocaleString()} · Score {attempt.score} / {assignment.max_score}</p> : question ? <form onSubmit={(event) => void submitQuiz(event, assignment)} className="space-y-4">{!archived && <><fieldset><legend className="mb-3 text-sm font-semibold">{question.prompt}</legend><div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, index) => <label key={index} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${quizAnswers[assignment.id] === index ? 'border-[#5D866C] bg-[#5D866C]/10' : 'border-[#31533d]/10'}`}><input type="radio" name={`quiz-${assignment.id}`} checked={quizAnswers[assignment.id] === index} onChange={() => setQuizAnswers((current) => ({ ...current, [assignment.id]: index }))} />{option}</label>)}</div></fieldset><button disabled={savingAction === `quiz:${assignment.id}`} className="primary-button">{savingAction === `quiz:${assignment.id}` ? 'Submitting…' : 'Submit quiz'}</button></>}</form> : <p className="text-sm text-[#9b7466]">This quiz has no available questions.</p>
                          })() : <>
                          {mySubmission && (
                            <p className="mb-3 text-xs text-[#789083]">
                              Submitted {new Date(mySubmission.submitted_at).toLocaleString()} · {mySubmission.file_name}
                            </p>
                          )}
                          {!archived && (
                            <form onSubmit={(event) => void submitWork(event, assignment)} className="flex flex-wrap items-center gap-3">
                              <input
                                className="form-input min-w-0 flex-1"
                                type="file"
                                accept=".pdf,.doc,.docx,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                onChange={(event) => setSubmissionFiles((current) => ({ ...current, [assignment.id]: event.target.files?.[0] }))}
                                required={!mySubmission}
                              />
                              <button disabled={savingAction === `submission:${assignment.id}`} className="primary-button disabled:opacity-60">
                                {savingAction === `submission:${assignment.id}` ? 'Submitting…' : mySubmission ? 'Replace submission' : 'Submit work'}
                              </button>
                            </form>
                          )}
                          {mySubmission && (
                            <button type="button" onClick={() => void downloadFile(mySubmission.storage_path, mySubmission.file_name)} className="mt-3 text-xs font-bold text-[#5D866C] hover:underline">
                              Download my submission
                            </button>
                          )}
                          {marks.find((mark) => mark.assignment_id === assignment.id && mark.learner_id === userId) && (
                            <p className="mt-3 rounded-lg bg-[#5D866C]/10 p-3 text-sm">
                              Mark: {marks.find((mark) => mark.assignment_id === assignment.id && mark.learner_id === userId)?.score} / {assignment.max_score}
                              {marks.find((mark) => mark.assignment_id === assignment.id && mark.learner_id === userId)?.feedback
                                ? ` · ${marks.find((mark) => mark.assignment_id === assignment.id && mark.learner_id === userId)?.feedback}`
                                : ''}
                            </p>
                          )}
                          </>}
                        </div>
                      ) : (
                        <div className="mt-4 border-t border-[#31533d]/8 pt-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#789083]">
                            {assignment.assessment_type === 'quiz' ? 'Quiz attempts' : `Submissions (${assignmentSubmissions.length})`}
                          </h4>
                          {assignment.assessment_type === 'quiz' && <ul className="mt-3 divide-y divide-[#31533d]/8">{quizAttempts.filter((attempt) => attempt.assignment_id === assignment.id).map((attempt) => <li key={attempt.id} className="flex justify-between gap-3 py-3 text-sm"><span>{learners.find((learner) => learner.id === attempt.learner_id)?.name ?? 'Enrolled student'} · {new Date(attempt.submitted_at).toLocaleString()}</span><strong>{attempt.score} / {assignment.max_score}</strong></li>)}{!quizAttempts.some((attempt) => attempt.assignment_id === assignment.id) && <li className="py-3 text-sm text-[#789083]">No quiz attempts yet.</li>}</ul>}
                          {assignmentSubmissions.length ? (
                            <ul className="mt-3 divide-y divide-[#31533d]/8">
                              {assignmentSubmissions.map((submission) => {
                                const learner = learners.find((item) => item.id === submission.learner_id)
                                const mark = marks.find((item) => item.assignment_id === assignment.id && item.learner_id === submission.learner_id)
                                return (
                                  <li key={submission.id} className="py-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-bold">{learner?.name ?? 'Enrolled student'}</p>
                                        <p className="text-xs text-[#789083]">{submission.file_name} · {new Date(submission.submitted_at).toLocaleString()}</p>
                                      </div>
                                      <button type="button" onClick={() => void downloadFile(submission.storage_path, submission.file_name)} className="secondary-button">
                                        Download work
                                      </button>
                                    </div>
                                    {!archived && (
                                      <form onSubmit={(event) => void markSubmission(event, assignment, submission)} className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
                                        <input
                                          className="form-input"
                                          type="number"
                                          min="0"
                                          max={assignment.max_score}
                                          step="0.01"
                                          value={scoreDrafts[submission.id] ?? mark?.score ?? ''}
                                          onChange={(event) => setScoreDrafts((current) => ({ ...current, [submission.id]: event.target.value }))}
                                          placeholder={`/${assignment.max_score}`}
                                          required
                                        />
                                        <input
                                          className="form-input"
                                          value={feedbackDrafts[submission.id] ?? mark?.feedback ?? ''}
                                          onChange={(event) => setFeedbackDrafts((current) => ({ ...current, [submission.id]: event.target.value }))}
                                          maxLength={2000}
                                          placeholder="Feedback (optional)"
                                        />
                                        <button disabled={savingAction === `mark:${submission.id}`} className="primary-button disabled:opacity-60">
                                          {savingAction === `mark:${submission.id}` ? 'Saving…' : mark ? 'Update mark' : 'Mark work'}
                                        </button>
                                      </form>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : <p className="mt-3 text-sm text-[#789083]">No work submitted yet.</p>}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : <p className="mt-4 text-sm text-[#789083]">No assignments have been added.</p>}
          </section>
        </div>
      )}
    </DashboardFrame>
  )
}

type AcademyContact = {
  id: string
  subjectId: string
  subjectName: string
  username: string
  fullName: string
}

type AcademyConversation = {
  id: string
  learner_id: string
  instructor_id: string
  subject_id: string
  subjectName: string
  contactName: string
}

function MessagesPage({ role, userId, supabase }: {
  role: Role
  userId: string
  supabase: SupabaseClient
}) {
  const [contacts, setContacts] = useState<AcademyContact[]>([])
  const [conversations, setConversations] = useState<AcademyConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<AcademyConversation | null>(null)
  const [messages, setMessages] = useState<{ id: string; sender_id: string; body: string; sent_at: string }[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const subjectsByContact = new Map<string, { id: string; name: string }>()
        if (role === 'Learner') {
          const { data: enrollments, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('subject_id, subjects(id, name, instructor_id)')
            .eq('learner_id', userId)
          if (enrollmentError) throw enrollmentError
          for (const enrollment of enrollments ?? []) {
            for (const subject of enrollment.subjects ?? []) {
              subjectsByContact.set(`${subject.instructor_id}:${subject.id}`, { id: subject.id, name: subject.name })
            }
          }
        } else {
          const { data: subjects, error: subjectError } = await supabase
            .from('subjects')
            .select('id, name')
            .eq('instructor_id', userId)
          if (subjectError) throw subjectError
          if (subjects?.length) {
            const { data: enrollments, error: enrollmentError } = await supabase
              .from('enrollments')
              .select('subject_id, learner_id')
              .in('subject_id', subjects.map((subject) => subject.id))
            if (enrollmentError) throw enrollmentError
            for (const enrollment of enrollments ?? []) {
              const subject = subjects.find((item) => item.id === enrollment.subject_id)
              if (subject) subjectsByContact.set(`${enrollment.learner_id}:${subject.id}`, { id: subject.id, name: subject.name })
            }
          }
        }

        const counterpartIds = [...new Set([...subjectsByContact.keys()].map((key) => key.split(':')[0]))]
        const { data: profiles, error: profileError } = counterpartIds.length
          ? await supabase.from('profiles').select('id, username, full_name').in('id', counterpartIds)
          : { data: [], error: null }
        if (profileError) throw profileError
        const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
        const nextContacts: AcademyContact[] = []
        for (const [key, subject] of subjectsByContact) {
          const counterpartId = key.split(':')[0]
          const profile = profileById.get(counterpartId)
          if (profile) {
            nextContacts.push({
              id: profile.id,
              username: profile.username,
              fullName: profile.full_name,
              subjectId: subject.id,
              subjectName: subject.name,
            })
          }
        }

        const participantColumn = role === 'Learner' ? 'learner_id' : 'instructor_id'
        const { data: rows, error: conversationError } = await supabase
          .from('conversations')
          .select('id, learner_id, instructor_id, subject_id')
          .eq(participantColumn, userId)
          .order('created_at', { ascending: false })
        if (conversationError) throw conversationError
        const subjectIds = [...new Set((rows ?? []).map((row) => row.subject_id))]
        const { data: threadSubjects, error: threadSubjectError } = subjectIds.length
          ? await supabase.from('subjects').select('id, name').in('id', subjectIds)
          : { data: [], error: null }
        if (threadSubjectError) throw threadSubjectError
        const subjectNameById = new Map((threadSubjects ?? []).map((subject) => [subject.id, subject.name]))
        const profileNameById = new Map(nextContacts.map((contact) => [contact.id, contact.fullName || contact.username]))
        const nextConversations = (rows ?? []).map((row) => {
          const counterpartId = role === 'Learner' ? row.instructor_id : row.learner_id
          return {
            ...row,
            subjectName: subjectNameById.get(row.subject_id) ?? 'Subject',
            contactName: profileNameById.get(counterpartId) ?? 'Academy member',
          }
        })
        if (!active) return
        setContacts(nextContacts)
        setConversations(nextConversations)
        setActiveConversation((current) => current ?? nextConversations[0] ?? null)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load messages.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [role, supabase, userId])

  useEffect(() => {
    if (!activeConversation) {
      setMessages([])
      return
    }
    let active = true
    const loadMessages = async () => {
      const { data, error: messageError } = await supabase
        .from('messages')
        .select('id, sender_id, body, sent_at')
        .eq('conversation_id', activeConversation.id)
        .order('sent_at', { ascending: true })
      if (!active) return
      if (messageError) {
        setError(messageError.message)
        return
      }
      setMessages(data ?? [])
    }
    void loadMessages()
    return () => { active = false }
  }, [activeConversation, supabase])

  const openConversation = async (contact: AcademyContact) => {
    setError('')
    const learnerId = role === 'Learner' ? userId : contact.id
    const instructorId = role === 'Learner' ? contact.id : userId
    try {
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('id, learner_id, instructor_id, subject_id')
        .eq('learner_id', learnerId)
        .eq('instructor_id', instructorId)
        .eq('subject_id', contact.subjectId)
        .maybeSingle()
      if (findError) throw findError
      let conversation = existing
      if (!conversation) {
        const { data, error: createError } = await supabase
          .from('conversations')
          .insert({ learner_id: learnerId, instructor_id: instructorId, subject_id: contact.subjectId })
          .select('id, learner_id, instructor_id, subject_id')
          .single()
        if (createError) throw createError
        conversation = data
      }
      const next = {
        ...conversation,
        subjectName: contact.subjectName,
        contactName: contact.fullName || contact.username,
      }
      setConversations((current) => [next, ...current.filter((item) => item.id !== next.id)])
      setActiveConversation(next)
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Could not open this conversation.')
    }
  }

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    if (!activeConversation || !draft.trim()) return
    const { error: sendError } = await supabase.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: userId,
      body: draft.trim(),
    })
    if (sendError) {
      setError(sendError.message)
      return
    }
    setDraft('')
    const { data, error: refreshError } = await supabase
      .from('messages')
      .select('id, sender_id, body, sent_at')
      .eq('conversation_id', activeConversation.id)
      .order('sent_at', { ascending: true })
    if (refreshError) setError(refreshError.message)
    else setMessages(data ?? [])
  }

  return (
    <DashboardFrame eyebrow="Academy communication" title="Messages" subtitle="Talk privately with learners or instructors in your enrolled subjects.">
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
      {loading ? <div className="card p-6 text-sm text-[#789083]">Loading conversations…</div> : (
        <div className="card grid min-h-[480px] overflow-hidden md:grid-cols-[270px_1fr]">
          <aside className="border-b border-[#31533d]/10 p-3 md:border-b-0 md:border-r">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#789083]">Conversations</p>
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button key={conversation.id} onClick={() => setActiveConversation(conversation)} className={`w-full rounded-xl p-3 text-left ${activeConversation?.id === conversation.id ? 'bg-[#5D866C]/10' : 'hover:bg-[#F5F5F0]'}`}>
                  <span className="block truncate text-sm font-bold">{conversation.contactName}</span>
                  <span className="mt-1 block truncate text-xs text-[#789083]">{conversation.subjectName}</span>
                </button>
              ))}
            </div>
            {contacts.length > 0 && (
              <>
                <p className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#789083]">Start a conversation</p>
                <div className="space-y-1">
                  {contacts.map((contact) => (
                    <button key={`${contact.id}:${contact.subjectId}`} onClick={() => void openConversation(contact)} className="w-full rounded-xl p-3 text-left hover:bg-[#F5F5F0]">
                      <span className="block truncate text-sm font-bold">{contact.fullName || contact.username}</span>
                      <span className="mt-1 block truncate text-xs text-[#789083]">{contact.subjectName}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>
          <section className="flex min-h-[420px] flex-col">
            {activeConversation ? (
              <>
                <header className="border-b border-[#31533d]/10 px-5 py-4">
                  <h2 className="font-display font-bold">{activeConversation.contactName}</h2>
                  <p className="mt-1 text-xs text-[#789083]">{activeConversation.subjectName}</p>
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {messages.length ? messages.map((message) => (
                    <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender_id === userId ? 'ml-auto bg-[#5D866C] text-white' : 'bg-[#F5F5F0] text-[#284633]'}`}>
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <time className={`mt-2 block text-[9px] ${message.sender_id === userId ? 'text-white/65' : 'text-[#789083]'}`}>{new Date(message.sent_at).toLocaleString()}</time>
                    </div>
                  )) : <p className="text-sm text-[#789083]">No messages yet. Send a message to get started.</p>}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#31533d]/10 p-4">
                  <input aria-label="Message" value={draft} onChange={(event) => setDraft(event.target.value)} className="form-input" maxLength={5000} placeholder="Write a message…" required />
                  <button className="primary-button">Send</button>
                </form>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center text-sm text-[#789083]">
                {contacts.length ? 'Choose a conversation or start one with a class contact.' : 'Enroll in a subject to message its instructor or learners.'}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardFrame>
  )
}

function MarksPage({ role, userId, supabase }: {
  role: Role
  userId: string
  supabase: SupabaseClient
}) {
  const [marks, setMarks] = useState<{ id: string; assessment_name: string; score: number; max_score: number; assessed_on: string; feedback: string; subjectName: string }[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [learners, setLearners] = useState<{ id: string; name: string }[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [learnerId, setLearnerId] = useState('')
  const [assessmentName, setAssessmentName] = useState('')
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('')
  const [assessedOn, setAssessedOn] = useState(new Date().toISOString().slice(0, 10))
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const refreshMarks = useCallback(async () => {
    const { data, error: marksError } = await supabase
      .from('marks')
      .select('id, assessment_name, score, max_score, assessed_on, feedback, subject_id')
      .eq(role === 'Learner' ? 'learner_id' : 'recorded_by', userId)
      .order('assessed_on', { ascending: false })
    if (marksError) throw marksError
    const subjectIds = [...new Set((data ?? []).map((mark) => mark.subject_id))]
    const { data: subjectRows, error: subjectError } = subjectIds.length
      ? await supabase.from('subjects').select('id, name').in('id', subjectIds)
      : { data: [], error: null }
    if (subjectError) throw subjectError
    const nameById = new Map((subjectRows ?? []).map((subject) => [subject.id, subject.name]))
    setMarks((data ?? []).map((mark) => ({
      ...mark,
      subjectName: nameById.get(mark.subject_id) ?? 'Subject',
    })))
  }, [role, supabase, userId])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        await refreshMarks()
        if (role === 'Instructor' || role === 'Admin') {
          const subjectQuery = supabase.from('subjects').select('id, name')
          const { data: subjectRows, error: subjectError } = role === 'Admin'
            ? await subjectQuery
            : await subjectQuery.eq('instructor_id', userId)
          if (subjectError) throw subjectError
          const nextSubjects = subjectRows ?? []
          if (active) setSubjects(nextSubjects)
          if (nextSubjects.length) {
            const { data: enrollmentRows, error: enrollmentError } = await supabase
              .from('enrollments')
              .select('learner_id')
              .in('subject_id', nextSubjects.map((subject) => subject.id))
            if (enrollmentError) throw enrollmentError
            const learnerIds = [...new Set((enrollmentRows ?? []).map((row) => row.learner_id))]
            if (learnerIds.length) {
              const { data: learnerRows, error: learnerError } = await supabase
                .from('profiles')
                .select('id, username, full_name')
                .in('id', learnerIds)
              if (learnerError) throw learnerError
              if (active) setLearners((learnerRows ?? []).map((learner) => ({
                id: learner.id,
                name: learner.full_name || learner.username,
              })))
            }
          }
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load marks.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [refreshMarks, role, supabase, userId])

  const recordMark = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    const numericScore = Number(score)
    const numericMax = Number(maxScore)
    if (!Number.isFinite(numericScore) || !Number.isFinite(numericMax) || numericScore < 0 || numericMax <= 0 || numericScore > numericMax) {
      setError('Enter a score from 0 to the maximum score.')
      return
    }
    const { error: insertError } = await supabase.from('marks').insert({
      learner_id: learnerId,
      subject_id: subjectId,
      recorded_by: userId,
      assessment_name: assessmentName.trim(),
      score: numericScore,
      max_score: numericMax,
      assessed_on: assessedOn,
      feedback: feedback.trim(),
    })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setMessage('Mark recorded.')
    setAssessmentName('')
    setScore('')
    setMaxScore('')
    setFeedback('')
    try {
      await refreshMarks()
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Mark was saved, but the list could not be refreshed.')
    }
  }

  const canRecord = role === 'Instructor' || role === 'Admin'
  return (
    <DashboardFrame eyebrow="Learning results" title={canRecord ? 'Record and review marks' : 'My marks'} subtitle={canRecord ? 'Record assessment results for learners enrolled in your subjects.' : 'Review your recorded assessment results.'}>
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#9b7466]/10 p-3 text-sm text-[#8a5548]">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-[#5D866C]/10 p-3 text-sm text-[#31533d]">{message}</p>}
      {canRecord && (
        <form onSubmit={recordMark} className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
          <Field label="Learner">
            <select className="form-input" value={learnerId} onChange={(event) => setLearnerId(event.target.value)} required>
              <option value="">Select a learner</option>
              {learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.name}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <select className="form-input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required>
              <option value="">Select a subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </Field>
          <Field label="Assessment">
            <input className="form-input" value={assessmentName} onChange={(event) => setAssessmentName(event.target.value)} required maxLength={160} placeholder="e.g. Term 2 examination" />
          </Field>
          <Field label="Date">
            <input className="form-input" type="date" value={assessedOn} onChange={(event) => setAssessedOn(event.target.value)} required />
          </Field>
          <Field label="Score">
            <input className="form-input" type="number" min="0" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} required />
          </Field>
          <Field label="Maximum score">
            <input className="form-input" type="number" min="0.01" step="0.01" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} required />
          </Field>
          <Field label="Feedback" wide>
            <textarea className="form-input resize-none" rows={3} value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={2000} />
          </Field>
          <div className="flex justify-end md:col-span-2">
            <button className="primary-button">Save mark</button>
          </div>
        </form>
      )}
      {loading ? <div className="card p-6 text-sm text-[#789083]">Loading marks…</div> : (
        <div className="card overflow-hidden">
          {marks.length ? marks.map((mark) => (
            <article key={mark.id} className="flex items-center justify-between gap-4 border-b border-[#31533d]/8 p-5 last:border-0">
              <div>
                <h2 className="font-display font-bold">{mark.assessment_name}</h2>
                <p className="mt-1 text-xs text-[#789083]">{mark.subjectName} · {new Date(`${mark.assessed_on}T00:00:00`).toLocaleDateString()}</p>
                {mark.feedback && <p className="mt-2 text-sm text-[#718078]">{mark.feedback}</p>}
              </div>
              <span className="shrink-0 rounded-lg bg-[#E6D8C3]/45 px-3 py-2 text-sm font-bold text-[#5D866C]">{mark.score} / {mark.max_score}</span>
            </article>
          )) : <p className="p-6 text-sm text-[#789083]">No marks recorded yet.</p>}
        </div>
      )}
    </DashboardFrame>
  )
}

function PlaceholderPage({ role, active }: { role: Role; active: string }) {
  return (
    <DashboardFrame
      eyebrow={`${role} workspace`}
      title={active}
      subtitle={`The ${active.toLowerCase()} workspace is being prepared.`}
    >
      <div className="card p-6 text-sm text-[#789083]">No academic demo records are shown here.</div>
    </DashboardFrame>
  )
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#718078]">
        {label}
      </span>
      {children}
    </label>
  )
}

function registrationLoginEmail(identifier: string) {
  const registration = identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  return registration ? `student+${registration}@login.dzikaz.ac.zw` : ''
}

type LoginRole = 'learner' | 'instructor' | 'admin'

const loginRoles: { value: LoginRole; label: string }[] = [
  { value: 'learner', label: 'Student' },
  { value: 'instructor', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
]

function LoginPage({
  supabase,
  academyName,
  onSignInAttempt,
}: {
  supabase: SupabaseClient | null
  academyName: string
  onSignInAttempt: () => void
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loginRole, setLoginRole] = useState<LoginRole>('learner')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!supabase) {
      setError('Supabase is not configured. Add the project URL and anon key to your .env.local file.')
      return
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'signup') {
        const username = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 25)}`
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { username, full_name: fullName.trim() },
            emailRedirectTo: window.location.origin,
          },
        })
        if (signUpError) throw signUpError
        setMessage('Account created. Check your email to confirm your address, then sign in.')
        setMode('signin')
      } else {
        onSignInAttempt()
        const identifier = email.trim()
        const authEmail =
          loginRole === 'learner' && !identifier.includes('@')
            ? registrationLoginEmail(identifier)
            : identifier.toLowerCase()
        if (!authEmail) {
          setError(
            loginRole === 'learner'
              ? 'Enter your email address or registration number.'
              : 'Enter your email address.',
          )
          return
        }
        if (!authEmail.includes('@')) {
          setError('Enter a valid email address.')
          return
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        })
        if (signInError) throw signInError
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#31533d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-36 -top-28 h-[30rem] w-[30rem] rounded-full border border-white/10" />
        <div className="absolute -bottom-48 -left-36 h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <div className="relative"><Logo academyName={academyName} /></div>
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#E6D8C3]">Learn. Grow. Achieve.</p>
          <h1 className="font-display mt-5 text-5xl font-extrabold leading-tight">Reaching learning heights.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70">
            One connected space for learners, instructors, and the {academyName} community.
          </p>
        </div>
        <p className="relative text-xs text-white/45">© {academyName}</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 lg:hidden">
            <LogoMark />
            <span className="font-display text-lg font-bold">{academyName}</span>
          </div>
          <div className="mt-8 lg:mt-0">
            {mode === 'signin' && (
              <div
                aria-label="Sign in as"
                className="mb-7 grid grid-cols-3 rounded-xl bg-[#F5F5F0] p-1"
                role="tablist"
              >
                {loginRoles.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    id={`login-tab-${item.value}`}
                    role="tab"
                    aria-selected={loginRole === item.value}
                    aria-controls="login-panel"
                    onClick={() => {
                      setLoginRole(item.value)
                      onSignInAttempt()
                      setError('')
                      setMessage('')
                    }}
                    className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${
                      loginRole === item.value
                        ? item.value === 'admin'
                          ? 'bg-[#31533d] text-white shadow-sm'
                          : 'bg-white text-[#31533d] shadow-sm'
                        : 'text-[#789083] hover:text-[#31533d]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#5D866C]">
              Reaching learning heights
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold">
              {mode === 'signup'
                ? 'Create your learner account'
                : loginRole === 'admin'
                  ? 'Admin sign in'
                  : loginRole === 'instructor'
                    ? 'Teacher sign in'
                    : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-[#789083]">
              {mode === 'signup'
                ? 'Create your learner account with your name, email address, and password.'
                : loginRole === 'learner'
                  ? 'Sign in with your academy email or registration number and password.'
                  : loginRole === 'instructor'
                    ? 'Sign in to your teacher workspace with your email and password.'
                    : 'Secure access for academy administrators.'}
            </p>
          </div>
          <form
            id="login-panel"
            role="tabpanel"
            aria-labelledby={mode === 'signin' ? `login-tab-${loginRole}` : undefined}
            onSubmit={submit}
            className={`mt-8 space-y-4 ${
              mode === 'signin' && loginRole === 'admin'
                ? 'rounded-2xl border border-[#C2A68C]/50 bg-[#F5F5F0] p-5 shadow-sm'
                : ''
            }`}
          >
            {mode === 'signup' && (
              <>
                <Field label="Full name">
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="form-input"
                    autoComplete="name"
                    required
                    placeholder="Your name"
                  />
                </Field>
              </>
            )}
            <Field
              label={
                mode === 'signin' && loginRole === 'learner'
                  ? 'Email address or registration number'
                  : 'Email address'
              }
            >
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
              type={mode === 'signin' && loginRole === 'learner' ? 'text' : 'email'}
              autoComplete={mode === 'signin' ? 'username' : 'email'}
              required
              placeholder={
                mode === 'signin' && loginRole === 'learner'
                  ? 'you@gmail.com or your registration number'
                  : 'you@gmail.com'
              }
            />
          </Field>
          <Field label="Password">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              placeholder="At least 8 characters"
            />
          </Field>
          {error && (
            <p role="alert" className="rounded-lg bg-[#9b7466]/10 p-3 text-xs text-[#8a5548]">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded-lg bg-[#5D866C]/10 p-3 text-xs text-[#31533d]">
              {message}
            </p>
          )}
          <button disabled={submitting} className="primary-button w-full justify-center py-3.5 disabled:opacity-60">
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          </form>
          {loginRole === 'learner' && (
            <p className="mt-6 text-center text-sm text-[#789083]">
              {mode === 'signin' ? `New to ${academyName}?` : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  const nextMode = mode === 'signin' ? 'signup' : 'signin'
                  setMode(nextMode)
                  if (nextMode === 'signup') {
                    setLoginRole('learner')
                    onSignInAttempt()
                  }
                  setError('')
                  setMessage('')
                }}
                className="font-bold text-[#5D866C] hover:underline"
              >
                {mode === 'signin' ? 'Create a learner account' : 'Sign in'}
              </button>
            </p>
          )}
          <p className="mt-5 text-center text-[10px] text-[#98a19c]">
            {loginRole === 'admin'
              ? 'Need an admin account? Ask an existing administrator to add you from User management.'
              : 'Instructor and administrator accounts are created by academy administrators.'}
          </p>
        </div>
      </section>
    </main>
  )
}

function PasswordChangePage({
  supabase,
  academyName,
  onComplete,
}: {
  supabase: SupabaseClient
  academyName: string
  onComplete: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('The passwords do not match.')
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) setError(updateError.message)
    else onComplete()
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F5F0] px-5 py-12">
      <form onSubmit={submit} className="card w-full max-w-md p-7 sm:p-9">
        <div className="flex justify-center"><LogoMark /></div>
        <h1 className="font-display mt-6 text-center text-2xl font-bold">Set a new password</h1>
        <p className="mt-2 text-center text-sm leading-6 text-[#789083]">
          For your security, choose a new password before continuing to {academyName}.
        </p>
        <div className="mt-6 space-y-4">
          <Field label="New password">
            <input className="form-input" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Confirm new password">
            <input className="form-input" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </Field>
          {error && <p role="alert" className="rounded-lg bg-[#9b7466]/10 p-3 text-xs text-[#8a5548]">{error}</p>}
          <button disabled={saving} className="primary-button w-full py-3.5 disabled:opacity-60">
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </main>
  )
}

function LogoMark() {
  return <LogoImage className="h-16 w-16 rounded-2xl" />
}

function LogoImage({ className }: { className: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden bg-[#f8f8f5] ${className}`}>
      <Image
        src={academyLogo}
        alt="Academy logo"
        fill
        sizes="64px"
        className="object-contain"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-[5%] right-0 h-[11%] w-[31%] bg-[#f8f8f5]"
      />
    </span>
  )
}

function ProfileModal({
  open,
  profile,
  onClose,
  onSave,
  onChangePassword,
  onSwitch,
}: {
  open: boolean
  profile: Profile
  onClose: () => void
  onSave: (profile: Profile) => Promise<string | undefined>
  onChangePassword: (password: string) => Promise<string | undefined>
  onSwitch: () => void
}) {
  const [draft, setDraft] = useState(profile)
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [settingsTab, setSettingsTab] = useState<'general' | 'profile' | 'security'>('general')
  useEffect(() => setDraft(profile), [profile, open])
  useEffect(() => {
    if (open) {
      setNewPassword('')
      setPasswordConfirmation('')
      setError('')
      setSettingsTab('general')
    }
  }, [open])
  if (!open) return null
  const upload = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP profile image.')
      return
    }
    if (file.size > 2_000_000) {
      setError('Choose a profile image smaller than 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setDraft((current) => ({ ...current, image: String(reader.result), avatarFile: file }))
      setError('')
    }
    reader.onerror = () => setError('Could not read the selected profile image.')
    reader.readAsDataURL(file)
  }
  return (
    <div className="modal-backdrop">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setError('')
          if ((newPassword || passwordConfirmation) && newPassword.length < 8) {
            setError('Use a new password with at least 8 characters.')
            return
          }
          if (newPassword !== passwordConfirmation) {
            setError('The new passwords do not match.')
            return
          }
          const saveError = await onSave(draft)
          if (saveError) setError(saveError)
          else if (newPassword) {
            const passwordError = await onChangePassword(newPassword)
            if (passwordError) setError(`Profile saved, but the password could not be changed: ${passwordError}`)
            else onClose()
          } else onClose()
        }}
        className="modal-card max-w-4xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5D866C]">
              Account settings
            </p>
            <h2 className="font-display mt-1 text-xl font-bold">Update your profile</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-[190px_minmax(0,1fr)]">
          <nav role="tablist" aria-label="Account settings" className="flex h-fit flex-col overflow-hidden rounded-xl border border-[#31533d]/10 bg-white p-2">
            {([
              ['general', 'General'],
              ['profile', 'Profile'],
              ['security', 'Password'],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={settingsTab === key} onClick={() => setSettingsTab(key)} className={`flex items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold ${settingsTab === key ? 'bg-[#E6D8C3]/45 text-[#31533d]' : 'text-[#789083] hover:bg-[#F5F5F0]'}`}>
                {label}<Icon name="chevron" size={15} />
              </button>
            ))}
          </nav>
          <div id="account-settings-panel" role="tabpanel" className="min-h-64 rounded-xl bg-white p-4 md:p-5">
            {settingsTab === 'general' && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input className="form-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required maxLength={120} /></Field>
              <Field label="Username"><input className="form-input" value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} autoComplete="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9_]{3,30}" title="Use 3 to 30 letters, numbers, or underscores." required /></Field>
              <Field label="Sign-in email"><input className="form-input" type="text" value={draft.email} readOnly /><p className="mt-1 text-[10px] text-[#929d96]">Contact an administrator to change your email address.</p></Field>
              <Field label="School / organisation"><input className="form-input" value={draft.school} onChange={(e) => setDraft({ ...draft, school: e.target.value })} maxLength={120} /></Field>
              <Field label="Phone number"><input className="form-input" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} maxLength={40} /></Field>
            </div>}
            {settingsTab === 'profile' && <div>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar initials={initials(draft.name)} image={draft.image} />
                <label className="secondary-button"><Icon name="camera" size={15} /> Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} className="hidden" /></label>
                <span className="text-[10px] text-[#929d96]">JPG, PNG, or WebP, up to 2 MB</span>
              </div>
              <Field label="Bio"><textarea className="form-input mt-5 min-h-32 resize-y" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} maxLength={300} placeholder="A little about you" /><p className="mt-1 text-right text-[10px] text-[#929d96]">{draft.bio.length}/300</p></Field>
            </div>}
            {settingsTab === 'security' && <div className="max-w-lg">
              <h3 className="font-display text-lg font-bold text-[#284633]">Change password</h3>
              <p className="mt-1 text-sm text-[#789083]">Leave both fields blank to keep your current password.</p>
              <div className="mt-5 space-y-4">
                <Field label="New password"><input className="form-input" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
                <Field label="Confirm new password"><input className="form-input" type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} /></Field>
              </div>
            </div>}
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-[#9b7466]/10 p-3 text-xs text-[#8a5548]">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <button type="button" onClick={onSwitch} className="text-xs font-bold text-[#5D866C]">
            Sign out
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="secondary-button">
              Cancel
            </button>
            <button className="primary-button">Save changes</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const [supabase] = useState(getSupabaseBrowserClient)
  const [organizationName, setOrganizationName] = useState('St Dzikaz Academy')
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [authError, setAuthError] = useState('')
  const [role, setRole] = useState<Role>('Learner')
  const [active, setActive] = useState('Overview')
  const [profileOpen, setProfileOpen] = useState(false)
  const [profiles, setProfiles] = useState<Record<Role, Profile>>(profileDefaults)
  const [notices, setNotices] = useState<Notice[]>(initialNotices)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    const loadAcademyName = async () => {
      const { data } = await supabase
        .from('academy_settings')
        .select('organization_name')
        .eq('id', 'academy')
        .maybeSingle()
      if (active && data?.organization_name) setOrganizationName(data.organization_name)
    }
    void loadAcademyName()
    return () => {
      active = false
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      setProfileReady(true)
      return
    }

    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setAuthUser(session?.user ?? null)
      setAuthLoading(false)
      setProfileReady(!session)
      if (!session) setRequiresPasswordChange(false)
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError(`Could not restore your sign-in session: ${error.message}`)
      setAuthUser(data.session?.user ?? null)
      setAuthLoading(false)
      setProfileReady(!data.session)
      if (!data.session) setRequiresPasswordChange(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase || !authUser) return
    let active = true
    setProfileReady(false)
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, role, school, phone, requires_password_change')
        .eq('id', authUser.id)
        .single()

      if (!active) return
      if (error) {
        setAuthError(`Could not load your academy profile: ${error.message}`)
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) setAuthError(`${error.message} Sign-out failed: ${signOutError.message}`)
        setProfileReady(true)
        return
      }

      const { data: profileExtras } = await supabase
        .from('profiles')
        .select('bio, avatar_url')
        .eq('id', authUser.id)
        .maybeSingle()
      if (!active) return

      const roleByDatabaseValue: Record<string, Role> = {
        learner: 'Learner',
        instructor: 'Instructor',
        admin: 'Admin',
      }
      const nextRole = roleByDatabaseValue[data.role]
      if (!nextRole) {
        setAuthError('Your account has an unsupported academy role. Contact an administrator.')
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) setAuthError(`Unsupported academy role. Sign-out failed: ${signOutError.message}`)
        setProfileReady(true)
        return
      }

      const { data: studentDetails, error: detailsError } = nextRole === 'Learner'
        ? await supabase
            .from('student_details')
            .select('contact_number')
            .eq('profile_id', authUser.id)
            .maybeSingle()
        : { data: null, error: null }
      if (detailsError) {
        setAuthError(`Could not load your student details: ${detailsError.message}`)
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) setAuthError(`${detailsError.message} Sign-out failed: ${signOutError.message}`)
        setProfileReady(true)
        return
      }

      setAuthError('')
      setRole(nextRole)
      setActive('Overview')
      setRequiresPasswordChange(data.requires_password_change === true)
      setProfiles((current) => ({
        ...current,
        [nextRole]: {
          ...current[nextRole],
          name: data.full_name || data.username,
          username: data.username,
          bio: profileExtras?.bio ?? '',
          image: profileExtras?.avatar_url || undefined,
          avatarFile: undefined,
          email: authUser.email?.endsWith('@login.dzikaz.ac.zw')
            ? 'Registration number and password'
            : authUser.email ?? '',
          school: data.school,
          phone: nextRole === 'Learner' ? studentDetails?.contact_number ?? '' : data.phone,
        },
      }))
      setProfileReady(true)
    }
    void loadProfile()
    return () => {
      active = false
    }
  }, [authUser, supabase])

  useEffect(() => {
    const stored = window.localStorage.getItem('dzikaz-demo')
    if (!stored) {
      setHydrated(true)
      return
    }
    try {
      const data = JSON.parse(stored)
      if (data.notices) setNotices(data.notices)
    } catch {
      window.localStorage.removeItem('dzikaz-demo')
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(
      'dzikaz-demo',
      JSON.stringify({ notices }),
    )
  }, [notices, hydrated])

  const logout = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setAuthError(`Could not sign out: ${error.message}`)
  }

  if (authLoading || (authUser && !profileReady)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F5F5F0]">
        <p className="text-sm font-semibold text-[#5D866C]">Connecting to {organizationName}…</p>
      </main>
    )
  }

  if (!authUser || !profileReady || !supabase) {
    return (
      <>
        {authError && (
          <div role="alert" className="fixed inset-x-4 top-4 z-10 mx-auto max-w-xl rounded-lg bg-[#9b7466] p-3 text-center text-sm text-white">
            {authError}
          </div>
        )}
        <LoginPage
          supabase={supabase}
          academyName={organizationName}
          onSignInAttempt={() => setAuthError('')}
        />
      </>
    )
  }

  if (requiresPasswordChange) {
    return <PasswordChangePage supabase={supabase} academyName={organizationName} onComplete={() => setRequiresPasswordChange(false)} />
  }

  const renderContent = () => {
    if (role === 'Admin' && active === 'Users')
      return <AdminUsersPage supabase={supabase} />
    if (role === 'Admin' && ['Classes & Grades', 'Subjects', 'Teacher Assignments', 'Student Enrolments', 'Academic Reports'].includes(active))
      return <AdminAcademicPage supabase={supabase} section={active} />
    if (role === 'Admin' && active === 'Settings')
      return (
        <AdminSettingsPage
          supabase={supabase}
          organizationName={organizationName}
          onManageUsers={() => setActive('Users')}
          onOrganizationNameChange={setOrganizationName}
        />
      )
    if (
      (role === 'Learner' && (active === 'My learning' || active === 'Classrooms')) ||
      (role === 'Instructor' && ['My subjects', 'My classes', 'Classrooms', 'Lessons & resources', 'Assignments', 'Submissions & grading', 'Student performance'].includes(active))
    ) {
      return <ClassroomsPage role={role} userId={authUser.id} supabase={supabase} />
    }
    if (active === 'Notice board')
      return <NoticeBoard role={role} notices={notices} setNotices={setNotices} userId={authUser.id} supabase={supabase} />
    if (active === 'Calendar')
      return <CalendarPage role={role} userId={authUser.id} supabase={supabase} />
    if (active === 'Messages' && role !== 'Admin')
      return <MessagesPage role={role} userId={authUser.id} supabase={supabase} />
    if (active === 'Marks' || active === 'My marks')
      return <MarksPage role={role} userId={authUser.id} supabase={supabase} />
    if (active !== 'Overview') return <PlaceholderPage role={role} active={active} />
    return role === 'Learner' ? (
      <LearnerDashboard
        name={profiles.Learner.name}
        userId={authUser.id}
        supabase={supabase}
      />
    ) : role === 'Instructor' ? (
      <InstructorDashboard supabase={supabase} userId={authUser.id} onOpenSubjects={() => setActive('My subjects')} />
    ) : (
      <AdminDashboard supabase={supabase} onManageUsers={() => setActive('Users')} />
    )
  }
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#284633]">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        profile={profiles[role]}
        academyName={organizationName}
        onProfile={() => setProfileOpen(true)}
        onLogout={() => void logout()}
      />
      <div className="lg:pl-[250px]">
        <Header
          role={role}
          profile={profiles[role]}
          academyName={organizationName}
          onProfile={() => setProfileOpen(true)}
          onNavigate={setActive}
        />
        {renderContent()}
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-start gap-1 overflow-x-auto rounded-2xl border border-[#31533d]/10 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
        {navByRole[role].map((item) => (
          <button
            key={item.label}
            onClick={() => setActive(item.label)}
            className={`flex min-w-[58px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-bold ${active === item.label ? 'bg-[#5D866C] text-white' : 'text-[#789083]'}`}
          >
            <Icon name={item.icon} size={17} />
            <span className="max-w-16 truncate">{item.label}</span>
          </button>
        ))}
      </nav>
      <ProfileModal
        open={profileOpen}
        profile={profiles[role]}
        onClose={() => setProfileOpen(false)}
        onSave={async (profile) => {
          let avatarUrl = profile.image ?? ''
          if (profile.avatarFile) {
            const avatarPath = `${authUser.id}/avatar`
            const { error: avatarError } = await supabase.storage
              .from('profile-avatars')
              .upload(avatarPath, profile.avatarFile, {
                upsert: true,
                contentType: profile.avatarFile.type,
                cacheControl: '3600',
              })
            if (avatarError) return avatarError.message
            avatarUrl = `${supabase.storage.from('profile-avatars').getPublicUrl(avatarPath).data.publicUrl}?v=${Date.now()}`
          }
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: profile.name.trim(),
              username: profile.username.trim(),
              bio: profile.bio.trim(),
              avatar_url: avatarUrl,
              school: profile.school.trim(),
              ...(role === 'Learner' ? {} : { phone: profile.phone.trim() }),
            })
            .eq('id', authUser.id)
          if (profileError) return profileError.message
          if (role === 'Learner') {
            const { error: detailsError } = await supabase
              .from('student_details')
              .update({ contact_number: profile.phone.trim() })
              .eq('profile_id', authUser.id)
            if (detailsError) return detailsError.message
          }
          setProfiles((current) => ({
            ...current,
            [role]: { ...profile, image: avatarUrl, avatarFile: undefined },
          }))
          return undefined
        }}
        onChangePassword={async (password) => {
          const { error: passwordError } = await supabase.auth.updateUser({ password })
          return passwordError?.message
        }}
        onSwitch={() => {
          setProfileOpen(false)
          void logout()
        }}
      />
    </div>
  )
}
