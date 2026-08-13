/**
 * normalizeUrl — Smart URL normalizer for Lamsa platform
 * Handles:
 *  - Missing https:// prefix
 *  - Bare usernames for social platforms
 *  - WhatsApp phone numbers
 *  - Mailto and tel: links
 */

/**
 * Normalize a social media URL or handle.
 * @param {'instagram'|'linkedin'|'twitter'|'whatsapp'} platform
 * @param {string} value - URL or username/handle
 * @returns {string} Full URL
 */
export function normalizeSocialUrl(platform, value) {
  if (!value || !value.trim()) return ''
  const v = value.trim()

  // Already a full URL
  if (/^https?:\/\//i.test(v)) return v

  const bases = {
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/in/',
    twitter: 'https://x.com/',
    whatsapp: 'https://wa.me/',
  }

  // WhatsApp: accept phone numbers
  if (platform === 'whatsapp') {
    const digits = v.replace(/[^0-9+]/g, '')
    if (digits) return `https://wa.me/${digits.replace(/^\+/, '')}`
    return v
  }

  // Strip @ if present (e.g. @username)
  const handle = v.replace(/^@/, '')

  // If it looks like a URL without protocol
  if (handle.includes('.') && !handle.includes(' ')) {
    return `https://${handle}`
  }

  // Bare username
  if (bases[platform]) {
    return `${bases[platform]}${handle}`
  }

  return `https://${v}`
}

/**
 * Normalize any user-entered link URL.
 * Adds https:// if missing, handles mailto: and tel: gracefully.
 * @param {string} url
 * @returns {string}
 */
export function normalizeUrl(url) {
  if (!url || !url.trim()) return '#'
  const v = url.trim()

  // Already has protocol
  if (/^(https?|mailto|tel|sms|ftp):\/?\/?/i.test(v)) return v

  // Phone-like (starts with +)
  if (/^\+\d/.test(v)) return `tel:${v}`

  // Email-like
  if (v.includes('@') && !v.includes(' ') && v.includes('.')) return `mailto:${v}`

  // Add https://
  return `https://${v}`
}

/**
 * Validate a file before upload.
 * @param {File} file
 * @param {{ maxSizeMB?: number, allowedTypes?: string[] }} opts
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, opts = {}) {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = opts

  if (!file) return { valid: false, error: 'no_file' }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'invalid_type' }
  }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: 'too_large' }
  }

  return { valid: true }
}
