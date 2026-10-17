import { createClient } from '@supabase/supabase-js'
import studentQuotesData from '@/data/student_quotes.json'
import teacherQuotesData from '@/data/teacher_quotes.json'

export type PortalType = 'student' | 'teacher'

export interface DailyQuoteItem {
  id: string
  category: string
  arabic?: string
  text: string
  author: string
  source: string
  type: 'quran' | 'hadith' | 'reminder'
  portal: PortalType
  date: string
}

interface PortalState {
  currentCycle: number
  order: number[]
  assignments: {
    [dateStr: string]: {
      index: number
      quoteIndex: number
      quoteId: string
    }
  }
}

interface DailyQuotesStorageState {
  student: PortalState
  teacher: PortalState
  updatedAt: string
}

// In-memory cache to guarantee instant <1ms response on repeat requests
const inMemoryCache: Record<string, DailyQuoteItem> = {}

// In-flight promise map to prevent race conditions during concurrent cold requests
const inFlightRequests = new Map<string, Promise<DailyQuoteItem>>()

/**
 * Returns today's date formatted as YYYY-MM-DD in the Academy's timezone (Europe/London).
 */
export function getLondonDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generates a non-repeating shuffled array of indices 0..(count - 1)
 */
export function generateShuffledOrder(count: number, seed?: number): number[] {
  const prng = seed !== undefined ? mulberry32(seed) : Math.random
  const array = Array.from({ length: count }, (_, i) => i)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

interface RawQuoteItem {
  id: string
  category: string
  arabic?: string
  text: string
  source: string
  type: string
}

/**
 * Formats a raw quote item into a DailyQuoteItem
 */
function formatQuoteItem(
  raw: RawQuoteItem,
  portal: PortalType,
  dateStr: string
): DailyQuoteItem {
  // Format clean author / attribution display
  let authorDisplay = raw.source || ''
  if (raw.type === 'hadith' && !raw.source.toLowerCase().includes('prophet')) {
    authorDisplay = `Prophet Muhammad (ﷺ) — ${raw.source}`
  } else if (raw.type === 'quran') {
    authorDisplay = `The Holy Quran — ${raw.source}`
  }

  return {
    id: raw.id,
    category: raw.category,
    arabic: raw.arabic,
    text: raw.text,
    source: raw.source,
    author: authorDisplay,
    type: (raw.type as 'quran' | 'hadith' | 'reminder') || 'reminder',
    portal,
    date: dateStr,
  }
}

/**
 * Deterministic fallback calculation if database or network is unreachable.
 * Guaranteed to produce the exact same non-repeating quote for any given date and portal.
 */
function getDeterministicFallbackQuote(
  portal: PortalType,
  dateStr: string
): DailyQuoteItem {
  const collection = portal === 'student' ? studentQuotesData : teacherQuotesData
  const count = collection.length

  // Calculate day difference from epoch
  const [year, month, day] = dateStr.split('-').map(Number)
  const epoch = new Date(Date.UTC(2026, 0, 1))
  const targetDate = new Date(Date.UTC(year, month - 1, day))
  const dayDiff = Math.max(
    0,
    Math.floor((targetDate.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24))
  )

  const cycle = Math.floor(dayDiff / count) + 1
  const cycleIndex = dayDiff % count

  // Deterministic seed distinct per portal and cycle
  const baseSeed = portal === 'student' ? 47291 : 91823
  const cycleSeed = baseSeed + cycle * 7919
  const order = generateShuffledOrder(count, cycleSeed)
  const selectedQuoteIndex = order[cycleIndex]
  const rawQuote = collection[selectedQuoteIndex] || collection[0]

  return formatQuoteItem(rawQuote, portal, dateStr)
}

/**
 * Creates Supabase admin client for storage interaction
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Core resolver for daily quote assignment with persistence in Supabase Storage.
 */
async function resolveDailyQuote(
  portal: PortalType,
  dateStr: string
): Promise<DailyQuoteItem> {
  const collection = portal === 'student' ? studentQuotesData : teacherQuotesData
  const count = collection.length

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return getDeterministicFallbackQuote(portal, dateStr)
  }

  try {
    const STORAGE_BUCKET = 'profiles'
    const STORAGE_PATH = 'system/daily_quotes_state.json'

    // 1. Fetch current persistence state from Supabase Storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_PATH)

    let state: DailyQuotesStorageState = {
      student: {
        currentCycle: 1,
        order: generateShuffledOrder(studentQuotesData.length),
        assignments: {},
      },
      teacher: {
        currentCycle: 1,
        order: generateShuffledOrder(teacherQuotesData.length),
        assignments: {},
      },
      updatedAt: new Date().toISOString(),
    }

    if (blob && !downloadError) {
      try {
        const text = await blob.text()
        const parsed = JSON.parse(text)
        if (parsed.student?.order && parsed.teacher?.order) {
          state = parsed
        }
      } catch {
        console.warn('Could not parse daily_quotes_state.json, reinitializing')
      }
    }

    const portalState = state[portal]
    if (!portalState.assignments) portalState.assignments = {}
    if (!portalState.order || portalState.order.length !== count) {
      portalState.order = generateShuffledOrder(count)
      portalState.currentCycle = 1
      portalState.assignments = {}
    }

    // 2. Check if today's quote is already assigned
    const existingAssignment = portalState.assignments[dateStr]
    if (existingAssignment) {
      const assignedQuote =
        collection[existingAssignment.quoteIndex] ||
        collection.find((q) => q.id === existingAssignment.quoteId) ||
        collection[0]
      return formatQuoteItem(assignedQuote, portal, dateStr)
    }

    // 3. Today needs a new quote assignment
    const assignedCount = Object.keys(portalState.assignments).length

    // If all quotes in this cycle have been used, start a new reshuffled cycle
    if (assignedCount >= count) {
      portalState.currentCycle = (portalState.currentCycle || 1) + 1
      portalState.order = generateShuffledOrder(count)
      portalState.assignments = {}
    }

    const nextIndexInCycle = Object.keys(portalState.assignments).length
    const quoteIndex = portalState.order[nextIndexInCycle]
    const selectedRawQuote = collection[quoteIndex] || collection[0]

    // Save assignment
    portalState.assignments[dateStr] = {
      index: nextIndexInCycle,
      quoteIndex: quoteIndex,
      quoteId: selectedRawQuote.id,
    }

    state.updatedAt = new Date().toISOString()

    // 4. Persist updated state to Supabase Storage asynchronously
    supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH, Buffer.from(JSON.stringify(state, null, 2)), {
        contentType: 'application/json',
        upsert: true,
      })
      .then(({ error: uploadErr }) => {
        if (uploadErr) {
          console.error('Failed to update daily_quotes_state.json in storage:', uploadErr)
        }
      })
      .catch((err) => {
        console.error('Error saving daily_quotes_state.json:', err)
      })

    return formatQuoteItem(selectedRawQuote, portal, dateStr)
  } catch (err) {
    console.error('Storage error resolving daily quote, using fallback:', err)
    return getDeterministicFallbackQuote(portal, dateStr)
  }
}

/**
 * Public accessor for daily quote.
 * Guarantees in-memory caching, concurrency lock, and automatic fallback.
 */
export async function getDailyQuote(
  portal: PortalType,
  dateOverride?: string
): Promise<DailyQuoteItem> {
  const dateStr = dateOverride || getLondonDateString()
  const cacheKey = `${portal}:${dateStr}`

  // 1. Instant memory cache check
  if (inMemoryCache[cacheKey]) {
    return inMemoryCache[cacheKey]
  }

  // 2. In-flight promise check to deduplicate simultaneous requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!
  }

  // 3. Resolve and cache
  const requestPromise = resolveDailyQuote(portal, dateStr)
    .then((result) => {
      inMemoryCache[cacheKey] = result
      return result
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey)
    })

  inFlightRequests.set(cacheKey, requestPromise)
  return requestPromise
}
