import {
  LayoutDashboard, Building2, Users, BarChart3, BookOpen,
  GraduationCap, ClipboardList, Calendar,
  FileText, School, Layers, UserCog, UserCheck, Settings, Shield
} from 'lucide-react'

const sidebarConfig = {
  superadmin: {
    title: 'Super Admin',
    basePath: '/dashboard/superadmin',
    links: [
      { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/schools', icon: School, label: 'Schools' },
      { to: '/colleges', icon: GraduationCap, label: 'Colleges' },
      { to: '/users', icon: Users, label: 'All Users' },
      { to: '/pending', icon: UserCheck, label: 'Approvals' },
      { to: '/admins', icon: Shield, label: 'Admins' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  },
  admin: {
    title: 'Admin',
    basePath: '/dashboard/admin',
    links: [
      { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/institutions', icon: Building2, label: 'Institutions' },
      { to: '/users', icon: Users, label: 'Users' },
      { to: '/pending', icon: UserCheck, label: 'Approvals' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/reports', icon: FileText, label: 'Reports' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  },
  principal: {
    school: {
      title: 'Principal',
      basePath: '/dashboard/school/principal',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/grades', icon: Layers, label: 'Grades & Sections' },
        { to: '/subjects', icon: BookOpen, label: 'Subjects' },
        { to: '/teachers', icon: UserCog, label: 'Teachers' },
        { to: '/students', icon: GraduationCap, label: 'Students' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/assessments', icon: FileText, label: 'Assessments' },
        { to: '/pending', icon: UserCheck, label: 'Approvals' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
      ]
    },
    college: {
      title: 'Principal',
      basePath: '/dashboard/college/principal',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/departments', icon: Building2, label: 'Departments' },
        { to: '/staff', icon: UserCog, label: 'Staff' },
        { to: '/students', icon: GraduationCap, label: 'Students' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/assessments', icon: FileText, label: 'Assessments' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
        { to: '/pending', icon: UserCheck, label: 'Approvals' },
      ]
    }
  },
  vice_principal: {
    school: {
      title: 'Vice Principal',
      basePath: '/dashboard/school/vice-principal',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/grades', icon: Layers, label: 'My Grades' },
        { to: '/teachers', icon: UserCog, label: 'Teachers' },
        { to: '/students', icon: GraduationCap, label: 'Students' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
      ]
    },
    college: {
      title: 'Vice Principal',
      basePath: '/dashboard/college/vice-principal',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/departments', icon: Building2, label: 'Departments' },
        { to: '/staff', icon: UserCog, label: 'Staff' },
        { to: '/students', icon: GraduationCap, label: 'Students' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/assessments', icon: FileText, label: 'Assessments' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
        { to: '/pending', icon: UserCheck, label: 'Approvals' },
      ]
    }
  },
  chairman: {
    title: 'Chairman',
    basePath: '/dashboard/college/chairman',
    links: [
      { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/departments', icon: Building2, label: 'Departments' },
      { to: '/staff', icon: UserCog, label: 'Staff' },
      { to: '/students', icon: GraduationCap, label: 'Students' },
      { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/assessments', icon: FileText, label: 'Assessments' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/pending', icon: UserCheck, label: 'Approvals' },
    ]
  },
  vice_chairman: {
    title: 'Vice Chairman',
    basePath: '/dashboard/college/vice-chairman',
    links: [
      { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/departments', icon: Building2, label: 'Departments' },
      { to: '/staff', icon: UserCog, label: 'Staff' },
      { to: '/students', icon: GraduationCap, label: 'Students' },
      { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/assessments', icon: FileText, label: 'Assessments' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/pending', icon: UserCheck, label: 'Approvals' },
    ]
  },
  dean: {
    title: 'Dean',
    basePath: '/dashboard/college/dean',
    links: [
      { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/departments', icon: Building2, label: 'Departments' },
      { to: '/staff', icon: UserCog, label: 'Staff' },
      { to: '/students', icon: GraduationCap, label: 'Students' },
      { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/assessments', icon: FileText, label: 'Assessments' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ]
  },
  hod: {
    title: 'HOD',
    basePath: '/dashboard/college/hod',
    links: [
      { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/teachers', icon: UserCog, label: 'Teachers' },
      { to: '/subjects', icon: BookOpen, label: 'Subjects' },
      { to: '/students', icon: GraduationCap, label: 'Students' },
      { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/assessments', icon: FileText, label: 'Assessments' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ]
  },
  teacher: {
    school: {
      title: 'Teacher',
      basePath: '/dashboard/school/teacher',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/classes', icon: BookOpen, label: 'My Classes' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/assessments', icon: FileText, label: 'Assessments' },
        { to: '/students', icon: GraduationCap, label: 'My Students' },
        { to: '/results', icon: BarChart3, label: 'Results' },
      ]
    },
    college: {
      title: 'Teacher',
      basePath: '/dashboard/college/teacher',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/classes', icon: BookOpen, label: 'My Classes' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/assessments', icon: FileText, label: 'Assessments' },
        { to: '/students', icon: GraduationCap, label: 'My Students' },
        { to: '/results', icon: BarChart3, label: 'Results' },
      ]
    }
  },
  student: {
    school: {
      title: 'Student',
      basePath: '/dashboard/school/student',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/subjects', icon: BookOpen, label: 'My Subjects' },
        { to: '/attendance', icon: Calendar, label: 'Attendance' },
        { to: '/assessments', icon: FileText, label: 'Assessments' },
        { to: '/grades', icon: BarChart3, label: 'Grades' },
      ]
    },
    college: {
      title: 'Student',
      basePath: '/dashboard/college/student',
      links: [
        { to: '', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/subjects', icon: BookOpen, label: 'My Subjects' },
        { to: '/attendance', icon: Calendar, label: 'Attendance' },
        { to: '/assessments', icon: FileText, label: 'Assessments' },
        { to: '/grades', icon: BarChart3, label: 'Grades' },
      ]
    }
  }
}

export default sidebarConfig
