# Instructor Portal System - Complete Guide

## Overview

The **Instructor Portal** is the central hub for teachers and professors to manage all aspects of their courses and students. It provides four integrated tabs for **Attendance**, **Lesson Plans**, **Gradebook**, and **Transcripts**, with role-based access and compliance record-keeping.

## Portal Architecture

### Access Control

**Who can access:**
- Teachers (instructors)
- Administrative staff
- Department heads (with view-only access)

**URL:** `https://academy.rosstaxprepandbookkeeping.com/instructor`

### Four Main Tabs

```
┌─────────────────────────────────────────────────┐
│         INSTRUCTOR PORTAL DASHBOARD              │
├─────────────────────────────────────────────────┤
│                                                   │
│  [Attendance]  [Lesson Plans]  [Gradebook] [Transcripts]  │
│                                                   │
│  ┌──────────────────────────────────────────┐  │
│  │ Select Course:  [Dropdown ▼]              │  │
│  │ • Tax 1101 (28 students)                 │  │
│  │ • Accounting 2201 (32 students)          │  │
│  │ • Audit 5501 (18 students)               │  │
│  └──────────────────────────────────────────┘  │
│                                                   │
│  Pending Tasks:  [5 Unread] [12 Ungraded] [3 Draft Plans]  │
└─────────────────────────────────────────────────┘
```

## Dashboard Features

### Main Dashboard (`GET /api/instructor/dashboard`)

Returns teacher summary with pending tasks:

**Response:**
```json
{
  "instructorId": "teacher-001",
  "instructorName": "Dr. Sarah Chen",
  "instructorEmail": "prof.sarah.chen@rosstaxprepandbookkeeping.com",
  "assignedCourses": [
    {
      "classScheduleId": "class-101",
      "courseName": "Tax 1101: Fundamentals",
      "enrolledStudents": 28,
      "status": "active"
    },
    {
      "classScheduleId": "class-201",
      "courseName": "Accounting 2201: Advanced",
      "enrolledStudents": 32,
      "status": "active"
    }
  ],
  "pendingTasks": {
    "unreadNotifications": 5,
    "pendingGradebook": 12,
    "draftLessonPlans": 3
  },
  "lastLogin": "2025-02-03T14:30:00Z",
  "availableTabs": ["attendance", "lesson-plans", "gradebook", "transcripts"]
}
```

### Upcoming Tasks (`GET /api/instructor/upcoming`)

View assignments due soon and lesson plans needing publication:

**Response:**
```json
{
  "dueAssignments": [
    {
      "id": "asgn-001",
      "assignmentName": "Module 1 Quiz",
      "dueDate": "2025-02-05",
      "courseName": "Tax 1101",
      "gradedCount": 15,
      "totalStudents": 28
    }
  ],
  "lessonPlansDue": [
    {
      "id": "lp-001",
      "courseName": "Tax 1101",
      "weekNumber": 2,
      "startDate": "2025-02-10",
      "status": "draft"
    }
  ],
  "upcomingEventCount": 4
}
```

## TAB 1: ATTENDANCE TRACKING

### Overview

Real-time attendance management with automatic session recording and compliance reporting.

### Features

- **Session-based tracking**: Automatically captures attendance for each class meeting
- **Multiple statuses**: Present, Absent, Late, Excused, Pending
- **Auto-check-in**: Records student login to session
- **Bulk import**: Load attendance from roster
- **Attendance reports**: Class-wide and individual student summaries
- **Warnings**: Flag students below 85% attendance threshold

### Endpoints

#### Record Attendance

**POST** `/api/attendance/record`
```json
{
  "enrollmentId": "student-001",
  "classScheduleId": "class-101",
  "sessionDate": "2025-02-03",
  "status": "present",
  "checkInTime": "2025-02-03T14:00:00Z",
  "checkOutTime": "2025-02-03T15:30:00Z",
  "notes": "On time, engaged in discussion"
}
```

**Response:**
```json
{
  "id": "att-001",
  "enrollmentId": "student-001",
  "status": "present",
  "recordedAt": "2025-02-03T15:35:00Z"
}
```

#### Bulk Record Attendance

**POST** `/api/attendance/bulk`
```json
{
  "classScheduleId": "class-101",
  "sessionDate": "2025-02-03",
  "records": [
    { "enrollmentId": "student-001", "status": "present" },
    { "enrollmentId": "student-002", "status": "absent", "notes": "Sick leave" },
    { "enrollmentId": "student-003", "status": "late", "checkInTime": "14:15:00" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "recordsCreated": 3,
  "recordIds": ["att-001", "att-002", "att-003"]
}
```

#### View Class Attendance

**GET** `/api/instructor/attendance/:classScheduleId`

**Response:**
```json
{
  "classScheduleId": "class-101",
  "courseName": "Tax 1101",
  "attendanceRecords": [...],
  "statistics": {
    "totalStudents": 28,
    "presentCount": 25,
    "absentCount": 2,
    "lateCount": 1,
    "excusedCount": 0,
    "averageAttendance": 89.3
  }
}
```

#### Get Student Attendance Report

**GET** `/api/attendance/report/:enrollmentId`

**Response:**
```json
{
  "enrollmentId": "student-001",
  "studentName": "Jane Smith",
  "courseName": "Tax 1101",
  "totalSessions": 14,
  "presentCount": 13,
  "absentCount": 1,
  "lateCount": 0,
  "excusedCount": 0,
  "attendancePercentage": 92.9,
  "status": "good",
  "lastUpdated": "2025-02-03T15:35:00Z"
}
```

#### Attendance Warnings

**GET** `/api/attendance/warning`

Returns students below 85% attendance for intervention:

**Response:**
```json
[
  {
    "studentId": "student-045",
    "firstName": "Michael",
    "lastName": "Johnson",
    "studentEmail": "michael.johnson@rosstaxprepandbookkeeping.com",
    "totalSessions": 12,
    "presentCount": 9,
    "attendancePercentage": 75.0
  }
]
```

### Attendance Portal UI

```
TAB: ATTENDANCE
┌──────────────────────────────────┐
│ Course: Tax 1101 (Class-101)     │
│                                  │
│ Record Session:                  │
│ Date: [2025-02-03 ▼]            │
│ [Record Attendance] [Import CSV] │
│                                  │
│ Class Statistics:                │
│ ├─ Average Attendance: 89.3%    │
│ ├─ Present: 25 | Absent: 2      │
│ └─ Late: 1 | Excused: 0         │
│                                  │
│ Attendance Warnings (3):          │
│ ├─ Michael Johnson - 75.0%       │
│ ├─ Sarah Williams - 79.5%        │
│ └─ Robert Brown - 81.0%          │
│                                  │
│ [Download Report] [Email Warnings] │
└──────────────────────────────────┘
```

## TAB 2: LESSON PLANS

### Overview

Weekly lesson plan creation, management, and publishing system that guides course delivery and ensures consistency.

### Features

- **Weekly structure**: Plans organized by week number
- **Component templates**: Objectives, topics, readings, assignments
- **Status workflow**: Draft → Published → Archived
- **Publish control**: Determines student visibility
- **Copy templates**: Reuse plans across semesters
- **Integrated with schedule**: Links to class sessions and assignments

### Endpoints

#### Create Lesson Plan

**POST** `/api/lesson-plans`
```json
{
  "classScheduleId": "class-101",
  "courseName": "Tax 1101",
  "weekNumber": 2,
  "startDate": "2025-02-10",
  "endDate": "2025-02-16",
  "title": "Introduction to Individual Tax Returns",
  "objectives": [
    "Understand form 1040 structure",
    "Calculate tax liability",
    "Identify filing requirements"
  ],
  "topics": [
    "Form 1040 overview",
    "Income sources",
    "Deductions and credits"
  ],
  "lectureOutline": "1. Review prior week (10 min)\n2. Form 1040 walkthrough (30 min)\n...",
  "assignments": [
    {
      "name": "Practice 1040 problems",
      "description": "Complete 5 sample returns",
      "dueDate": "2025-02-14",
      "pointsValue": 50
    }
  ],
  "readings": [
    "Chapter 2: Individual Returns",
    "IRS Publication 17"
  ],
  "assessments": "Quiz covering Form 1040 sections"
}
```

**Response:**
```json
{
  "id": "lp-001",
  "courseName": "Tax 1101",
  "weekNumber": 2,
  "title": "Introduction to Individual Tax Returns",
  "status": "draft"
}
```

#### Publish Lesson Plan

**PATCH** `/api/lesson-plans/:planId/publish`

Changes status from `draft` to `published` (students can see it).

**Response:**
```json
{
  "success": true,
  "planId": "lp-001",
  "status": "published"
}
```

#### View Course Lesson Plans

**GET** `/api/instructor/lesson-plans/:classScheduleId`

**Response:**
```json
{
  "classScheduleId": "class-101",
  "lessonPlans": [
    {
      "id": "lp-001",
      "weekNumber": 1,
      "startDate": "2025-02-03",
      "endDate": "2025-02-09",
      "title": "Course Overview",
      "status": "published"
    },
    {
      "id": "lp-002",
      "weekNumber": 2,
      "startDate": "2025-02-10",
      "endDate": "2025-02-16",
      "title": "Form 1040 Fundamentals",
      "status": "draft"
    }
  ],
  "totalPlans": 2
}
```

#### Copy Lesson Plan

**POST** `/api/lesson-plans/:planId/copy`

Duplicate a plan for another week.

```json
{
  "newWeekNumber": 3,
  "newStartDate": "2025-02-17",
  "newEndDate": "2025-02-23"
}
```

### Lesson Plan Portal UI

```
TAB: LESSON PLANS
┌────────────────────────────────────────┐
│ Course: Tax 1101                        │
│ [+ Create New] [Import Schedule] [Sync] │
│                                         │
│ Week 1 (Feb 3-9): Course Overview       │
│ Status: [Published ✓]                   │
│ Topics: 3 | Readings: 2 | Assignments: 1│
│ [View] [Edit] [Archive]                │
│                                         │
│ Week 2 (Feb 10-16): Form 1040 Basics    │
│ Status: [Draft ●] [Publish]            │
│ Topics: 4 | Readings: 3 | Assignments: 2│
│ [View] [Edit] [Publish] [Copy] [Delete]│
│                                         │
│ Week 3 (Feb 17-23): Deductions & Credits│
│ Status: [Draft ●]                       │
│ [Create...] [Duplicate Week 2]         │
└────────────────────────────────────────┘
```

## TAB 3: GRADEBOOK

### Overview

Comprehensive grading system with weighted calculations, feedback, and performance analytics.

### Features

- **Assignment management**: Create assignments with max points and weight percentages
- **Grade entry**: Input scores with automatic percentage calculation
- **Letter grades**: A-F conversion with GPA calculation
- **Weighted calculation**: Category-based grading (homework 30%, exams 50%, etc.)
- **Feedback**: Instructor comments per assignment
- **Class statistics**: Performance analytics and grade distribution
- **Grade override**: Ability to adjust grades with audit trail

### Endpoints

#### Create Assignment

**POST** `/api/gradebook/assignment`
```json
{
  "classScheduleId": "class-101",
  "courseName": "Tax 1101",
  "assignmentName": "Module 1 Quiz",
  "description": "20-question multiple choice on Form 1040",
  "assignmentType": "quiz",
  "maxScore": 100,
  "weight": 15,
  "dueDate": "2025-02-07"
}
```

**Response:**
```json
{
  "assignmentId": "asgn-001",
  "assignmentName": "Module 1 Quiz",
  "maxScore": 100,
  "weight": 15
}
```

#### Post Grade

**POST** `/api/gradebook/grade`
```json
{
  "enrollmentId": "student-001",
  "assignmentId": "asgn-001",
  "score": 92,
  "feedback": "Excellent work! Strong understanding of deduction rules."
}
```

**Response:**
```json
{
  "gradeId": "grd-001",
  "enrollmentId": "student-001",
  "score": 92,
  "letterGrade": "A",
  "percentage": 92.0,
  "feedback": "Excellent work..."
}
```

#### View Class Gradebook

**GET** `/api/instructor/gradebook/:classScheduleId`

**Response:**
```json
{
  "classScheduleId": "class-101",
  "students": [
    {
      "enrollmentId": "student-001",
      "studentName": "Jane Smith",
      "email": "jane.smith@rosstaxprepandbookkeeping.com",
      "grades": {
        "asgn-001": { "score": 92, "percentage": 92.0, "letterGrade": "A" },
        "asgn-002": { "score": 88, "percentage": 88.0, "letterGrade": "B" }
      }
    }
  ],
  "assignments": [
    {
      "id": "asgn-001",
      "assignmentName": "Module 1 Quiz",
      "maxScore": 100,
      "weight": 15,
      "dueDate": "2025-02-07"
    }
  ]
}
```

#### Get Grade Summary

**GET** `/api/gradebook/summary/:enrollmentId`

**Response:**
```json
{
  "enrollmentId": "student-001",
  "studentName": "Jane Smith",
  "courseName": "Tax 1101",
  "currentGPA": 3.8,
  "totalPoints": 185,
  "maxPoints": 200,
  "percentageGrade": 92.5,
  "letterGrade": "A",
  "gradeBreakdown": [
    { "assignmentType": "quiz", "weight": 15, "weightedGrade": 93.0 },
    { "assignmentType": "homework", "weight": 30, "weightedGrade": 91.5 },
    { "assignmentType": "exam", "weight": 50, "weightedGrade": 93.2 },
    { "assignmentType": "participation", "weight": 5, "weightedGrade": 95.0 }
  ]
}
```

#### Get Class Statistics

**GET** `/api/gradebook/statistics/:classScheduleId`

**Response:**
```json
[
  {
    "assignmentName": "Module 1 Quiz",
    "gradedCount": 28,
    "avgPercentage": 85.6,
    "minPercentage": 62.0,
    "maxPercentage": 98.0,
    "stdDev": 8.3
  }
]
```

### Gradebook Portal UI

```
TAB: GRADEBOOK
┌──────────────────────────────────────────────┐
│ Course: Tax 1101 | Class: 101                │
│                                              │
│ [+ New Assignment] [Import] [Export] [Stats] │
│                                              │
│ Assignments:                                 │
│ Quiz (weight 15%)          [Due: 2/7] [28/28] │
│ Homework (weight 30%)      [Due: 2/14] [18/28] │
│ Midterm Exam (weight 50%)  [Due: 2/21] [8/28]  │
│                                              │
│ GRADEBOOK GRID:                             │
│ Student         │ Quiz │ Homework │ Midterm │ │
│ ────────────────┼──────┼──────────┼─────────┤ │
│ Jane Smith      │ A 92 │ A 95     │ Pending │ │
│ Michael Johnson │ B 87 │ C 72     │ Pending │ │
│ Sarah Williams  │ A 94 │ A 93     │ Pending │ │
│                                              │
│ [Download CSV] [Send Reminders] [Print]    │
└──────────────────────────────────────────────┘
```

## TAB 4: TRANSCRIPTS

### Overview

Academic record management with official and unofficial transcript generation for compliance.

### Features

- **Unofficial transcripts**: Self-service, instant generation for students
- **Official transcripts**: Sealed records requiring admin approval
- **GPA calculation**: Automatic 4.0 scale calculation
- **Compliance**: FERPA-compliant audit trail
- **Export options**: PDF and text formats
- **Institutional records**: Permanent academic history

### Endpoints

#### View Student Transcripts

**GET** `/api/instructor/transcripts/:classScheduleId`

**Response:**
```json
{
  "classScheduleId": "class-101",
  "students": [
    {
      "enrollmentId": "student-001",
      "firstName": "Jane",
      "lastName": "Smith",
      "studentEmail": "jane.smith@rosstaxprepandbookkeeping.com",
      "currentGPA": 3.8,
      "completedAssignments": 18
    }
  ],
  "totalStudents": 28
}
```

#### Get Student Transcript Detail

**GET** `/api/instructor/transcripts/detail/:transcriptId`

**Response:**
```json
{
  "studentName": "Jane Smith",
  "studentEmail": "jane.smith@rosstaxprepandbookkeeping.com",
  "cumulativeGPA": 3.8,
  "courses": [
    {
      "courseName": "Tax 1101",
      "grade": "A",
      "gpa": 4.0,
      "credits": 3,
      "completionDate": "2/28/2025"
    }
  ],
  "transcriptType": "unofficial",
  "sealed": false
}
```

### Transcript Portal UI

```
TAB: TRANSCRIPTS
┌────────────────────────────────────────────┐
│ Course: Tax 1101 (28 students)             │
│ [Generate Official] [Export All] [Statistics]│
│                                            │
│ Student             │ GPA │ Status        │
│ ───────────────────┼─────┼──────────────┤
│ Jane Smith          │ 3.8 │ In Progress   │
│ Michael Johnson     │ 3.2 │ In Progress   │
│ Sarah Williams      │ 3.9 │ In Progress   │
│ Robert Brown        │ 2.8 │ In Progress   │
│                                            │
│ [View Individual]  [Request Official]     │
└────────────────────────────────────────────┘
```

## Student Roster

### Get Full Roster

**GET** `/api/instructor/roster/:classScheduleId`

Complete student enrollment list with attendance:

**Response:**
```json
{
  "classScheduleId": "class-101",
  "roster": [
    {
      "enrollmentId": "student-001",
      "firstName": "Jane",
      "lastName": "Smith",
      "studentEmail": "jane.smith@rosstaxprepandbookkeeping.com",
      "enrollmentDate": "2025-01-15",
      "status": "active",
      "sessionsAttended": 12,
      "presentCount": 12
    }
  ],
  "totalStudents": 28
}
```

## Notifications

### Mark Notifications as Read

**POST** `/api/instructor/notifications/mark-read`
```json
{
  "notificationIds": ["notif-001", "notif-002", "notif-003"]
}
```

## Database Schema

### Key Tables

**assignments**
```sql
CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  class_schedule_id TEXT,
  course_name TEXT,
  assignment_name TEXT,
  assignment_type TEXT,
  max_score REAL,
  weight REAL,
  due_date DATETIME,
  created_at DATETIME
);
```

**grades**
```sql
CREATE TABLE grades (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT,
  assignment_id TEXT,
  score REAL,
  percentage REAL,
  letter_grade TEXT,
  feedback TEXT,
  graded_by TEXT,
  graded_at DATETIME,
  UNIQUE(enrollment_id, assignment_id)
);
```

**attendance_records**
```sql
CREATE TABLE attendance_records (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT,
  class_schedule_id TEXT,
  session_date DATE,
  status TEXT,
  check_in_time DATETIME,
  check_out_time DATETIME,
  recorded_at DATETIME,
  UNIQUE(enrollment_id, class_schedule_id, session_date)
);
```

**lesson_plans**
```sql
CREATE TABLE lesson_plans (
  id TEXT PRIMARY KEY,
  class_schedule_id TEXT,
  week_number INTEGER,
  title TEXT,
  status TEXT,
  created_by TEXT,
  updated_at DATETIME,
  UNIQUE(class_schedule_id, week_number)
);
```

## Compliance Features

### FERPA Compliance

- ✅ Student names encrypted in audit logs (optional)
- ✅ Access control by enrollment relationship
- ✅ Complete audit trail of grade changes
- ✅ Soft-delete (deactivation) maintains historical records
- ✅ 7-year retention policy enforced

### Data Privacy

- Grades stored separately from PII
- Access via enrollment_id relationship
- Student email addresses not logged in grade records
- Transcript requests tracked with approval workflow

## Implementation Checklist

- [ ] Database schema deployed (schema/compliance-schema.sql)
- [ ] Routes integrated into src/index.ts
- [ ] MailChannels API key configured
- [ ] Attendance tracking tested with sample data
- [ ] Gradebook weighted calculations validated
- [ ] Lesson plan publishing workflow tested
- [ ] Transcript generation tested
- [ ] Portal UI components built (React/Vue)
- [ ] Performance testing with 1000+ students
- [ ] FERPA compliance review
- [ ] Load testing for concurrent access
- [ ] Monitoring and alerting configured

## Testing Checklist

```bash
# Test attendance recording
curl -X POST http://localhost:8787/api/attendance/record \
  -H "Authorization: Bearer teacher_token" \
  -d '{...}'

# Test gradebook
curl -X POST http://localhost:8787/api/gradebook/grade \
  -H "Authorization: Bearer teacher_token" \
  -d '{...}'

# Test lesson plans
curl -X POST http://localhost:8787/api/lesson-plans \
  -H "Authorization: Bearer teacher_token" \
  -d '{...}'

# Test transcripts
curl -X GET http://localhost:8787/api/instructor/transcripts/class-101 \
  -H "Authorization: Bearer teacher_token"
```

## See Also

- [src/routes/attendance.ts](src/routes/attendance.ts)
- [src/routes/gradebook.ts](src/routes/gradebook.ts)
- [src/routes/lesson-plans.ts](src/routes/lesson-plans.ts)
- [src/routes/transcripts.ts](src/routes/transcripts.ts)
- [src/routes/instructor-portal.ts](src/routes/instructor-portal.ts)
- [schema/compliance-schema.sql](schema/compliance-schema.sql)
