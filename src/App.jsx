import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Public Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PendingApproval from './pages/PendingApproval'

// Auth
import ProtectedRoute from './components/ProtectedRoute'

// Dashboard Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// ─── Lazy-loaded dashboard pages ────────────────────────────────────────────

// Super Admin
const SuperAdminOverview = lazy(() => import('./pages/superadmin/Overview'))
const SuperAdminSchools = lazy(() => import('./pages/superadmin/Schools'))
const SuperAdminColleges = lazy(() => import('./pages/superadmin/Colleges'))
const SuperAdminAdmins = lazy(() => import('./pages/superadmin/Admins'))
const SuperAdminAdminManage = lazy(() => import('./pages/superadmin/AdminManage'))
const SuperAdminAnalytics = lazy(() => import('./pages/superadmin/Analytics'))
const SuperAdminUsers = lazy(() => import('./pages/superadmin/Users'))
const SuperAdminUserDetail = lazy(() => import('./pages/superadmin/UserDetail'))
const SuperAdminPendingApprovals = lazy(() => import('./pages/superadmin/PendingApprovals'))
const SuperAdminInstitutionDetail = lazy(() => import('./pages/superadmin/InstitutionDetail'))
const SuperAdminSettings = lazy(() => import('./pages/superadmin/Settings'))

// Admin
const AdminOverview = lazy(() => import('./pages/admin/Overview'))
const AdminInstitutions = lazy(() => import('./pages/admin/Institutions'))
const AdminInstitutionDetail = lazy(() => import('./pages/admin/InstitutionDetail'))
const AdminPending = lazy(() => import('./pages/admin/PendingApprovals'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminUserDetail = lazy(() => import('./pages/admin/UserDetail'))
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'))

// School Principal
const SchoolPrincipalOverview = lazy(() => import('./pages/school/principal/Overview'))
const SchoolPrincipalGrades = lazy(() => import('./pages/school/principal/Grades'))
const SchoolPrincipalSubjects = lazy(() => import('./pages/school/principal/Subjects'))
const SchoolPrincipalTeachers = lazy(() => import('./pages/school/principal/Teachers'))
const SchoolPrincipalStudents = lazy(() => import('./pages/school/principal/Students'))
const SchoolPrincipalAttendance = lazy(() => import('./pages/school/principal/Attendance'))
const SchoolPrincipalAssessments = lazy(() => import('./pages/school/principal/Assessments'))
const SchoolPrincipalPending = lazy(() => import('./pages/school/principal/Pending'))
const SchoolPrincipalReports = lazy(() => import('./pages/school/principal/Reports'))

// School Vice Principal
const SchoolVPOverview = lazy(() => import('./pages/school/viceprincipal/Overview'))
const SchoolVPGrades = lazy(() => import('./pages/school/viceprincipal/Grades'))
const SchoolVPTeachers = lazy(() => import('./pages/school/viceprincipal/Teachers'))
const SchoolVPStudents = lazy(() => import('./pages/school/viceprincipal/Students'))
const SchoolVPAttendance = lazy(() => import('./pages/school/viceprincipal/Attendance'))
const SchoolVPReports = lazy(() => import('./pages/school/viceprincipal/Reports'))

// School Teacher
const SchoolTeacherOverview = lazy(() => import('./pages/school/teacher/Overview'))
const SchoolTeacherClasses = lazy(() => import('./pages/school/teacher/MyClasses'))
const SchoolTeacherAttendance = lazy(() => import('./pages/school/teacher/MarkAttendance'))
const SchoolTeacherAssessments = lazy(() => import('./pages/school/teacher/Assessments'))
const SchoolTeacherStudents = lazy(() => import('./pages/school/teacher/MyStudents'))
const SchoolTeacherResults = lazy(() => import('./pages/school/teacher/Results'))
const SchoolTeacherClassDetail = lazy(() => import('./pages/school/teacher/ClassDetail'))

// School Student
const SchoolStudentOverview = lazy(() => import('./pages/school/student/Overview'))
const SchoolStudentSubjects = lazy(() => import('./pages/school/student/MySubjects'))
const SchoolStudentAttendance = lazy(() => import('./pages/school/student/Attendance'))
const SchoolStudentAssessments = lazy(() => import('./pages/school/student/Assessments'))
const SchoolStudentGrades = lazy(() => import('./pages/school/student/Grades'))

// College Chairman
const CollegeChairmanOverview = lazy(() => import('./pages/college/chairman/Overview'))
const CollegeChairmanDepartments = lazy(() => import('./pages/college/chairman/Departments'))
const CollegeChairmanDeptDetail = lazy(() => import('./pages/college/chairman/DepartmentDetail'))
const CollegeChairmanTeacherProfile = lazy(() => import('./pages/college/chairman/TeacherProfile'))
const CollegeChairmanStudentProfile = lazy(() => import('./pages/college/chairman/StudentProfile'))
const CollegeChairmanStaff = lazy(() => import('./pages/college/chairman/Staff'))
const CollegeChairmanStudents = lazy(() => import('./pages/college/chairman/Students'))
const CollegeChairmanAnalytics = lazy(() => import('./pages/college/chairman/Analytics'))
const CollegeChairmanPending = lazy(() => import('./pages/college/chairman/Pending'))
const CollegeChairmanAttendance = lazy(() => import('./pages/college/chairman/Attendance'))
const CollegeChairmanAssessments = lazy(() => import('./pages/college/chairman/Assessments'))
const CollegeChairmanReports = lazy(() => import('./pages/college/chairman/Reports'))

// College Vice Chairman
const CollegeViceChairmanOverview = lazy(() => import('./pages/college/vicechairman/Overview'))
const CollegeViceChairmanDepartments = lazy(() => import('./pages/college/vicechairman/Departments'))
const CollegeViceChairmanDeptDetail = lazy(() => import('./pages/college/vicechairman/DepartmentDetail'))
const CollegeViceChairmanTeacherProfile = lazy(() => import('./pages/college/vicechairman/TeacherProfile'))
const CollegeViceChairmanStudentProfile = lazy(() => import('./pages/college/vicechairman/StudentProfile'))
const CollegeViceChairmanStaff = lazy(() => import('./pages/college/vicechairman/Staff'))
const CollegeViceChairmanStudents = lazy(() => import('./pages/college/vicechairman/Students'))
const CollegeViceChairmanAnalytics = lazy(() => import('./pages/college/vicechairman/Analytics'))
const CollegeViceChairmanPending = lazy(() => import('./pages/college/vicechairman/Pending'))
const CollegeViceChairmanAttendance = lazy(() => import('./pages/college/vicechairman/Attendance'))
const CollegeViceChairmanAssessments = lazy(() => import('./pages/college/vicechairman/Assessments'))
const CollegeViceChairmanReports = lazy(() => import('./pages/college/vicechairman/Reports'))

// College Principal
const CollegePrincipalOverview = lazy(() => import('./pages/college/principal/Overview'))
const CollegePrincipalDepartments = lazy(() => import('./pages/college/principal/Departments'))
const CollegePrincipalDeptDetail = lazy(() => import('./pages/college/principal/DepartmentDetail'))
const CollegePrincipalTeacherProfile = lazy(() => import('./pages/college/principal/TeacherProfile'))
const CollegePrincipalStudentProfile = lazy(() => import('./pages/college/principal/StudentProfile'))
const CollegePrincipalStaff = lazy(() => import('./pages/college/principal/Staff'))
const CollegePrincipalStudents = lazy(() => import('./pages/college/principal/Students'))
const CollegePrincipalAnalytics = lazy(() => import('./pages/college/principal/Analytics'))
const CollegePrincipalPending = lazy(() => import('./pages/college/principal/Pending'))
const CollegePrincipalAttendance = lazy(() => import('./pages/college/principal/Attendance'))
const CollegePrincipalAssessments = lazy(() => import('./pages/college/principal/Assessments'))
const CollegePrincipalReports = lazy(() => import('./pages/college/principal/Reports'))

// College Vice Principal
const CollegeVPOverview = lazy(() => import('./pages/college/viceprincipal/Overview'))
const CollegeVPDepartments = lazy(() => import('./pages/college/viceprincipal/Departments'))
const CollegeVPDeptDetail = lazy(() => import('./pages/college/viceprincipal/DepartmentDetail'))
const CollegeVPTeacherProfile = lazy(() => import('./pages/college/viceprincipal/TeacherProfile'))
const CollegeVPStudentProfile = lazy(() => import('./pages/college/viceprincipal/StudentProfile'))
const CollegeVPStaff = lazy(() => import('./pages/college/viceprincipal/Staff'))
const CollegeVPStudents = lazy(() => import('./pages/college/viceprincipal/Students'))
const CollegeVPAttendance = lazy(() => import('./pages/college/viceprincipal/Attendance'))
const CollegeVPPending = lazy(() => import('./pages/college/viceprincipal/Pending'))
const CollegeVPAnalytics = lazy(() => import('./pages/college/viceprincipal/Analytics'))
const CollegeVPAssessments = lazy(() => import('./pages/college/viceprincipal/Assessments'))
const CollegeVPReports = lazy(() => import('./pages/college/viceprincipal/Reports'))

// College Dean
const CollegeDeanOverview = lazy(() => import('./pages/college/dean/Overview'))
const CollegeDeanDepartments = lazy(() => import('./pages/college/dean/Departments'))
const CollegeDeanStaff = lazy(() => import('./pages/college/dean/Staff'))
const CollegeDeanStudents = lazy(() => import('./pages/college/dean/Students'))
const CollegeDeanReports = lazy(() => import('./pages/college/dean/Reports'))
const CollegeDeanAttendance = lazy(() => import('./pages/college/dean/Attendance'))
const CollegeDeanAssessments = lazy(() => import('./pages/college/dean/Assessments'))

// College HOD
const CollegeHODOverview = lazy(() => import('./pages/college/hod/Overview'))
const CollegeHODTeachers = lazy(() => import('./pages/college/hod/Teachers'))
const CollegeHODSubjects = lazy(() => import('./pages/college/hod/Subjects'))
const CollegeHODStudents = lazy(() => import('./pages/college/hod/Students'))
const CollegeHODAttendance = lazy(() => import('./pages/college/hod/Attendance'))
const CollegeHODAssessments = lazy(() => import('./pages/college/hod/Assessments'))
const CollegeHODReports = lazy(() => import('./pages/college/hod/Reports'))

// College Teacher
const CollegeTeacherOverview = lazy(() => import('./pages/college/teacher/Overview'))
const CollegeTeacherClasses = lazy(() => import('./pages/college/teacher/MyClasses'))
const CollegeTeacherAttendance = lazy(() => import('./pages/college/teacher/MarkAttendance'))
const CollegeTeacherAssessments = lazy(() => import('./pages/college/teacher/Assessments'))
const CollegeTeacherStudents = lazy(() => import('./pages/college/teacher/MyStudents'))
const CollegeTeacherResults = lazy(() => import('./pages/college/teacher/Results'))
const CollegeTeacherDeptView = lazy(() => import('./pages/college/teacher/DeptView'))
const CollegeTeacherSubjectView = lazy(() => import('./pages/college/teacher/SubjectView'))

// College Student
const CollegeStudentOverview = lazy(() => import('./pages/college/student/Overview'))
const CollegeStudentSubjects = lazy(() => import('./pages/college/student/MySubjects'))
const CollegeStudentAttendance = lazy(() => import('./pages/college/student/Attendance'))
const CollegeStudentAssessments = lazy(() => import('./pages/college/student/Assessments'))
const CollegeStudentGrades = lazy(() => import('./pages/college/student/Grades'))

// Shimmer fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-48 bg-dark-700/60 rounded-lg" />
      <div className="h-4 w-72 bg-dark-700/40 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-dark-700/40 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-dark-700/40 rounded-2xl" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pending" element={<PendingApproval />} />

      {/* ─── Super Admin ─── */}
      <Route path="/dashboard/superadmin" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <DashboardLayout role="superadmin" />
        </ProtectedRoute>
      }>
        <Route index element={<SuperAdminOverview />} />
        <Route path="schools" element={<SuperAdminSchools />} />
        <Route path="schools/:institutionId" element={<SuperAdminInstitutionDetail />} />
        <Route path="colleges" element={<SuperAdminColleges />} />
        <Route path="colleges/:institutionId" element={<SuperAdminInstitutionDetail />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="users/:userId" element={<SuperAdminUserDetail />} />
        <Route path="pending" element={<SuperAdminPendingApprovals />} />
        <Route path="admins" element={<SuperAdminAdmins />} />
        <Route path="admins/:adminId" element={<SuperAdminAdminManage />} />
        <Route path="analytics" element={<SuperAdminAnalytics />} />
        <Route path="settings" element={<SuperAdminSettings />} />
      </Route>

      {/* ─── Admin ─── */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route index element={<AdminOverview />} />
        <Route path="institutions" element={<AdminInstitutions />} />
        <Route path="institutions/:id/detail" element={<AdminInstitutionDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:userId" element={<AdminUserDetail />} />
        <Route path="pending" element={<AdminPending />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* ─── School Principal ─── */}
      <Route path="/dashboard/school/principal" element={
        <ProtectedRoute allowedRoles={['principal']}>
          <DashboardLayout role="principal" institutionType="school" />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolPrincipalOverview />} />
        <Route path="grades" element={<SchoolPrincipalGrades />} />
        <Route path="subjects" element={<SchoolPrincipalSubjects />} />
        <Route path="teachers" element={<SchoolPrincipalTeachers />} />
        <Route path="students" element={<SchoolPrincipalStudents />} />
        <Route path="attendance" element={<SchoolPrincipalAttendance />} />
        <Route path="assessments" element={<SchoolPrincipalAssessments />} />
        <Route path="pending" element={<SchoolPrincipalPending />} />
        <Route path="reports" element={<SchoolPrincipalReports />} />
      </Route>

      {/* ─── School Vice Principal ─── */}
      <Route path="/dashboard/school/vice-principal" element={
        <ProtectedRoute allowedRoles={['vice_principal']}>
          <DashboardLayout role="vice_principal" institutionType="school" />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolVPOverview />} />
        <Route path="grades" element={<SchoolVPGrades />} />
        <Route path="teachers" element={<SchoolVPTeachers />} />
        <Route path="students" element={<SchoolVPStudents />} />
        <Route path="attendance" element={<SchoolVPAttendance />} />
        <Route path="reports" element={<SchoolVPReports />} />
      </Route>

      {/* ─── School Teacher ─── */}
      <Route path="/dashboard/school/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <DashboardLayout role="teacher" institutionType="school" />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolTeacherOverview />} />
        <Route path="classes" element={<SchoolTeacherClasses />} />
        <Route path="classes/:assignmentId" element={<SchoolTeacherClassDetail />} />
        <Route path="attendance" element={<SchoolTeacherAttendance />} />
        <Route path="assessments" element={<SchoolTeacherAssessments />} />
        <Route path="students" element={<SchoolTeacherStudents />} />
        <Route path="results" element={<SchoolTeacherResults />} />
      </Route>

      {/* ─── School Student ─── */}
      <Route path="/dashboard/school/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DashboardLayout role="student" institutionType="school" />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolStudentOverview />} />
        <Route path="subjects" element={<SchoolStudentSubjects />} />
        <Route path="attendance" element={<SchoolStudentAttendance />} />
        <Route path="assessments" element={<SchoolStudentAssessments />} />
        <Route path="grades" element={<SchoolStudentGrades />} />
      </Route>

      {/* ─── College Chairman ─── */}
      <Route path="/dashboard/college/chairman" element={
        <ProtectedRoute allowedRoles={['chairman']}>
          <DashboardLayout role="chairman" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeChairmanOverview />} />
        <Route path="departments" element={<CollegeChairmanDepartments />} />
        <Route path="departments/:deptId" element={<CollegeChairmanDeptDetail />} />
        <Route path="departments/:deptId/teachers/:teacherId" element={<CollegeChairmanTeacherProfile />} />
        <Route path="departments/:deptId/students/:studentId" element={<CollegeChairmanStudentProfile />} />
        <Route path="staff" element={<CollegeChairmanStaff />} />
        <Route path="students" element={<CollegeChairmanStudents />} />
        <Route path="analytics" element={<CollegeChairmanAnalytics />} />
        <Route path="pending" element={<CollegeChairmanPending />} />
        <Route path="attendance" element={<CollegeChairmanAttendance />} />
        <Route path="assessments" element={<CollegeChairmanAssessments />} />
        <Route path="reports" element={<CollegeChairmanReports />} />
      </Route>

      {/* ─── College Vice Chairman ─── */}
      <Route path="/dashboard/college/vice-chairman" element={
        <ProtectedRoute allowedRoles={['vice_chairman']}>
          <DashboardLayout role="vice_chairman" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeViceChairmanOverview />} />
        <Route path="departments" element={<CollegeViceChairmanDepartments />} />
        <Route path="departments/:deptId" element={<CollegeViceChairmanDeptDetail />} />
        <Route path="departments/:deptId/teachers/:teacherId" element={<CollegeViceChairmanTeacherProfile />} />
        <Route path="departments/:deptId/students/:studentId" element={<CollegeViceChairmanStudentProfile />} />
        <Route path="staff" element={<CollegeViceChairmanStaff />} />
        <Route path="students" element={<CollegeViceChairmanStudents />} />
        <Route path="analytics" element={<CollegeViceChairmanAnalytics />} />
        <Route path="pending" element={<CollegeViceChairmanPending />} />
        <Route path="attendance" element={<CollegeViceChairmanAttendance />} />
        <Route path="assessments" element={<CollegeViceChairmanAssessments />} />
        <Route path="reports" element={<CollegeViceChairmanReports />} />
      </Route>

      {/* ─── College Principal ─── */}
      <Route path="/dashboard/college/principal" element={
        <ProtectedRoute allowedRoles={['principal']}>
          <DashboardLayout role="principal" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegePrincipalOverview />} />
        <Route path="departments" element={<CollegePrincipalDepartments />} />
        <Route path="departments/:deptId" element={<CollegePrincipalDeptDetail />} />
        <Route path="departments/:deptId/teachers/:teacherId" element={<CollegePrincipalTeacherProfile />} />
        <Route path="departments/:deptId/students/:studentId" element={<CollegePrincipalStudentProfile />} />
        <Route path="staff" element={<CollegePrincipalStaff />} />
        <Route path="students" element={<CollegePrincipalStudents />} />
        <Route path="analytics" element={<CollegePrincipalAnalytics />} />
        <Route path="pending" element={<CollegePrincipalPending />} />
        <Route path="attendance" element={<CollegePrincipalAttendance />} />
        <Route path="assessments" element={<CollegePrincipalAssessments />} />
        <Route path="reports" element={<CollegePrincipalReports />} />
      </Route>

      {/* ─── College Vice Principal ─── */}
      <Route path="/dashboard/college/vice-principal" element={
        <ProtectedRoute allowedRoles={['vice_principal']}>
          <DashboardLayout role="vice_principal" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeVPOverview />} />
        <Route path="departments" element={<CollegeVPDepartments />} />
        <Route path="departments/:deptId" element={<CollegeVPDeptDetail />} />
        <Route path="departments/:deptId/teachers/:teacherId" element={<CollegeVPTeacherProfile />} />
        <Route path="departments/:deptId/students/:studentId" element={<CollegeVPStudentProfile />} />
        <Route path="staff" element={<CollegeVPStaff />} />
        <Route path="students" element={<CollegeVPStudents />} />
        <Route path="attendance" element={<CollegeVPAttendance />} />
        <Route path="pending" element={<CollegeVPPending />} />
        <Route path="analytics" element={<CollegeVPAnalytics />} />
        <Route path="assessments" element={<CollegeVPAssessments />} />
        <Route path="reports" element={<CollegeVPReports />} />
      </Route>

      {/* ─── College Dean ─── */}
      <Route path="/dashboard/college/dean" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DashboardLayout role="dean" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeDeanOverview />} />
        <Route path="departments" element={<CollegeDeanDepartments />} />
        <Route path="staff" element={<CollegeDeanStaff />} />
        <Route path="students" element={<CollegeDeanStudents />} />
        <Route path="attendance" element={<CollegeDeanAttendance />} />
        <Route path="assessments" element={<CollegeDeanAssessments />} />
        <Route path="reports" element={<CollegeDeanReports />} />
      </Route>

      {/* ─── College HOD ─── */}
      <Route path="/dashboard/college/hod" element={
        <ProtectedRoute allowedRoles={['hod']}>
          <DashboardLayout role="hod" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeHODOverview />} />
        <Route path="teachers" element={<CollegeHODTeachers />} />
        <Route path="subjects" element={<CollegeHODSubjects />} />
        <Route path="students" element={<CollegeHODStudents />} />
        <Route path="attendance" element={<CollegeHODAttendance />} />
        <Route path="assessments" element={<CollegeHODAssessments />} />
        <Route path="reports" element={<CollegeHODReports />} />
      </Route>

      {/* ─── College Teacher ─── */}
      <Route path="/dashboard/college/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <DashboardLayout role="teacher" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeTeacherOverview />} />
        <Route path="classes" element={<CollegeTeacherClasses />} />
        <Route path="attendance" element={<CollegeTeacherAttendance />} />
        <Route path="assessments" element={<CollegeTeacherAssessments />} />
        <Route path="students" element={<CollegeTeacherStudents />} />
        <Route path="results" element={<CollegeTeacherResults />} />
        <Route path="dept-view" element={<CollegeTeacherDeptView />} />
        <Route path="subject/:subjectId" element={<CollegeTeacherSubjectView />} />
      </Route>

      {/* ─── College Student ─── */}
      <Route path="/dashboard/college/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DashboardLayout role="student" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeStudentOverview />} />
        <Route path="subjects" element={<CollegeStudentSubjects />} />
        <Route path="attendance" element={<CollegeStudentAttendance />} />
        <Route path="assessments" element={<CollegeStudentAssessments />} />
        <Route path="grades" element={<CollegeStudentGrades />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
