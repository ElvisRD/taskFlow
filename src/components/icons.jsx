const BASE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
}

const SOLID_BASE = {
  fill: 'currentColor',
  viewBox: '0 0 20 20',
  'aria-hidden': 'true',
}

export function IconLogo({ className = 'h-4 w-4' }) {
  return (
    <svg {...SOLID_BASE} className={className}>
      <path d="M4 3.75A.75.75 0 0 1 4.75 3h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 4 3.75Z" />
      <path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-4V4a1 1 0 0 0-1-1H4Zm10 6.5v4.25a.75.75 0 0 1-1.5 0V9.5H14Z" />
    </svg>
  )
}

export function IconLogoSimple({ className = 'h-5 w-5' }) {
  return (
    <svg {...SOLID_BASE} className={className}>
      <path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-4V4a1 1 0 0 0-1-1H4Z" />
    </svg>
  )
}

export function IconChat({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      <path d="M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  )
}

export function IconPaperclip({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
    </svg>
  )
}

export function IconCalendar({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

export function IconPlus({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

export function IconTrash({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

export function IconPencil({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
    </svg>
  )
}

export function IconCheck({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

export function IconX({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

export function IconClose({ className = 'h-5 w-5' }) {
  return (
    <svg {...SOLID_BASE} className={className}>
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  )
}

export function IconDownload({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

export function IconDots({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

export function IconArrowLeft({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}

export function IconChevronDown({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

export function IconChevronLeft({ className = 'h-4 w-4' }) {
  return (
    <svg {...SOLID_BASE} className={className}>
      <path d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" />
    </svg>
  )
}

export function IconLogout({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  )
}

export function IconSun({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  )
}

export function IconMoon({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  )
}

export function IconMonitor({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
    </svg>
  )
}

export function IconUsers({ className = 'h-4 w-4' }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

export function IconUser({ className = 'h-4 w-4' }) {
  return (
    <svg {...SOLID_BASE} className={className}>
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6.5 8a6.5 6.5 0 1 1 13 0 .75.75 0 0 1-.75.75h-11.5A.75.75 0 0 1 3.5 16Z" />
    </svg>
  )
}

export function IconBoard({ className = 'h-4 w-4' }) {
  return (
    <svg {...SOLID_BASE} className={className}>
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h4A1.5 1.5 0 0 1 10 4.5v11A1.5 1.5 0 0 1 8.5 17h-4A1.5 1.5 0 0 1 3 15.5v-11Zm9 0A1.5 1.5 0 0 1 13.5 3h2A1.5 1.5 0 0 1 17 4.5v6A1.5 1.5 0 0 1 15.5 12h-2A1.5 1.5 0 0 1 12 10.5v-6Z" />
    </svg>
  )
}

export function IconSpinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  )
}
