# Skolar — Unbounded Data Fetch Audit

**Date:** April 13, 2026  
**Scope:** All 12 backend controllers, all frontend pages across every role  
**Goal:** Find every API endpoint that loads unlimited rows without pagination

---

## Severity Levels

- 🔴 **CRITICAL** — User/student lists that scale to 10k–100k+ rows. Will crash the server or client.
- 🟠 **HIGH** — Lists that can grow to 1k–10k rows per institution. Noticeably slow.
- 🟡 **MEDIUM** — Lists unlikely to exceed a few hundred per scope, but still unbounded.
- 🟢 **SAFE** — Already paginated, or uses `count`/`groupBy`/aggregation (no row loading).

---

## 🔴 CRITICAL — Must Fix (16 endpoints)

These endpoints load entire user/student/teacher tables with no `take` limit. A single institution with 5,000 students would dump all 5,000 rows (plus joins) on every page load.

| # | Role | Endpoint | Controller Function | What It Loads | Scope |
|---|------|----------|-------------------|--------------|-------|
| 1 | School Principal | `GET /school/students-by-institution/:id` | `school.getStudentsByInstitution` | ALL students in institution | Per institution |
| 2 | School Principal | `GET /school/teachers-by-institution/:id` | `school.getTeachersByInstitution` | ALL teachers + nested assignments | Per institution |
| 3 | School Teacher | Same as #1 and #2 | (reuses school controller) | ALL teachers/students sent to client, filtered in JS | Per institution |
| 4 | Vice Principal | `GET /viceprincipal/teachers` | `viceprincipal.getVPTeachers` | ALL teachers in assigned grades/depts | Per institution |
| 5 | Vice Principal | `GET /viceprincipal/students` | `viceprincipal.getVPStudents` | ALL students in assigned grades/depts | Per institution |
| 6 | Dean | `GET /dean/students` | `dean.getDeanStudents` | ALL students across managed departments | Multi-dept |
| 7 | Dean | `GET /dean/staff` | `dean.getDeanStaff` | ALL HODs + teachers + nested assignments | Multi-dept |
| 8 | HOD | `GET /hod/students` | `hod.getHODStudents` | ALL students in department | Per dept |
| 9 | HOD | `GET /hod/teachers` | `hod.getHODTeachers` | ALL teachers + nested assignments + cross-dept data | Per dept |
| 10 | College Admin (Chairman) | `GET /college-admin/staff` | `college-admin.getStaff` | ALL staff (principals, VPs, deans, HODs, teachers) | Per institution |
| 11 | College Admin (Chairman) | `GET /college-admin/students` | `college-admin.getStudents` | ALL students in institution | Per institution |
| 12 | College Admin (Chairman) | `GET /college-admin/departments/:id` | `college-admin.getDepartmentDetail` | ALL teachers + ALL students in a department | Per dept |
| 13 | Super Admin | `GET /superadmin/admins` | `superadmin.getAdmins` | ALL admin users platform-wide + nested assignments | Global |
| 14 | Super Admin | `GET /superadmin/pending-users` | `superadmin.getPendingUsers` | ALL pending users platform-wide | Global |
| 15 | Admin | `GET /admin/pending/:institutionId` | `admin.getPendingUsers` | ALL pending users in institution | Per institution |
| 16 | Admin | `GET /admin/all-pending` | `admin.getAllPendingUsers` | ALL pending across ALL assigned institutions | Multi-institution |

### Scale impact example:

| Institution Size | Rows per request | Payload size (est.) | Response time (est.) |
|-----------------|-----------------|--------------------|--------------------|
| 500 students | 500 | ~150 KB | ~800ms |
| 2,000 students | 2,000 | ~600 KB | ~2.5s |
| 10,000 students | 10,000 | ~3 MB | ~8s |
| 50,000 students | 50,000 | ~15 MB | 30s+ / timeout |

---

## 🟠 HIGH — Should Fix (16 endpoints)

These load assessment, attendance, or result records that grow continuously over time. A full year of data for one institution can easily hit thousands of rows.

| # | Role | Endpoint | Controller Function | What It Loads |
|---|------|----------|-------------------|--------------|
| 17 | HOD | `GET /hod/assessments` | `hod.getHODAssessments` | ALL assessments in department (no limit) |
| 18 | HOD | `GET /hod/subjects` | `hod.getHODSubjects` | ALL subjects + nested teacher assignments |
| 19 | Dean | `GET /dean/subjects` | `dean.getDeanSubjects` | ALL subjects across managed depts + nested data |
| 20 | Dean | `GET /dean/attendance` | `dean.getDeanAttendance` | 7-day attendance via `findMany` — loads raw rows instead of `groupBy` |
| 21 | HOD | `GET /hod/attendance` | `hod.getHODAttendance` | 7-day attendance via `findMany` — same problem as #20 |
| 22 | College Admin | `GET /college-admin/attendance` | `college-admin.getAttendance` | `deptBreakdownRaw` + `trendRaw` loaded via `findMany` instead of `groupBy` |
| 23 | Teacher/HOD/Dean | `GET /assessments/mine` | `assessment.getMyAssessments` | ALL assessments created by user (no limit) |
| 24 | Student | `GET /assessments/pending` | `assessment.getStudentPendingAssessments` | ALL assessments for student's subjects (no limit) |
| 25 | Any | `GET /assessments/subject/:id` | `assessment.getAssessmentsBySubject` | ALL assessments for a subject (no limit) |
| 26 | Any | `GET /assessments/student/:id/results` | `assessment.getStudentResults` | ALL results for a student (no limit) |
| 27 | Student | `GET /student/assessments` | `student.getStudentAssessments` | ALL assessment results (no limit) |
| 28 | Student | `GET /student/grades` | `student.getStudentGrades` | ALL results loaded to compute averages in JS |
| 29 | College Admin | `GET /college-admin/.../students/:studentId` | `college-admin.getStudentProfile` | ALL attendance + ALL results for one student |
| 30 | Teacher | `GET /teacher/dept-view` | `teacher.getTeacherDeptView` | ALL students + ALL teachers in dept |
| 31 | Teacher | `GET /teacher/subject/:id` | `teacher.getTeacherSubjectView` | ALL students in department |
| 32 | Teacher | `GET /teacher/my-students` | `teacher.getTeacherStudents` | ALL students across all depts teacher teaches in |

---

## 🟡 MEDIUM — Low Risk but Unbounded (9 endpoints)

These are technically unbounded but unlikely to exceed a few hundred rows in practice.

| # | Role | Endpoint | What It Loads | Why It's Likely OK |
|---|------|----------|--------------|-------------------|
| 33 | School | `GET /school/grades/:id` | Grades with sections | Fixed set — max ~15 grades |
| 34 | School | `GET /school/sections/:gradeId` | Sections per grade | Usually 3–5 per grade |
| 35 | School | `GET /school/subjects/:gradeId` | Subjects per grade | Usually 8–12 per grade |
| 36 | School | `GET /school/students/:sectionId` | Students per section | Typically 30–60 per section |
| 37 | VP | `GET /viceprincipal/grades` | Assigned grades | Usually 2–5 |
| 38 | VP | `GET /viceprincipal/departments` | Assigned departments | Usually 2–5 |
| 39 | College Admin | `GET /college-admin/pending` | Pending users | Transient — cleared via approval |
| 40 | College Admin | `GET /college-admin/departments` | All departments | Typically 5–20 per college |
| 41 | Assessment | `GET /assessments/report/:id` | Results for one assessment | Typically 30–100 students |

---

## 🟢 SAFE — Already Optimized (20 endpoints)

These are either paginated, use `count()`/`groupBy()`, or have explicit `take` limits.

| Role | Endpoint | Why It's Safe |
|------|----------|--------------|
| Super Admin | `GET /superadmin/institutions` | ✅ Cursor pagination (`take: 20`, max 100) |
| Super Admin | `GET /superadmin/users` | ✅ Cursor pagination (`take: 20`, max 100) |
| Super Admin | `GET /superadmin/stats` | ✅ `count()` + `groupBy` only |
| Super Admin | `GET /superadmin/analytics/enhanced` | ✅ Aggregation with `take: 10–15` limits |
| Super Admin | `GET /superadmin/overview` | ✅ `count()`/`groupBy`, recent items use `take: 10` |
| Super Admin | `GET /superadmin/institution/:id` (detail) | ✅ Single record + limited lists (`take: 10`) |
| Admin | `GET /admin/overview` | ✅ `groupBy` only |
| Admin | `GET /admin/institutions` | ✅ Small set (admin's own assignments) |
| Admin | `GET /admin/institutions/:id/stats` | ✅ `groupBy` + `count()` |
| Admin | `GET /admin/reports/:id` | ✅ `groupBy` + `aggregate` |
| College Admin | `GET /college-admin/overview` | ✅ `count` + `groupBy` |
| College Admin | `GET /college-admin/analytics` | ✅ `groupBy` + `aggregate` |
| College Admin | `GET /college-admin/assessments` | ✅ Has `take: 100` cap |
| HOD | `GET /hod/overview` | ✅ All `count()` + `groupBy` |
| HOD | `GET /hod/reports` | ✅ `count()` + `groupBy` + `aggregate` |
| Dean | `GET /dean/overview` | ✅ `count()` + `groupBy` |
| Dean | `GET /dean/reports` | ✅ `groupBy` + `aggregate` |
| Teacher | `GET /teacher/dashboard` | ✅ `count()` only |
| Student | `GET /student/dashboard` | ✅ `groupBy` + `aggregate` |
| Student | `GET /student/attendance` | ✅ `take: 100` cap |

---

## Frontend Pages Affected

These are the actual `.jsx` pages a user clicks on that trigger the dangerous endpoints above.

### School Role Pages

| Page File | Dangerous Endpoint(s) |
|-----------|----------------------|
| `school/principal/Students.jsx` | #1 — All students |
| `school/principal/Teachers.jsx` | #2 — All teachers |
| `school/teacher/MyStudents.jsx` | #1 — All students (filtered client-side) |
| `school/teacher/MyClasses.jsx` | #2 — All teachers (filtered client-side) |

### College Role Pages

| Page File | Dangerous Endpoint(s) |
|-----------|----------------------|
| `college/hod/Students.jsx` | #8 — All dept students |
| `college/hod/Teachers.jsx` | #9 — All dept teachers |
| `college/hod/Assessments.jsx` | #17 — All dept assessments |
| `college/hod/Attendance.jsx` | #21 — Raw attendance rows |
| `college/dean/Students.jsx` | #6 — All multi-dept students |
| `college/dean/Staff.jsx` | #7 — All multi-dept staff |
| `college/dean/Attendance.jsx` | #20 — Raw attendance rows |
| `college/chairman/Staff.jsx` | #10 — All institution staff |
| `college/chairman/Students.jsx` | #11 — All institution students |
| `college/chairman/DeptDetail.jsx` | #12 — All dept teachers + students |
| `college/viceprincipal/Students.jsx` | #5 — All scoped students |
| `college/viceprincipal/Teachers.jsx` | #4 — All scoped teachers |
| `college/teacher/Overview.jsx` | #30, #31 — All dept students/teachers |
| `college/teacher/Assessments.jsx` | #23 — All assessments |

### Super Admin / Admin Pages

| Page File | Dangerous Endpoint(s) |
|-----------|----------------------|
| `superadmin/Admins.jsx` | #13 — All platform admins |
| `superadmin/PendingApprovals.jsx` | #14 — All pending users globally |

---

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 CRITICAL | 16 | Need cursor/offset pagination immediately |
| 🟠 HIGH | 16 | Need `take` limits or replace `findMany` with `groupBy` |
| 🟡 MEDIUM | 9 | Safe for now, add limits as a precaution |
| 🟢 SAFE | 20 | No changes needed |

**Total endpoints audited:** 61  
**Endpoints needing pagination:** 32 (52%)
