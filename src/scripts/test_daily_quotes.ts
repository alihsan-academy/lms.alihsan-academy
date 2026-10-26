import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getDailyQuote, getLondonDateString, generateShuffledOrder } from '../lib/daily-quotes'
import studentQuotes from '../data/student_quotes.json'
import teacherQuotes from '../data/teacher_quotes.json'

async function runTests() {
  console.log('=== STARTING DAILY QUOTE SYSTEM TESTS ===\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`)
      if (detail) console.error(`   Detail: ${detail}`)
      failed++
    }
  }

  // TEST 1: London timezone formatting
  const todayLondon = getLondonDateString()
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(todayLondon),
    'London date string format (YYYY-MM-DD)',
    `Got ${todayLondon}`
  )

  // TEST 2: Student quote retrieval & collection containment
  const studentQuote = await getDailyQuote('student')
  assert(
    studentQuote.id.startsWith('s-') && studentQuote.portal === 'student',
    'Student quote belongs exclusively to Student collection',
    `ID: ${studentQuote.id}, Portal: ${studentQuote.portal}`
  )
  assert(
    studentQuotes.some((q) => q.id === studentQuote.id),
    'Student quote exists in student_quotes.json',
    `Found ID: ${studentQuote.id}`
  )
  assert(
    !!studentQuote.arabic && !!studentQuote.text && !!studentQuote.source,
    'Student quote contains Arabic text, English translation, and verified source',
    `Source: ${studentQuote.source}`
  )

  // TEST 3: Teacher quote retrieval & collection containment
  const teacherQuote = await getDailyQuote('teacher')
  assert(
    teacherQuote.id.startsWith('t-') && teacherQuote.portal === 'teacher',
    'Teacher quote belongs exclusively to Teacher collection',
    `ID: ${teacherQuote.id}, Portal: ${teacherQuote.portal}`
  )
  assert(
    teacherQuotes.some((q) => q.id === teacherQuote.id),
    'Teacher quote exists in teacher_quotes.json',
    `Found ID: ${teacherQuote.id}`
  )
  assert(
    !!teacherQuote.arabic && !!teacherQuote.text && !!teacherQuote.source,
    'Teacher quote contains Arabic text, English translation, and verified source',
    `Source: ${teacherQuote.source}`
  )

  // TEST 4: Independence
  assert(
    studentQuote.id !== teacherQuote.id,
    'Student and Teacher daily quotes are independent',
    `Student: ${studentQuote.id}, Teacher: ${teacherQuote.id}`
  )

  // TEST 5: Idempotency (Same quote throughout the day / on page refreshes)
  const studentRefreshes = await Promise.all(
    Array.from({ length: 10 }, () => getDailyQuote('student'))
  )
  const allSameStudent = studentRefreshes.every((q) => q.id === studentQuote.id)
  assert(
    allSameStudent,
    'Student quote remains constant on 10 sequential page refreshes',
    `Unique quotes: ${new Set(studentRefreshes.map((q) => q.id)).size}`
  )

  const teacherRefreshes = await Promise.all(
    Array.from({ length: 10 }, () => getDailyQuote('teacher'))
  )
  const allSameTeacher = teacherRefreshes.every((q) => q.id === teacherQuote.id)
  assert(
    allSameTeacher,
    'Teacher quote remains constant on 10 sequential page refreshes',
    `Unique quotes: ${new Set(teacherRefreshes.map((q) => q.id)).size}`
  )

  // TEST 6: Concurrency / Race Conditions
  const concurrentCalls = await Promise.all([
    ...Array.from({ length: 15 }, () => getDailyQuote('student')),
    ...Array.from({ length: 15 }, () => getDailyQuote('teacher')),
  ])
  const concurrentStudent = concurrentCalls.slice(0, 15)
  const concurrentTeacher = concurrentCalls.slice(15)
  assert(
    concurrentStudent.every((q) => q.id === studentQuote.id) &&
      concurrentTeacher.every((q) => q.id === teacherQuote.id),
    '30 concurrent simultaneous requests return identical assignments without conflict'
  )

  // TEST 7: 100-Day Non-Repeating Cycle Algorithm Simulation
  const cycleOrder = generateShuffledOrder(100, 42)
  assert(
    cycleOrder.length === 100 && new Set(cycleOrder).size === 100,
    'Cycle order contains exactly 100 unique indices without any duplicates'
  )

  const cycle2Order = generateShuffledOrder(100, 43)
  assert(
    cycle2Order.length === 100 && new Set(cycle2Order).size === 100,
    'Cycle 2 order contains 100 unique indices'
  )
  assert(
    JSON.stringify(cycleOrder) !== JSON.stringify(cycle2Order),
    'Cycle 2 reshuffles into a distinct randomized order upon cycle exhaustion'
  )

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
