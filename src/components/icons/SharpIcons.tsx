import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

interface FolderIconProps extends IconProps {
  open?: boolean
}

/**
 * Sharp, minimalistic solid folder icon (closed & open)
 */
export function SharpFolderIcon({
  open = false,
  size = 14,
  className = ''
}: FolderIconProps): React.JSX.Element {
  if (open) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="currentColor"
        className={`shrink-0 ${className}`}
        aria-hidden="true"
      >
        <path
          d="M1.75 2.5A.75.75 0 0 0 1 3.25v2.25h14V5.5a.75.75 0 0 0-.75-.75H7.72l-1.61-1.84A.75.75 0 0 0 5.55 2.5H1.75z"
          opacity="0.55"
        />
        <path d="M1.2 6.5A.75.75 0 0 0 .47 7.39l1.2 6.5A.75.75 0 0 0 2.41 14.5h11.18a.75.75 0 0 0 .74-.61l1.2-6.5a.75.75 0 0 0-.74-.89H1.2z" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M1.75 2.5A.75.75 0 0 0 1 3.25v9.5c0 .414.336.75.75.75h12.5A.75.75 0 0 0 15 12.75V5.5a.75.75 0 0 0-.75-.75H7.72l-1.61-1.84A.75.75 0 0 0 5.55 2.5H1.75z" />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid document / page icon with crisp dog-ear flap
 */
export function SharpDocumentIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 1.75A.75.75 0 0 1 3.75 1h5.69a.75.75 0 0 1 .53.22l3.81 3.81c.14.14.22.33.22.53v8.69a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75V1.75zm6.5.75v3.25a.5.5 0 0 0 .5.5h3.25L9.5 2.5z"
      />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid eye icon with pupil cutout
 */
export function SharpEyeIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 3.5c-3.8 0-6.7 3.2-7.5 4.5.8 1.3 3.7 4.5 7.5 4.5s6.7-3.2 7.5-4.5c-.8-1.3-3.7-4.5-7.5-4.5zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
      />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid crescent moon
 */
export function SharpMoonIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M6.15 1.5A6.5 6.5 0 1 0 14.5 9.85a.75.75 0 0 0-.82-.82 5 5 0 0 1-6.71-6.71.75.75 0 0 0-.82-.82z" />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid sun with precision rays
 */
export function SharpSunIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3.5" />
      <path d="M8 1a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 1zm0 11.5a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75zm6.25-5.25a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1 0-1.5h1zM3.25 7.25a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1 0-1.5h1zm9.17-3.83a.75.75 0 0 1 0 1.06l-.71.71a.75.75 0 1 1-1.06-1.06l.71-.71a.75.75 0 0 1 1.06 0zm-8.48 8.48a.75.75 0 0 1 0 1.06l-.71.71a.75.75 0 0 1-1.06-1.06l.71-.71a.75.75 0 0 1 1.06 0zm0-9.54a.75.75 0 0 1 1.06 0l.71.71a.75.75 0 0 1-1.06 1.06l-.71-.71a.75.75 0 0 1 0-1.06zm8.48 8.48a.75.75 0 0 1 1.06 0l.71.71a.75.75 0 0 1-1.06 1.06l-.71-.71a.75.75 0 0 1 0-1.06z" />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid notification bell
 */
export function SharpBellIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M8 1.5a2 2 0 0 0-2 2v.34C4.26 4.4 3 6.04 3 8v3.5l-1.2 1.2A.5.5 0 0 0 2.15 13.5h11.7a.5.5 0 0 0 .35-.85L13 11.5V8c0-1.96-1.26-3.6-3-4.16V3.5a2 2 0 0 0-2-2zm-1.5 13a1.5 1.5 0 0 0 3 0h-3z" />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid help badge with negative-space question mark
 */
export function SharpHelpIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM6.5 5.5a1.5 1.5 0 0 1 2.8-.75c.18.36.08.76-.17 1.01L8.35 6.55A1.25 1.25 0 0 0 7.75 7.5v.5h1.5v-.38c0-.28.11-.55.31-.75l.84-.84a2.75 2.75 0 0 0-3.9-3.78 2.75 2.75 0 0 0-1.5 2.25H6.5zm1.5 5a.875.875 0 1 0 0 1.75.875.875 0 0 0 0-1.75z"
      />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid gear / settings icon with 8 teeth and center cutout
 */
export function SharpSettingsIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
      />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid home icon
 */
export function SharpHomeIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M8 2.25L1.75 7.2v6.8c0 .28.22.5.5.5h4.25v-4h3v4h4.25c.28 0 .5-.22.5-.5V7.2L8 2.25z" />
    </svg>
  )
}

/**
 * Sharp, minimalistic graph / network icon with interconnected nodes
 */
export function SharpGraphIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <line x1="4.5" y1="5.5" x2="11.5" y2="4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="4.5" y1="5.5" x2="8" y2="12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="11.5" y1="4.5" x2="8" y2="12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="4.5" cy="5.5" r="2.1" />
      <circle cx="11.5" cy="4.5" r="2.1" />
      <circle cx="8" cy="12" r="2.3" />
    </svg>
  )
}

/**
 * Sharp, minimalistic solid search / magnifying glass icon
 */
export function SharpSearchIcon({
  size = 14,
  className = ''
}: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04z"
      />
    </svg>
  )
}

