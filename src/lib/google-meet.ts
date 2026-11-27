import { google } from 'googleapis'

function getCleanPrivateKey(rawKey?: string): string | null {
  if (!rawKey) return null
  let cleaned = rawKey.trim()
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    try {
      cleaned = JSON.parse(cleaned)
    } catch {}
  }
  return cleaned.replace(/\\n/g, '\n')
}

export interface CreateMeetRoomParams {
  teacherEmail: string
  studentEmail?: string
  studentName?: string
  summary?: string
  description?: string
  startTime?: Date
  endTime?: Date
}

export interface CreateMeetRoomResult {
  success: boolean
  meetLink?: string
  eventId?: string
  error?: string
}

export async function createGoogleMeetRoom(params: CreateMeetRoomParams): Promise<CreateMeetRoomResult> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = getCleanPrivateKey(process.env.GOOGLE_PRIVATE_KEY)
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL || 'academy@alihsan.co.uk'

  if (!serviceAccountEmail || !privateKey) {
    console.warn('[Google Meet API] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY.')
    return {
      success: false,
      error: 'Google Meet credentials are not fully configured in environment variables.',
    }
  }

  const {
    teacherEmail,
    studentEmail,
    studentName,
    summary = studentName ? `Class: ${studentName} - Al-Ihsan Academy` : 'Moral Class - Al-Ihsan Academy',
    description = 'Online interactive lesson conducted via Al-Ihsan Academy LMS.',
    startTime = new Date(Date.now() + 5 * 60 * 1000), // Default 5 mins from now
    endTime = new Date(Date.now() + 50 * 60 * 1000),  // Default 45 mins session
  } = params

  // Determine impersonation target: prefer teacher email if it's an @alihsan domain, otherwise admin email
  const targetSubject = teacherEmail && (teacherEmail.endsWith('@alihsan.co.uk') || teacherEmail.endsWith('@alihsan.academy'))
    ? teacherEmail.trim().toLowerCase()
    : adminEmail

  try {
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/meetings.space.created',
      ],
      subject: targetSubject,
    })

    const calendar = google.calendar({ version: 'v3', auth })

    const attendeesList = studentEmail
      ? [
          {
            email: studentEmail.trim().toLowerCase(),
            displayName: studentName || 'Student',
            responseStatus: 'accepted',
          },
        ]
      : undefined

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary,
        description,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees: attendeesList,
        guestsCanSeeOtherGuests: true,
        guestsCanInviteOthers: false,
        conferenceData: {
          createRequest: {
            requestId: `lms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    })

    const meetLink =
      response.data.conferenceData?.entryPoints?.[0]?.uri ||
      response.data.hangoutLink ||
      undefined

    if (!meetLink) {
      throw new Error('Google Calendar event created but no Google Meet link was returned.')
    }

    return {
      success: true,
      meetLink,
      eventId: response.data.id || undefined,
    }
  } catch (err: any) {
    console.error('[Google Meet API] Error generating Meet link:', err?.message || err)
    
    // If impersonating specific teacher failed, attempt fallback to organization admin email
    if (targetSubject !== adminEmail) {
      console.warn('[Google Meet API] Retrying with organization admin email fallback...')
      try {
        const fallbackAuth = new google.auth.JWT({
          email: serviceAccountEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/calendar'],
          subject: adminEmail,
        })
        const fallbackCal = google.calendar({ version: 'v3', auth: fallbackAuth })
        const res = await fallbackCal.events.insert({
          calendarId: 'primary',
          conferenceDataVersion: 1,
          requestBody: {
            summary,
            description,
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            conferenceData: {
              createRequest: {
                requestId: `lms-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          },
        })
        const fallbackLink = res.data.conferenceData?.entryPoints?.[0]?.uri || res.data.hangoutLink
        if (fallbackLink) {
          return { success: true, meetLink: fallbackLink, eventId: res.data.id || undefined }
        }
      } catch (fallbackErr: any) {
        console.error('[Google Meet API Fallback Error]:', fallbackErr?.message || fallbackErr)
      }
    }

    return {
      success: false,
      error: err?.message || 'Failed to auto-generate Google Meet link.',
    }
  }
}

export interface MeetSessionDetails {
  durationMinutes: number | null
  recordingUrl: string | null
}

/**
 * Queries Google Meet API v2 to retrieve actual meeting duration in minutes
 * and any generated Google Drive recording URL for the given Meet link.
 */
export async function getGoogleMeetSessionDetails(
  meetLink?: string | null,
  teacherEmail?: string | null
): Promise<MeetSessionDetails> {
  if (!meetLink) return { durationMinutes: null, recordingUrl: null }

  const match = meetLink.match(/meet\.google\.com\/([a-z0-9-]+)/i)
  const meetingCode = match ? match[1].toLowerCase().replace(/[^a-z]/g, '') : null
  if (!meetingCode) return { durationMinutes: null, recordingUrl: null }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = getCleanPrivateKey(process.env.GOOGLE_PRIVATE_KEY)
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL || 'academy@alihsan.co.uk'

  if (!serviceAccountEmail || !privateKey) return { durationMinutes: null, recordingUrl: null }

  const targetSubject =
    teacherEmail && (teacherEmail.endsWith('@alihsan.co.uk') || teacherEmail.endsWith('@alihsan.academy'))
      ? teacherEmail.trim().toLowerCase()
      : adminEmail

  const attemptFetch = async (subject: string): Promise<MeetSessionDetails | null> => {
    try {
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/meetings.space.readonly',
          'https://www.googleapis.com/auth/meetings.space.created',
        ],
        subject,
      })

      const meet = google.meet({ version: 'v2', auth })
      const confRes = await meet.conferenceRecords.list({ pageSize: 25 })
      const records = confRes.data.conferenceRecords || []

      for (const rec of records) {
        if (!rec.space || !rec.startTime || !rec.endTime) continue
        try {
          const spaceRes = await meet.spaces.get({ name: rec.space })
          const spaceCode = spaceRes.data.meetingCode ? spaceRes.data.meetingCode.replace(/[^a-z]/g, '') : ''
          if (spaceCode === meetingCode) {
            const start = new Date(rec.startTime).getTime()
            const end = new Date(rec.endTime).getTime()
            const durationMinutes = Math.max(1, Math.round((end - start) / 60000))

            let recordingUrl: string | null = null
            if (rec.name) {
              try {
                const recRes = await meet.conferenceRecords.recordings.list({ parent: rec.name })
                const recordings = recRes.data.recordings || []
                for (const r of recordings) {
                  if (r.driveDestination?.exportUri) {
                    recordingUrl = r.driveDestination.exportUri
                    break
                  }
                }
              } catch {
                // Recording may not be available or scope not enabled yet
              }
            }

            return { durationMinutes, recordingUrl }
          }
        } catch {
          // Check next conference record
        }
      }
    } catch (err) {
      console.warn(`[Google Meet API] Error querying conference records for ${subject}:`, err)
    }
    return null
  }

  const details = await attemptFetch(targetSubject)
  if (details !== null) return details

  if (targetSubject !== adminEmail) {
    const fallbackDetails = await attemptFetch(adminEmail)
    if (fallbackDetails !== null) return fallbackDetails
  }

  return { durationMinutes: null, recordingUrl: null }
}

/**
 * Queries Google Meet API v2 to retrieve actual meeting duration in minutes
 * by matching conference records for the given Google Meet link or meeting code.
 */
export async function getGoogleMeetActualDuration(
  meetLink?: string | null,
  teacherEmail?: string | null
): Promise<number | null> {
  const details = await getGoogleMeetSessionDetails(meetLink, teacherEmail)
  return details.durationMinutes
}

