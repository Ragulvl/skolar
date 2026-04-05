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

// Lazy-loaded dashboard pages (code splitting — only loaded when navigated to)
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

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))

const SchoolPrincipalOverview = lazy(() => import('./pages/school/principal/Overview'))
const SchoolPrincipalGrades = lazy(() => import('./pages/school/principal/Grades'))
const SchoolPrincipalSubjects = lazy(() => import('./pages/school/principal/Subjects'))
const SchoolPrincipalTeachers = lazy(() => import('./pages/school/principal/Teachers'))
const SchoolPrincipalStudents = lazy(() => import('./pages/school/principal/Students'))
const SchoolPrincipalAttendance = lazy(() => import('./pages/school/principal/Attendance'))
const SchoolPrincipalAssessments = lazy(() => import('./pages/school/principal/Assessments'))

const SchoolTeacherClasses = lazy(() => import('./pages/school/teacher/MyClasses'))
const SchoolTeacherAttendance = lazy(() => import('./pages/school/teacher/MarkAttendance'))
const SchoolTeacherAssessments = lazy(() => import('./pages/school/teacher/Assessments'))
const SchoolTeacherStudents = lazy(() => import('./pages/school/teacher/MyStudents'))
const SchoolTeacherCertificates = lazy(() => import('./pages/school/teacher/Certificates'))

const SchoolStudentOverview = lazy(() => import('./pages/school/student/Overview'))
const SchoolStudentSubjects = lazy(() => import('./pages/school/student/MySubjects'))
const SchoolStudentAttendance = lazy(() => import('./pages/school/student/Attendance'))
const SchoolStudentGrades = lazy(() => import('./pages/school/student/Grades'))
const SchoolStudentCertificates = lazy(() => import('./pages/school/student/Certificates'))

const CollegeChairmanOverview = lazy(() => import('./pages/college/chairman/Overview'))
const CollegeHODOverview = lazy(() => import('./pages/college/hod/Overview'))
const CollegeTeacherClasses = lazy(() => import('./pages/college/teacher/MyClasses'))
const CollegeStudentOverview = lazy(() => import('./pages/college/student/Overview'))

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

      {/* Super Admin */}
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

      {/* Admin */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* School Principal */}
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
      </Route>

      {/* School Vice Principal */}
      <Route path="/dashboard/school/vice-principal" element={
        <ProtectedRoute allowedRoles={['vice_principal']}>
          <DashboardLayout role="vice_principal" institutionType="school" />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolPrincipalOverview />} />
        <Route path="grades" element={<SchoolPrincipalGrades />} />
        <Route path="teachers" element={<SchoolPrincipalTeachers />} />
        <Route path="students" element={<SchoolPrincipalStudents />} />
        <Route path="attendance" element={<SchoolPrincipalAttendance />} />
      </Route>

      {/* School Teacher */}
      <Route path="/dashboard/school/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <DashboardLayout role="teacher" institutionType="school" />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolTeacherClasses />} />
        <Route path="attendance" element={<SchoolTeacherAttendance />} />
        <Route path="assessments" element={<SchoolTeacherAssessments />} />
        <Route path="students" element={<SchoolTeacherStudents />} />
        <Route path="certificates" element={<SchoolTeacherCertificates />} />
      </Route>

      {/* School Student */}
      <Route path="/dashboard/school/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DashboardLayout role="student" institutionType="school" />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolStudentOverview />} />
        <Route path="subjects" element={<SchoolStudentSubjects />} />
        <Route path="attendance" element={<SchoolStudentAttendance />} />
        <Route path="grades" element={<SchoolStudentGrades />} />
        <Route path="certificates" element={<SchoolStudentCertificates />} />
      </Route>

      {/* College Chairman */}
      <Route path="/dashboard/college/chairman" element={
        <ProtectedRoute allowedRoles={['chairman']}>
          <DashboardLayout role="chairman" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeChairmanOverview />} />
      </Route>

      {/* College Vice Chairman */}
      <Route path="/dashboard/college/vice-chairman" element={
        <ProtectedRoute allowedRoles={['vice_chairman']}>
          <DashboardLayout role="vice_chairman" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeChairmanOverview />} />
      </Route>

      {/* College Principal */}
      <Route path="/dashboard/college/principal" element={
        <ProtectedRoute allowedRoles={['principal']}>
          <DashboardLayout role="principal" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeChairmanOverview />} />
      </Route>

      {/* College Vice Principal */}
      <Route path="/dashboard/college/vice-principal" element={
        <ProtectedRoute allowedRoles={['vice_principal']}>
          <DashboardLayout role="vice_principal" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeChairmanOverview />} />
      </Route>

      {/* College Dean */}
      <Route path="/dashboard/college/dean" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DashboardLayout role="dean" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeChairmanOverview />} />
      </Route>

      {/* College HOD */}
      <Route path="/dashboard/college/hod" element={
        <ProtectedRoute allowedRoles={['hod']}>
          <DashboardLayout role="hod" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeHODOverview />} />
      </Route>

      {/* College Teacher */}
      <Route path="/dashboard/college/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <DashboardLayout role="teacher" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeTeacherClasses />} />
      </Route>

      {/* College Student */}
      <Route path="/dashboard/college/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DashboardLayout role="student" institutionType="college" />
        </ProtectedRoute>
      }>
        <Route index element={<CollegeStudentOverview />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
