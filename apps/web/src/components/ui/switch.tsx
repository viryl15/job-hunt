'use client'

import * as React from 'react'

export interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
}

export function Switch({ 
  checked = false, 
  onCheckedChange, 
  disabled = false, 
  id,
  className = '' 
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      id={id}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 
        border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed 
        disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-gray-200'} ${className}
      `}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white 
          shadow ring-0 transition duration-200 ease-in-out 
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}