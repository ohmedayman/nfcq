import React, { useState } from 'react'
import { toast } from './Toast'

/**
 * Universal safe copy-to-clipboard with fallback support
 */
export async function copyToClipboard(text) {
  if (!text) return false
  let copied = false

  // Modern async clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      copied = false
    }
  }

  // Fallback for older browsers, iframe sandbox, or automated test headless runners
  if (!copied) {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      textarea.style.opacity = '0'
      textarea.setAttribute('readonly', '')
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      copied = document.execCommand('copy')
      document.body.removeChild(textarea)
    } catch {
      copied = false
    }
  }

  return copied
}

/**
 * Reusable CopyButton with instant confirmed visual state & toast
 */
export function CopyButton({
  textToCopy = 'LAMSA',
  label = '📋 نسخ الكوبون',
  copiedLabel = '✅ تم النسخ!',
  toastMessage = '',
  className = '',
  style = {},
  duration = 2600,
  children,
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e) {
    if (e && e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
    await copyToClipboard(textToCopy)
    setCopied(true)
    const msg = toastMessage || `تم نسخ (${textToCopy}) بنجاح! ✓`
    toast(msg)
    setTimeout(() => setCopied(false), duration)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`copy-btn-action ${copied ? 'is-copied' : ''} ${className}`}
      style={style}
      aria-live="polite"
      title={copied ? 'تم النسخ' : 'انقر للنسخ'}
    >
      {copied ? copiedLabel : (children || label)}
    </button>
  )
}

/**
 * Reusable Clickable Coupon Code Pill
 */
export function CouponCodeBadge({
  code = 'LAMSA',
  toastMessage = '',
  className = '',
  duration = 2600,
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e) {
    if (e && e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
    await copyToClipboard(code)
    setCopied(true)
    const msg = toastMessage || `تم نسخ كود الخصم (${code}) وتطبيقه تلقائياً! ✓`
    toast(msg)
    setTimeout(() => setCopied(false), duration)
  }

  return (
    <code
      onClick={handleCopy}
      className={`coupon-code-pill ${copied ? 'is-copied' : ''} ${className}`}
      aria-live="polite"
      title="انقر لنسخ الكود"
    >
      {copied ? `✅ ${code}` : code}
    </code>
  )
}
