'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

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
    { label: 'My marks', icon: 'chart' },
    { label: 'Messages', icon: 'mail' },
    { label: 'Notice board', icon: 'bell' },
    { label: 'Calendar', icon: 'calendar' },
  ],
  Instructor: [
    { label: 'Overview', icon: 'home' },
    { label: 'My subjects', icon: 'book' },
    { label: 'Students', icon: 'users' },
    { label: 'Marks', icon: 'chart' },
    { label: 'Messages', icon: 'mail' },
    { label: 'Notice board', icon: 'bell' },
    { label: 'Calendar', icon: 'calendar' },
  ],
  Admin: [
    { label: 'Overview', icon: 'home' },
    { label: 'User management', icon: 'users' },
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
}

type Profile = {
  name: string
  email: string
  school: string
  phone: string
  image?: string
}

const profileDefaults: Record<Role, Profile> = {
  Learner: {
    name: 'Amara Moyo',
    email: 'amara@dzikaz.ac.zw',
    school: 'Harare High School',
    phone: '+263 77 245 8190',
  },
  Instructor: {
    name: 'Caleb Kunda',
    email: 'caleb@dzikaz.ac.zw',
    school: 'St Dzikaz Academy',
    phone: '+263 71 820 4412',
  },
  Admin: {
    name: 'Tina Ncube',
    email: 'tina@dzikaz.ac.zw',
    school: 'St Dzikaz Academy',
    phone: '+263 78 106 9023',
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

const initialSubjects: Subject[] = [
  { id: 'math', name: 'Mathematics', level: 'O Level', code: '4008', learners: 168 },
  { id: 'physics', name: 'Physics', level: 'A Level', code: '6031', learners: 84 },
  { id: 'cs', name: 'Computer Science', level: 'O Level', code: '7014', learners: 126 },
]

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoImage className="h-10 w-10 shrink-0 rounded-xl" />
      {!compact && (
        <div>
          <div className="font-display text-lg font-bold leading-none tracking-tight">
            St Dzikaz Academy
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
  onProfile,
  onLogout,
}: {
  role: Role
  active: string
  setActive: (v: string) => void
  profile: Profile
  onProfile: () => void
  onLogout: () => void
}) {
  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col bg-[#5D866C] px-4 py-6 text-white lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="mt-12 flex-1 space-y-1.5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">
          Workspace
        </p>
        {navByRole[role].map((item) => (
          <button
            key={item.label}
            onClick={() => setActive(item.label)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === item.label ? 'bg-white text-[#31533d] shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <Icon name={item.icon} size={19} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/15 pt-4">
        <button
          onClick={onProfile}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/65 hover:bg-white/10 hover:text-white"
        >
          <Icon name="user" size={18} />
          Edit profile
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/65 hover:bg-white/10 hover:text-white"
        >
          <Icon name="logout" size={18} />
          Log out
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#31533d]/40 p-3">
          <Avatar initials={initials(profile.name)} image={profile.image} />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{profile.name}</p>
            <p className="text-[10px] text-white/50">{role} account</p>
          </div>
          <Icon name="more" size={17} className="ml-auto text-white/50" />
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
  onProfile,
  onNavigate,
}: {
  role: Role
  profile: Profile
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
        <Logo compact />
        <span className="font-display font-bold text-[#31533d]">St Dzikaz</span>
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
          else onNavigate(role === 'Admin' ? 'User management' : 'Students')
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

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-lg font-bold tracking-tight text-[#284633]">{title}</h2>
      {action && (
        <button className="flex items-center gap-1 text-xs font-bold text-[#5D866C] hover:text-[#31533d]">
          {action}
          <Icon name="chevron" size={14} />
        </button>
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

function LearnerDashboard() {
  const [continued, setContinued] = useState(false)
  return (
    <DashboardFrame
      eyebrow="Learner dashboard"
      title="Good morning, Amara"
      subtitle="Your next learning milestone is closer than you think."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current streak"
          value="12 days"
          detail="Personal best: 18 days"
          icon="trend"
          accent
        />
        <StatCard label="Hours learned" value="28.5" detail="+4.2 hours this week" icon="clock" />
        <StatCard label="Courses active" value="4" detail="2 lessons due today" icon="book" />
        <StatCard label="Certificates" value="7" detail="Latest earned 6 days ago" icon="award" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div>
          <SectionTitle title="Continue learning" action="View all courses" />
          <div className="card overflow-hidden">
            <div className="grid md:grid-cols-[220px_1fr]">
              <div className="course-art relative flex min-h-48 items-end overflow-hidden bg-[#31533d] p-5 text-white">
                <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[22px] border-[#C2A68C]/35" />
                <div className="absolute right-10 top-14 h-24 w-24 rotate-45 border-2 border-[#E6D8C3]/40" />
                <div className="relative">
                  <span className="rounded-md bg-[#E6D8C3] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#31533d]">
                    Career track
                  </span>
                  <p className="font-display mt-3 text-xl font-bold leading-tight">
                    Data Analyst
                    <br />
                    with Python
                  </p>
                </div>
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#5D866C]">Chapter 4 of 9</p>
                    <h3 className="font-display mt-1 text-xl font-bold text-[#284633]">
                      Transforming DataFrames
                    </h3>
                  </div>
                  <ProgressRing value={continued ? 72 : 64} size={70} />
                </div>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#708277]">
                  Practice filtering, sorting, and grouping real-world datasets with pandas.
                </p>
                <button
                  onClick={() => setContinued(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#5D866C] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#4d765c]"
                >
                  <Icon name={continued ? 'check' : 'play'} size={16} />
                  {continued ? 'Lesson opened' : 'Continue course'}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <SectionTitle title="Recommended for you" action="Explore library" />
            <div className="grid gap-4 sm:grid-cols-2">
              <CourseMini
                title="SQL for Data Analysis"
                tag="Data"
                lessons="18 lessons"
                tone="green"
              />
              <CourseMini
                title="Presenting with Impact"
                tag="Business"
                lessons="12 lessons"
                tone="sand"
              />
            </div>
          </div>
        </div>
        <div>
          <SectionTitle title="This week" />
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#789083]">Weekly goal</p>
                <p className="font-display mt-1 text-2xl font-bold text-[#284633]">
                  3h 45m <span className="text-sm font-medium text-[#789083]">/ 5h</span>
                </p>
              </div>
              <span className="rounded-lg bg-[#E6D8C3]/55 px-2.5 py-1 text-[10px] font-bold text-[#5D866C]">
                75% complete
              </span>
            </div>
            <div className="mt-6 flex h-32 items-end justify-between gap-2">
              {[34, 58, 42, 80, 66, 25, 12].map((h, i) => (
                <div className="flex flex-1 flex-col items-center gap-2" key={i}>
                  <div className="relative h-24 w-full max-w-5 rounded-full bg-[#E6D8C3]/45">
                    <div
                      className={`absolute inset-x-0 bottom-0 rounded-full ${i === 3 ? 'bg-[#5D866C]' : 'bg-[#C2A68C]'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[#829188]">{'MTWTFSS'[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card mt-4 p-5">
            <SectionTitle title="Upcoming" />
            <Timeline
              time="Today, 14:00"
              title="Python skill assessment"
              type="Assessment · 25 min"
            />
            <Timeline
              time="Tomorrow, 09:30"
              title="Live career workshop"
              type="Live session · 60 min"
              last
            />
          </div>
        </div>
      </div>
    </DashboardFrame>
  )
}

function InstructorDashboard() {
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

function AdminDashboard() {
  const downloadReport = () => {
    const report =
      'Metric,Value\nTotal users,8492\nCourse enrollments,3840\nCompletion rate,78.2%\nLearning hours,12800\n'
    const url = URL.createObjectURL(new Blob([report], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'dzikaz-academy-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <DashboardFrame
      eyebrow="Admin dashboard"
      title="Academy overview"
      subtitle="Monitor platform health, growth, and learning outcomes."
      action="Download report"
      onAction={downloadReport}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value="8,492"
          detail="+12.4% from last month"
          icon="users"
          accent
        />
        <StatCard
          label="Course enrollments"
          value="3,840"
          detail="Across 46 live courses"
          icon="book"
        />
        <StatCard label="Completion rate" value="78.2%" detail="+3.1% this quarter" icon="award" />
        <StatCard
          label="Learning hours"
          value="12.8k"
          detail="+840 hours this month"
          icon="clock"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle title="Platform growth" action="Last 6 months" />
          <div className="card p-5 md:p-6">
            <div className="flex flex-wrap gap-6">
              <MetricDot color="#5D866C" label="Active users" value="6,281" />
              <MetricDot color="#C2A68C" label="New enrollments" value="1,240" />
            </div>
            <div className="relative mt-8 h-52 border-b border-l border-[#31533d]/10">
              {[25, 50, 75].map((v) => (
                <div
                  key={v}
                  className="absolute inset-x-0 border-t border-dashed border-[#31533d]/8"
                  style={{ bottom: `${v}%` }}
                />
              ))}
              <div className="absolute inset-0 flex items-end justify-around px-3">
                {[42, 55, 51, 68, 77, 88].map((h, i) => (
                  <div key={i} className="flex h-full flex-1 items-end justify-center gap-1">
                    <div
                      className="w-[22%] min-w-3 rounded-t-md bg-[#5D866C]"
                      style={{ height: `${h}%` }}
                    />
                    <div
                      className="w-[22%] min-w-3 rounded-t-md bg-[#C2A68C]"
                      style={{ height: `${Math.max(20, h - 17)}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-around pl-3 text-[9px] font-bold text-[#8b9890]">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].map((m) => (
                <span key={m}>{m}</span>
              ))}
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
                  background: 'conic-gradient(#5D866C 0 71%, #C2A68C 71% 91%, #E6D8C3 91%)',
                }}
              >
                <div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="font-display text-2xl font-bold text-[#284633]">8,492</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#789083]">
                      Users
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Legend color="#5D866C" label="Learners" value="71%" />
                <Legend color="#C2A68C" label="Instructors" value="20%" />
                <Legend color="#E6D8C3" label="Admins" value="9%" />
              </div>
            </div>
            <button className="mt-7 w-full rounded-xl border border-[#31533d]/12 py-3 text-xs font-bold text-[#5D866C] hover:bg-[#F5F5F0]">
              Manage users
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle title="Top performing courses" action="Full report" />
          <div className="card overflow-hidden">
            <RankRow rank="01" title="Data Foundations" category="Data literacy" score="94%" />
            <RankRow
              rank="02"
              title="Leadership Essentials"
              category="Professional skills"
              score="91%"
            />
            <RankRow rank="03" title="Python for Beginners" category="Programming" score="89%" />
          </div>
        </div>
        <div>
          <SectionTitle title="System status" />
          <div className="card p-5 space-y-4">
            <Status label="Learning platform" />
            <Status label="Video services" />
            <Status label="Assessment engine" />
            <div className="border-t border-[#31533d]/8 pt-4 text-[11px] text-[#789083]">
              Last checked just now
            </div>
          </div>
        </div>
      </div>
    </DashboardFrame>
  )
}

function AdminUsersPage({ supabase }: { supabase: SupabaseClient }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'learner' | 'instructor' | 'admin'>('learner')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const addUser = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

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
        body: JSON.stringify({ fullName, email, password, role }),
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

      setMessage(
        `Account created for ${email.trim()}. Share the temporary password securely; the user must change it after signing in.`,
      )
      setFullName('')
      setEmail('')
      setPassword('')
      setRole('learner')
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Could not create the account.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardFrame
      eyebrow="Admin dashboard"
      title="User management"
      subtitle="Create a learner, instructor, or administrator account."
    >
      <form onSubmit={addUser} className="card max-w-2xl space-y-5 p-6">
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
          <Field label="Temporary password">
            <input
              className="form-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </Field>
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
          <p role="status" className="rounded-lg bg-[#5D866C]/10 p-3 text-xs text-[#31533d]">
            {message}
          </p>
        )}
        <button disabled={saving} className="primary-button disabled:opacity-60">
          {saving ? 'Creating account…' : 'Add user'}
        </button>
      </form>
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
        .select('id, name, level, code')
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
      ? await supabase.from('subjects').update(values).eq('id', editing.id).select('id, name, level, code').single()
      : await supabase.from('subjects').insert({ ...values, instructor_id: userId }).select('id, name, level, code').single()
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject, index) => (
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
            </p>
            <div className="mt-5 flex gap-2 border-t border-[#31533d]/8 pt-4">
              <button onClick={() => openEdit(subject)} className="secondary-button flex-1">
                <Icon name="edit" size={14} /> Edit
              </button>
              <button
                onClick={async () => {
                  const { error: deleteError } = await supabase.from('subjects').delete().eq('id', subject.id)
                  if (deleteError) setError(deleteError.message)
                  else setSubjects(subjects.filter((item) => item.id !== subject.id))
                }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#9b7466]/20 text-[#9b7466] hover:bg-[#9b7466]/10"
                aria-label={`Delete ${subject.name}`}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
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
  const cards =
    role === 'Learner'
      ? initialSubjects.map((subject) => ({
          title: subject.name,
          detail: `${subject.level} · Syllabus ${subject.code}`,
          progress: `${52 + (subject.learners % 40)}%`,
        }))
      : role === 'Instructor'
        ? [
            { title: 'Form 4A', detail: '42 active learners', progress: '86%' },
            { title: 'Lower 6 Science', detail: '31 active learners', progress: '74%' },
            { title: 'Form 3B', detail: '38 active learners', progress: '68%' },
          ]
        : [
            { title: 'Learners', detail: '6,281 active accounts', progress: '74%' },
            { title: 'Teachers', detail: '1,482 verified accounts', progress: '18%' },
            { title: 'School administrators', detail: '729 accounts', progress: '8%' },
          ]
  return (
    <DashboardFrame
      eyebrow={`${role} workspace`}
      title={active}
      subtitle={`Manage your ${active.toLowerCase()} from one place.`}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div className="card p-5" key={card.title}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E6D8C3]/55 text-[#5D866C]">
              <Icon name={role === 'Admin' ? 'users' : 'book'} />
            </span>
            <h2 className="font-display mt-5 font-bold">{card.title}</h2>
            <p className="mt-1 text-xs text-[#789083]">{card.detail}</p>
            <div className="mt-5 h-1.5 rounded-full bg-[#E6D8C3]/55">
              <div className="h-full rounded-full bg-[#5D866C]" style={{ width: card.progress }} />
            </div>
            <p className="mt-2 text-right text-[10px] font-bold text-[#5D866C]">{card.progress}</p>
          </div>
        ))}
      </div>
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
  onRoleChange,
}: {
  supabase: SupabaseClient | null
  onRoleChange: (role: LoginRole) => void
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
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (signUpError) throw signUpError
        setMessage('Account created. Check your email to confirm your address, then sign in.')
        setMode('signin')
      } else {
        onRoleChange(loginRole)
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
        <div className="relative"><Logo /></div>
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#E6D8C3]">Learn. Grow. Achieve.</p>
          <h1 className="font-display mt-5 text-5xl font-extrabold leading-tight">Reaching learning heights.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70">
            One connected space for learners, instructors, and the St Dzikaz Academy community.
          </p>
        </div>
        <p className="relative text-xs text-white/45">© St Dzikaz Academy</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 lg:hidden">
            <LogoMark />
            <span className="font-display text-lg font-bold">St Dzikaz Academy</span>
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
                      onRoleChange(item.value)
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
          <p className="mt-6 text-center text-sm text-[#789083]">
            {mode === 'signin' ? 'New to St Dzikaz Academy?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                const nextMode = mode === 'signin' ? 'signup' : 'signin'
                setMode(nextMode)
                if (nextMode === 'signup') {
                  setLoginRole('learner')
                  onRoleChange('learner')
                }
                setError('')
                setMessage('')
              }}
              className="font-bold text-[#5D866C] hover:underline"
            >
              {mode === 'signin' ? 'Create a learner account' : 'Sign in'}
            </button>
          </p>
          <p className="mt-5 text-center text-[10px] text-[#98a19c]">
            Instructor and administrator accounts are created by academy administrators. Admins can sign in at /admin/.
          </p>
        </div>
      </section>
    </main>
  )
}

function PasswordChangePage({
  supabase,
  onComplete,
}: {
  supabase: SupabaseClient
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
          For your security, choose a new password before continuing to St Dzikaz Academy.
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
      <img
        src="/assets/st_dzikaz_logo.jpg.jpeg"
        alt="St Dzikaz Academy"
        className="h-full w-full object-contain"
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
  onSwitch,
}: {
  open: boolean
  profile: Profile
  onClose: () => void
  onSave: (profile: Profile) => Promise<string | undefined>
  onSwitch: () => void
}) {
  const [draft, setDraft] = useState(profile)
  const [error, setError] = useState('')
  useEffect(() => setDraft(profile), [profile, open])
  if (!open) return null
  const upload = (file?: File) => {
    if (!file) return
    if (file.size > 2_000_000) return
    const reader = new FileReader()
    reader.onload = () => setDraft({ ...draft, image: String(reader.result) })
    reader.readAsDataURL(file)
  }
  return (
    <div className="modal-backdrop">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setError('')
          const saveError = await onSave(draft)
          if (saveError) setError(saveError)
          else onClose()
        }}
        className="modal-card max-w-xl"
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
        <div className="mt-6 flex items-center gap-4">
          <Avatar initials={initials(draft.name)} image={draft.image} />
          <label className="secondary-button">
            <Icon name="camera" size={15} /> Upload photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          <span className="text-[10px] text-[#929d96]">JPG or PNG, up to 2MB</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className="form-input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Sign-in identifier">
            <input
              className="form-input"
              type="text"
              value={draft.email}
              readOnly
            />
          </Field>
          <Field label="School / organisation">
            <input
              className="form-input"
              value={draft.school}
              onChange={(e) => setDraft({ ...draft, school: e.target.value })}
            />
          </Field>
          <Field label="Phone number">
            <input
              className="form-input"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </Field>
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
            <button className="primary-button">Save profile</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const [supabase] = useState(getSupabaseBrowserClient)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [authError, setAuthError] = useState('')
  const expectedLoginRole = useRef<LoginRole | null>(null)
  const [role, setRole] = useState<Role>('Learner')
  const [active, setActive] = useState('Overview')
  const [profileOpen, setProfileOpen] = useState(false)
  const [profiles, setProfiles] = useState<Record<Role, Profile>>(profileDefaults)
  const [notices, setNotices] = useState<Notice[]>(initialNotices)
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [hydrated, setHydrated] = useState(false)

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

      const expectedRole = expectedLoginRole.current
      const loginRoleByDashboardRole: Record<Role, LoginRole> = {
        Learner: 'learner',
        Instructor: 'instructor',
        Admin: 'admin',
      }
      const nextRoleValue = loginRoleByDashboardRole[nextRole]
      if (expectedRole && nextRoleValue !== expectedRole) {
        const roleName = loginRoles.find((item) => item.value === expectedRole)?.label
        setAuthError(`This account is not registered as a ${roleName?.toLowerCase() ?? 'matching'} account.`)
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) setAuthError(`Account type does not match. Sign-out failed: ${signOutError.message}`)
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
      if (data.profiles) setProfiles(data.profiles)
      if (data.notices) setNotices(data.notices)
      if (data.subjects) setSubjects(data.subjects)
    } catch {
      window.localStorage.removeItem('dzikaz-demo')
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(
      'dzikaz-demo',
      JSON.stringify({ profiles, notices, subjects }),
    )
  }, [profiles, notices, subjects, hydrated])

  const logout = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setAuthError(`Could not sign out: ${error.message}`)
  }

  if (authLoading || (authUser && !profileReady)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F5F5F0]">
        <p className="text-sm font-semibold text-[#5D866C]">Connecting to St Dzikaz Academy…</p>
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
          onRoleChange={(nextRole) => {
            expectedLoginRole.current = nextRole
            setAuthError('')
          }}
        />
      </>
    )
  }

  if (requiresPasswordChange) {
    return <PasswordChangePage supabase={supabase} onComplete={() => setRequiresPasswordChange(false)} />
  }

  const renderContent = () => {
    if (role === 'Admin' && active === 'User management')
      return <AdminUsersPage supabase={supabase} />
    if (active === 'Notice board')
      return <NoticeBoard role={role} notices={notices} setNotices={setNotices} userId={authUser.id} supabase={supabase} />
    if (active === 'Calendar')
      return <CalendarPage role={role} userId={authUser.id} supabase={supabase} />
    if (active === 'Messages' && role !== 'Admin')
      return <MessagesPage role={role} userId={authUser.id} supabase={supabase} />
    if (active === 'Marks' || active === 'My marks')
      return <MarksPage role={role} userId={authUser.id} supabase={supabase} />
    if (role === 'Instructor' && active === 'My subjects')
      return <SubjectsPage subjects={subjects} setSubjects={setSubjects} userId={authUser.id} supabase={supabase} />
    if (active !== 'Overview') return <PlaceholderPage role={role} active={active} />
    return role === 'Learner' ? (
      <LearnerDashboard />
    ) : role === 'Instructor' ? (
      <InstructorDashboard />
    ) : (
      <AdminDashboard />
    )
  }
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#284633]">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        profile={profiles[role]}
        onProfile={() => setProfileOpen(true)}
        onLogout={() => void logout()}
      />
      <div className="lg:pl-[250px]">
        <Header
          role={role}
          profile={profiles[role]}
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
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: profile.name.trim(),
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
          setProfiles((current) => ({ ...current, [role]: profile }))
          return undefined
        }}
        onSwitch={() => {
          setProfileOpen(false)
          void logout()
        }}
      />
    </div>
  )
}
