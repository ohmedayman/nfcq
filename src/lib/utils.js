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
    youtube: 'https://youtube.com/@',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/@',
    telegram: 'https://t.me/',
    snapchat: 'https://snapchat.com/add/',
    spotify: 'https://open.spotify.com/user/',
    discord: 'https://discord.gg/',
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

export function detectPlatformInfo(url, fallbackLabel = '') {
  if (!url) return { id: 'website', icon: 'globe', color: '#6366f1', label: fallbackLabel || 'Website' }
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return { id: 'youtube', icon: 'youtube', color: '#FF0000', label: 'YouTube' }
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return { id: 'facebook', icon: 'facebook', color: '#1877F2', label: 'Facebook' }
  if (u.includes('tiktok.com')) return { id: 'tiktok', icon: 'tiktok', color: '#000000', label: 'TikTok' }
  if (u.includes('t.me') || u.includes('telegram.me') || u.includes('telegram')) return { id: 'telegram', icon: 'telegram', color: '#229ED9', label: 'Telegram' }
  if (u.includes('wa.me') || u.includes('whatsapp.com')) return { id: 'whatsapp', icon: 'whatsapp', color: '#25D366', label: 'WhatsApp' }
  if (u.includes('instagram.com')) return { id: 'instagram', icon: 'instagram', color: '#E4405F', label: 'Instagram' }
  if (u.includes('linkedin.com')) return { id: 'linkedin', icon: 'linkedin', color: '#0A66C2', label: 'LinkedIn' }
  if (u.includes('twitter.com') || u.includes('x.com')) return { id: 'twitter', icon: 'twitter', color: '#000000', label: 'X' }
  if (u.includes('snapchat.com')) return { id: 'snapchat', icon: 'snapchat', color: '#FFFC00', label: 'Snapchat' }
  if (u.includes('spotify.com')) return { id: 'spotify', icon: 'spotify', color: '#1DB954', label: 'Spotify' }
  if (u.includes('discord.gg') || u.includes('discord.com')) return { id: 'discord', icon: 'discord', color: '#5865F2', label: 'Discord' }
  if (u.includes('github.com')) return { id: 'github', icon: 'github', color: '#181717', label: 'GitHub' }
  if (u.includes('book') || u.includes('kitab')) return { id: 'book', icon: 'book', color: '#d97706', label: 'Book' }
  if (u.includes('store') || u.includes('shop') || u.includes('buy') || u.includes('souq') || u.includes('noon') || u.includes('amazon')) return { id: 'store', icon: 'store', color: '#f59e0b', label: 'Store' }
  if (u.includes('tel:') || u.includes('phone')) return { id: 'phone', icon: 'phone', color: '#10b981', label: 'Phone' }
  if (u.includes('mailto:') || u.includes('email')) return { id: 'email', icon: 'email', color: '#3b82f6', label: 'Email' }
  if (u.includes('maps') || u.includes('location')) return { id: 'location', icon: 'location', color: '#ef4444', label: 'Location' }
  return { id: 'website', icon: 'globe', color: '#6366f1', label: fallbackLabel || 'Website' }
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

/**
 * Compress an image file in the browser using HTML5 Canvas.
 * Returns a clean, high-quality Data URL (base64).
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality
 * @returns {Promise<string>}
 */
export async function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

/**
 * Available Card Themes
 */
export const CARD_THEMES = [
  {
    id: 'default',
    nameAr: 'أزرق ملكي كلاسيكي',
    nameEn: 'Classic Cobalt',
    previewGrad: 'linear-gradient(135deg, #1854e8, #0aa5c8)',
    accent: '#1854e8',
  },
  {
    id: 'midnight-gold',
    nameAr: 'أسود وذهب ملكي',
    nameEn: 'Midnight Gold',
    previewGrad: 'linear-gradient(135deg, #1a1a24, #d4af37)',
    accent: '#d4af37',
  },
  {
    id: 'cyber-neon',
    nameAr: 'سايبر نيون',
    nameEn: 'Cyber Neon',
    previewGrad: 'linear-gradient(135deg, #0f172a, #06b6d4, #a855f7)',
    accent: '#06b6d4',
  },
  {
    id: 'rose-gold',
    nameAr: 'روز جولد أنثوي',
    nameEn: 'Rose Gold',
    previewGrad: 'linear-gradient(135deg, #f43f5e, #fb7185, #fde047)',
    accent: '#f43f5e',
  },
  {
    id: 'emerald-vip',
    nameAr: 'الزمرد الفاخر',
    nameEn: 'Emerald VIP',
    previewGrad: 'linear-gradient(135deg, #064e3b, #10b981, #34d399)',
    accent: '#10b981',
  },
  {
    id: 'sunset-aura',
    nameAr: 'شفق الغروب',
    nameEn: 'Sunset Aura',
    previewGrad: 'linear-gradient(135deg, #ea580c, #f43f5e, #8b5cf6)',
    accent: '#ea580c',
  },
  {
    id: 'matte-dark',
    nameAr: 'أسود مطفي حديث',
    nameEn: 'Matte Stealth',
    previewGrad: 'linear-gradient(135deg, #09090b, #27272a)',
    accent: '#ffffff',
  },
  {
    id: 'ice-frost',
    nameAr: 'أبيض جليدي نقي',
    nameEn: 'Ice Frost',
    previewGrad: 'linear-gradient(135deg, #e0f2fe, #38bdf8, #818cf8)',
    accent: '#0284c7',
  },
]
