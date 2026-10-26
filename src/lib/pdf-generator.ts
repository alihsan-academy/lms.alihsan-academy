import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AL_IHSAN_LOGO_BASE64 } from './logo-base64'
import { formatUKDateTime, ParsedClassRecord, AttendanceSummary } from './attendance-utils'
import { format } from 'date-fns'

interface StudentPDFProps {
  student: {
    name: string
    registration_number?: string
    class_name?: string
    enrolment_status?: string
    teacher_name?: string
  }
  periodLabel: string
  summary: AttendanceSummary
}

interface TeacherPDFProps {
  teacher: {
    name: string
    email?: string
    total_students?: number
  }
  periodLabel: string
  summaryStats: {
    totalStudents: number
    totalScheduled: number
    totalAttended: number
    totalNotAttended: number
    totalTeacherUnavailable: number
    totalStudentUnavailable: number
    overallPercentage: number
  }
  studentsData: Array<{
    registration_number: string
    name: string
    enrolment_status: string
    scheduled: number
    attended: number
    notAttended: number
    remarks: string
    percentage: number
  }>
}

export function generateStudentAttendancePDF({
  student,
  periodLabel,
  summary,
}: StudentPDFProps) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const now = new Date()
  const createdDate = format(now, 'dd MMMM yyyy, hh:mm a')

  // Top decorative bar
  doc.setFillColor(16, 120, 70) // Islamic Green primary
  doc.rect(0, 0, pageWidth, 5, 'F')

  // Logo
  try {
    doc.addImage(AL_IHSAN_LOGO_BASE64, 'PNG', 14, 10, 28, 21)
  } catch (e) {
    console.error('Error adding logo to PDF:', e)
  }

  // Header texts
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(16, 120, 70)
  doc.text('AL IHSAN ACADEMY', 46, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('ACADEMY OF MORAL EDUCATION', 46, 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  doc.text('STUDENT ATTENDANCE REPORT', 46, 30)

  // Report metadata (Right aligned)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated on: ${createdDate}`, pageWidth - 14, 18, { align: 'right' })
  doc.text(`Report Period: ${periodLabel}`, pageWidth - 14, 23, { align: 'right' })
  doc.text(`System Timezone: UK (GMT/BST)`, pageWidth - 14, 28, { align: 'right' })

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(14, 35, pageWidth - 14, 35)

  // Student Details Box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 38, pageWidth - 28, 24, 2, 2, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, 38, pageWidth - 28, 24, 2, 2, 'D')

  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)

  // Col 1
  doc.setFont('helvetica', 'bold')
  doc.text('Student Name:', 18, 45)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(student.name || 'N/A', 43, 45)

  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('Reg Number:', 18, 54)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 120, 70)
  doc.text(student.registration_number || 'N/A', 43, 54)

  // Col 2
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('Assigned Teacher:', 85, 45)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(student.teacher_name || 'Assigned Educator', 115, 45)

  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('Class/Batch:', 85, 54)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(student.class_name || 'Standard Batch', 115, 54)

  // Col 3
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('Enrolment Status:', 150, 45)
  doc.setFont('helvetica', 'bold')
  const statusStr = (student.enrolment_status || 'ongoing').toUpperCase()
  doc.setTextColor(statusStr === 'ONGOING' ? 16 : 220, statusStr === 'ONGOING' ? 120 : 38, statusStr === 'ONGOING' ? 70 : 38)
  doc.text(statusStr, 180, 45)

  // Summary Metrics Badges
  const boxY = 66
  const boxWidth = (pageWidth - 28 - 12) / 4
  const boxHeight = 16

  const renderKpiBox = (label: string, value: string | number, x: number, color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text(label.toUpperCase(), x + boxWidth / 2, boxY + 5.5, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(String(value), x + boxWidth / 2, boxY + 12.5, { align: 'center' })
  }

  renderKpiBox('Total Scheduled', summary.totalScheduled, 14, [71, 85, 105])
  renderKpiBox('Classes Attended', summary.attendedCount, 14 + boxWidth + 4, [16, 120, 70])
  renderKpiBox('Not Attended / Absent', summary.notAttendedCount, 14 + (boxWidth + 4) * 2, [220, 38, 38])
  renderKpiBox('Attendance Rate', `${summary.attendanceRate}%`, 14 + (boxWidth + 4) * 3, [37, 99, 235])

  // Sub-breakdown line (Teacher Unavailable, Student Unavailable, Break)
  let subTextY = boxY + boxHeight + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(
    `Breakdown:  Teacher Unavailable: ${summary.teacherUnavailableCount}  |  Student Unavailable: ${summary.studentUnavailableCount}  |  On Break: ${summary.breakCount}  |  Upcoming Scheduled: ${summary.scheduledUpcomingCount}`,
    14,
    subTextY
  )

  if (summary.isOnBreak && summary.breakDetails) {
    subTextY += 5
    doc.setTextColor(194, 65, 12) // Amber
    doc.text(
      `* Student Break Notice: ${summary.breakDetails.from} to ${summary.breakDetails.to} (${summary.breakDetails.reason})`,
      14,
      subTextY
    )
  }

  // Attendance Records Table
  const tableData = summary.filteredClasses.map((c, index) => {
    let statusText = c.statusLabel
    return [
      index + 1,
      formatUKDateTime(c.scheduled_at),
      c.title || 'Live Class',
      c.teacher_name || student.teacher_name || 'Teacher',
      statusText,
      c.remarks || (c.recording_url ? 'Recording Attached' : '-'),
      c.recording_url ? 'Available' : 'None',
    ]
  })

  autoTable(doc, {
    startY: subTextY + 4,
    head: [['#', 'Date & Time (UK)', 'Class / Subject', 'Teacher', 'Status', 'Remarks / Reason', 'Recording']],
    body: tableData.length > 0 ? tableData : [['-', 'No classes found in selected period', '-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [16, 120, 70],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 36 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28, fontStyle: 'bold' },
      5: { cellWidth: 38 },
      6: { cellWidth: 16, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw).toLowerCase()
        if (text.includes('attended') || text.includes('present')) {
          data.cell.styles.textColor = [16, 120, 70]
        } else if (text.includes('unavailable') || text.includes('absent') || text.includes('missed')) {
          data.cell.styles.textColor = [220, 38, 38]
        } else if (text.includes('break')) {
          data.cell.styles.textColor = [217, 119, 6]
        } else {
          data.cell.styles.textColor = [37, 99, 235]
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  })

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth - 14, doc.internal.pageSize.getHeight() - 12)
    doc.text('Al-Ihsan Academy | Official Attendance Transcript | Confidential', 14, doc.internal.pageSize.getHeight() - 7)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 7, { align: 'right' })
  }

  // Trigger download
  const sanitizedName = (student.name || 'student').replace(/[^a-zA-Z0-9]/g, '_')
  const fileName = `Al_Ihsan_Attendance_${sanitizedName}_${format(now, 'yyyyMMdd')}.pdf`
  doc.save(fileName)
}

export function generateTeacherAttendancePDF({
  teacher,
  periodLabel,
  summaryStats,
  studentsData,
}: TeacherPDFProps) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const now = new Date()
  const createdDate = format(now, 'dd MMMM yyyy, hh:mm a')

  // Top decorative bar
  doc.setFillColor(16, 120, 70)
  doc.rect(0, 0, pageWidth, 5, 'F')

  // Logo
  try {
    doc.addImage(AL_IHSAN_LOGO_BASE64, 'PNG', 14, 10, 28, 21)
  } catch (e) {
    console.error('Error adding logo to PDF:', e)
  }

  // Header texts
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(16, 120, 70)
  doc.text('AL IHSAN ACADEMY', 46, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('ACADEMY OF MORAL EDUCATION', 46, 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  doc.text("TEACHER'S STUDENTS ATTENDANCE SUMMARY", 46, 30)

  // Report metadata (Right aligned)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated on: ${createdDate}`, pageWidth - 14, 18, { align: 'right' })
  doc.text(`Report Period: ${periodLabel}`, pageWidth - 14, 23, { align: 'right' })
  doc.text(`System Timezone: UK (GMT/BST)`, pageWidth - 14, 28, { align: 'right' })

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(14, 35, pageWidth - 14, 35)

  // Teacher Details Box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 38, pageWidth - 28, 18, 2, 2, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, 38, pageWidth - 28, 18, 2, 2, 'D')

  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)

  // Col 1
  doc.setFont('helvetica', 'bold')
  doc.text('Teacher Name:', 18, 47)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(teacher.name || 'Educator', 45, 47)

  // Col 2
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('Teacher Email:', 95, 47)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(teacher.email || 'N/A', 120, 47)

  // Col 3
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('Assigned Students:', 160, 47)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 120, 70)
  doc.text(String(summaryStats.totalStudents), 195, 47)

  // Summary Metrics Badges
  const boxY = 60
  const boxWidth = (pageWidth - 28 - 12) / 4
  const boxHeight = 16

  const renderKpiBox = (label: string, value: string | number, x: number, color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text(label.toUpperCase(), x + boxWidth / 2, boxY + 5.5, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(String(value), x + boxWidth / 2, boxY + 12.5, { align: 'center' })
  }

  renderKpiBox('Total Scheduled', summaryStats.totalScheduled, 14, [71, 85, 105])
  renderKpiBox('Completed / Attended', summaryStats.totalAttended, 14 + boxWidth + 4, [16, 120, 70])
  renderKpiBox('Not Attended / Absent', summaryStats.totalNotAttended, 14 + (boxWidth + 4) * 2, [220, 38, 38])
  renderKpiBox('Average Attendance', `${summaryStats.overallPercentage}%`, 14 + (boxWidth + 4) * 3, [37, 99, 235])

  // Sub-breakdown line
  const subTextY = boxY + boxHeight + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(
    `Breakdown:  Teacher Unavailable: ${summaryStats.totalTeacherUnavailable}  |  Student Unavailable: ${summaryStats.totalStudentUnavailable}`,
    14,
    subTextY
  )

  // Students Breakdown Table
  const tableData = studentsData.map((s, index) => [
    index + 1,
    s.registration_number || 'N/A',
    s.name,
    s.enrolment_status.toUpperCase(),
    s.scheduled,
    s.attended,
    s.notAttended,
    s.remarks || '-',
    `${s.percentage}%`,
  ])

  autoTable(doc, {
    startY: subTextY + 4,
    head: [['#', 'Reg No', 'Student Name', 'Status', 'Scheduled', 'Attended', 'Not Attended', 'Remarks / Issues', 'Rate']],
    body: tableData.length > 0 ? tableData : [['-', '-', 'No students found', '-', '0', '0', '0', '-', '0%']],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [16, 120, 70],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center', textColor: [16, 120, 70] },
      6: { cellWidth: 20, halign: 'center', textColor: [220, 38, 38] },
      7: { cellWidth: 24 },
      8: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  })

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth - 14, doc.internal.pageSize.getHeight() - 12)
    doc.text('Al-Ihsan Academy | Official Educator Summary Report | Confidential', 14, doc.internal.pageSize.getHeight() - 7)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 7, { align: 'right' })
  }

  // Trigger download
  const sanitizedTeacherName = (teacher.name || 'teacher').replace(/[^a-zA-Z0-9]/g, '_')
  const fileName = `Al_Ihsan_TeacherSummary_${sanitizedTeacherName}_${format(now, 'yyyyMMdd')}.pdf`
  doc.save(fileName)
}

// ─── Smart Filter PDF ──────────────────────────────────────────────────────────

interface IntelligenceFilterPDFProps {
  periodLabel: string
  filterSummary: string
  totalMatched: number
  studentsData: Array<{
    name: string
    registration_number?: string
    teacher_name?: string
    enrolment_status?: string
    attended: number
    studentAbsent: number
    teacherMissed: number
    onBreak: number
    rate: number
  }>
}

export function generateIntelligenceFilterPDF({
  periodLabel,
  filterSummary,
  totalMatched,
  studentsData,
}: IntelligenceFilterPDFProps) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const now = new Date()
  const createdDate = format(now, 'dd MMMM yyyy, hh:mm a')

  // Top decorative bar (amber — Smart Filter brand colour)
  doc.setFillColor(217, 119, 6)
  doc.rect(0, 0, pageWidth, 5, 'F')

  // Logo
  try {
    doc.addImage(AL_IHSAN_LOGO_BASE64, 'PNG', 14, 10, 24, 18)
  } catch (e) {
    console.error('Error adding logo to PDF:', e)
  }

  // Header texts
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(16, 120, 70)
  doc.text('AL IHSAN ACADEMY', 42, 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('ACADEMY OF MORAL EDUCATION', 42, 22)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text('STUDENT ATTENDANCE — SMART FILTER REPORT', 42, 28)

  // Right-side metadata
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated: ${createdDate}`, pageWidth - 14, 17, { align: 'right' })
  doc.text(`Period: ${periodLabel}`, pageWidth - 14, 22, { align: 'right' })
  doc.text(`Matched: ${totalMatched} student${totalMatched !== 1 ? 's' : ''}`, pageWidth - 14, 27, { align: 'right' })

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(14, 32, pageWidth - 14, 32)

  // Active filters subtitle bar
  doc.setFillColor(255, 251, 235)
  doc.roundedRect(14, 34, pageWidth - 28, 10, 2, 2, 'F')
  doc.setDrawColor(253, 230, 138)
  doc.roundedRect(14, 34, pageWidth - 28, 10, 2, 2, 'D')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(146, 64, 14)
  doc.text('ACTIVE FILTERS:', 18, 40)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(92, 36, 6)
  const filterText = filterSummary || 'No specific filters applied — showing all students'
  doc.text(filterText, 50, 40)

  // Build table rows
  const tableData = studentsData.map((s, index) => [
    index + 1,
    s.registration_number || 'N/A',
    s.name,
    s.teacher_name || '—',
    (s.enrolment_status || 'ongoing').toUpperCase(),
    s.attended,
    s.studentAbsent,
    s.teacherMissed,
    s.onBreak,
    `${s.rate}%`,
  ])

  // Totals + average row
  const totals = studentsData.reduce(
    (acc, s) => ({
      attended: acc.attended + s.attended,
      studentAbsent: acc.studentAbsent + s.studentAbsent,
      teacherMissed: acc.teacherMissed + s.teacherMissed,
      onBreak: acc.onBreak + s.onBreak,
    }),
    { attended: 0, studentAbsent: 0, teacherMissed: 0, onBreak: 0 }
  )
  const avgRate =
    studentsData.length > 0
      ? Math.round(studentsData.reduce((acc, s) => acc + s.rate, 0) / studentsData.length)
      : 0

  const bodyRows =
    tableData.length > 0
      ? [
          ...tableData,
          ['', '', 'TOTALS / AVERAGE', '', '', totals.attended, totals.studentAbsent, totals.teacherMissed, totals.onBreak, `${avgRate}%`],
        ]
      : [['-', '-', 'No matching students', '-', '-', '0', '0', '0', '0', '0%']]

  autoTable(doc, {
    startY: 47,
    head: [['#', 'Reg No', 'Student Name', 'Teacher', 'Status', 'Attended', 'Stu. Absent', 'Tchr. Missed', 'On Break', 'Rate %']],
    body: bodyRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [255, 251, 235],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 42 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 22, halign: 'center', textColor: [16, 120, 70], fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'center', textColor: [234, 88, 12] },
      7: { cellWidth: 22, halign: 'center', textColor: [220, 38, 38] },
      8: { cellWidth: 22, halign: 'center', textColor: [161, 98, 7] },
      9: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Bold amber background for totals row
      if (data.section === 'body' && data.row.index === studentsData.length) {
        data.cell.styles.fillColor = [254, 243, 199]
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = [120, 53, 15]
      }
      // Colour-code rate % column
      if (data.section === 'body' && data.column.index === 9 && data.row.index < studentsData.length) {
        const rate = studentsData[data.row.index]?.rate ?? 0
        data.cell.styles.textColor = rate >= 80 ? [16, 120, 70] : rate >= 50 ? [161, 98, 7] : [220, 38, 38]
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  })

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth - 14, doc.internal.pageSize.getHeight() - 12)
    doc.text('Al-Ihsan Academy | Smart Filter Attendance Report | Confidential', 14, doc.internal.pageSize.getHeight() - 7)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 7, { align: 'right' })
  }

  const fileName = `Al_Ihsan_SmartFilter_${format(now, 'yyyyMMdd_HHmm')}.pdf`
  doc.save(fileName)
}
