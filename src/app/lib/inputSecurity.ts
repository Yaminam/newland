import { z } from 'zod'

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const SCRIPT_DELIMITERS = /[<>]/g
const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/

type TextOptions = {
  maxLength?: number
  multiline?: boolean
  allowEmpty?: boolean
  /** Human-readable field name surfaced in error messages (e.g. "First name"). */
  fieldName?: string
}

export function sanitizeText(input: string, options: TextOptions = {}) {
  const { maxLength = 5000, multiline = false, allowEmpty = true, fieldName } = options
  let value = (input ?? '')
    .replace(CONTROL_CHARS, '')
    .replace(SCRIPT_DELIMITERS, '')

  value = multiline
    ? value.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
    : value.replace(/\s+/g, ' ').trim()

  if (value.length > maxLength) {
    throw new Error(`${fieldName ?? 'Input'} exceeds maximum length of ${maxLength}`)
  }

  if (!allowEmpty && value.length === 0) {
    throw new Error(`${fieldName ?? 'Input'} is required`)
  }

  return value
}

export function sanitizeOptionalText(input: string | null | undefined, options: TextOptions = {}) {
  if (!input) return ''
  return sanitizeText(input, options)
}

export function sanitizeUrl(input: string | null | undefined) {
  let value = sanitizeOptionalText(input, { maxLength: 2048 })
  if (!value) return ''

  // Auto-prepend https:// if user entered a bare domain (e.g. "example.com")
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed')
  }

  return parsed.toString()
}

export function sanitizeStringArray(values: string[], options: TextOptions = {}) {
  return values.map(value => sanitizeText(value, { maxLength: 100, ...options }))
}

export function parseOptionalNumber(input: string | number | null | undefined) {
  if (input === null || input === undefined || input === '') return null
  const asNumber = typeof input === 'number' ? input : Number(String(input).replace(/,/g, '').trim())
  if (!Number.isFinite(asNumber)) {
    throw new Error('Invalid number')
  }
  return asNumber
}

export function parseOptionalInteger(input: string | number | null | undefined) {
  const parsed = parseOptionalNumber(input)
  if (parsed === null) return null
  if (!Number.isInteger(parsed)) {
    throw new Error('Invalid integer')
  }
  return parsed
}

export function sanitizeOptionalDate(input: string | null | undefined) {
  const value = sanitizeOptionalText(input, { maxLength: 32 })
  if (!value) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Invalid date')
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (Number.isNaN(timestamp)) {
    throw new Error('Invalid date')
  }
  return value
}

export function validateFileName(fileName: string) {
  const normalized = fileName.replace(/\s+/g, '_')
  if (!SAFE_FILENAME.test(normalized)) {
    throw new Error('File name contains unsupported characters')
  }
  return normalized
}

type FileValidationOptions = {
  maxBytes: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
}

export function validateUploadedFile(file: File, options: FileValidationOptions) {
  if (!file) throw new Error('Missing file')
  if (file.size <= 0) throw new Error('Empty files are not allowed')
  if (file.size > options.maxBytes) {
    throw new Error(`File exceeds ${Math.ceil(options.maxBytes / 1024 / 1024)} MB limit`)
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!options.allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }

  if (!options.allowedMimeTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  validateFileName(file.name)
}

// Known magic-byte signatures for file types the app accepts.
// An attacker can spoof File.type and file extension by renaming files;
// reading the actual first bytes prevents that class of bypass.
const MAGIC_BYTES: Record<string, (bytes: Uint8Array) => boolean> = {
  jpg:  b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  jpeg: b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  png:  b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47,
  gif:  b => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  webp: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
          && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  pdf:  b => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
}

/**
 * Async variant of validateUploadedFile that also reads the first 12 bytes
 * and cross-checks them against known magic-byte signatures. Call this after
 * validateUploadedFile for uploads that are stored or processed server-side.
 */
export async function validateFileSignature(file: File): Promise<void> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const checker = MAGIC_BYTES[ext]
  if (!checker) return  // No signature rule for this extension — skip

  const slice = file.slice(0, 12)
  const buffer = await slice.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (!checker(bytes)) {
    throw new Error(`File content does not match the expected ${ext.toUpperCase()} format`)
  }
}

export const aiChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000).transform(value => sanitizeText(value, { maxLength: 2000, multiline: true, allowEmpty: false })),
  mode: z.enum(['market-intel', 'fundraising']),
  session_id: z.string().trim().max(200).optional(),
}).strict()

export const securityEventSchema = z.object({
  type: z.string().trim().min(1).max(80).transform(value => sanitizeText(value, { maxLength: 80, allowEmpty: false })),
  outcome: z.string().trim().max(80).optional().transform(value => sanitizeOptionalText(value, { maxLength: 80 })),
  email: z.string().trim().max(320).optional().transform(value => sanitizeOptionalText(value, { maxLength: 320 })),
  userId: z.string().trim().max(128).optional().transform(value => sanitizeOptionalText(value, { maxLength: 128 })),
  route: z.string().trim().max(256).optional().transform(value => sanitizeOptionalText(value, { maxLength: 256 })),
  message: z.string().trim().max(500).optional().transform(value => sanitizeOptionalText(value, { maxLength: 500, multiline: true })),
  statusCode: z.number().int().min(100).max(599).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().trim().max(64).optional().transform(value => sanitizeOptionalText(value, { maxLength: 64 })),
}).strict()

export const cspReportSchema = z.object({
  'csp-report': z.object({
    'document-uri': z.string().trim().max(2048).optional().transform(value => sanitizeOptionalText(value, { maxLength: 2048 })),
    'violated-directive': z.string().trim().max(256).optional().transform(value => sanitizeOptionalText(value, { maxLength: 256 })),
    'blocked-uri': z.string().trim().max(2048).optional().transform(value => sanitizeOptionalText(value, { maxLength: 2048 })),
    'original-policy': z.string().trim().max(4000).optional().transform(value => sanitizeOptionalText(value, { maxLength: 4000 })),
    disposition: z.string().trim().max(128).optional().transform(value => sanitizeOptionalText(value, { maxLength: 128 })),
  }).strict(),
}).strict()
