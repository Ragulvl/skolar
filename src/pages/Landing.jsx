import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ArrowRight, Shield, ClipboardCheck, Brain, FileText, BarChart3,
  Building2, ChevronRight, Star, Menu, X, School, Sparkles,
  Users, GraduationCap, CheckCircle2, Globe, Zap, LayoutDashboard
} from 'lucide-react'

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return <span>{count.toLocaleString()}{suffix}</span>
}

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const features = [
    { icon: Shield, title: 'Role Management', desc: 'Hierarchical roles from Super Admin to Student with auto-detection via institution codes.' },
    { icon: ClipboardCheck, title: 'Smart Attendance', desc: 'Mark attendance in seconds with bulk actions, heatmap views, and automated reporting.' },
    { icon: Brain, title: 'Auto Assessments', desc: 'Create MCQ & descriptive assessments with instant grading and performance analytics.' },
    { icon: FileText, title: 'Report Cards', desc: 'Generate grade reports and performance summaries for any student with one click.' },
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Dashboard insights with charts for attendance, grades, growth, and institution health.' },
    { icon: Building2, title: 'Multi-Institution', desc: 'Manage unlimited schools and colleges from a single platform with isolated data.' },
  ]

  const steps = [
    { num: '01', title: 'Admin Creates Institution', desc: 'Super Admin sets up the institution and generates a unique code (SKL-YYYY-XXX).', icon: Building2 },
    { num: '02', title: 'Users Join with Code', desc: 'Teachers, students, and staff sign up using the institution code. Roles are assigned by authority.', icon: Users },
    { num: '03', title: 'Learning Begins', desc: 'Access dashboards, mark attendance, create assessments, track progress — all in one place.', icon: GraduationCap },
  ]

  const testimonials = [
    { name: 'Dr. Priya Sharma', role: 'Principal, DPS Bengaluru', quote: 'Skolar transformed how we manage our school. The attendance system alone saves us 2 hours daily.', rating: 5 },
    { name: 'Rajesh Kumar', role: 'HOD CS, VIT University', quote: 'Finally an LMS that understands Indian institutions. The college hierarchy support is unmatched.', rating: 5 },
    { name: 'Ananya Reddy', role: 'Teacher, Kendriya Vidyalaya', quote: 'Creating assessments and tracking performance is so seamless. My students love the dashboard too!', rating: 5 },
  ]

  return (
    <div className="min-h-screen bg-dark-900 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-dark-500/20 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-heading gradient-text">Skolar</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-dark-200 hover:text-dark-50 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-dark-200 hover:text-dark-50 transition-colors">How it Works</a>
              <a href="#testimonials" className="text-sm text-dark-200 hover:text-dark-50 transition-colors">Testimonials</a>
              {isAuthenticated ? (
                <Link to={user?.dashboardPath || '/dashboard/superadmin'} className="px-5 py-2 rounded-lg gradient-brand text-white text-sm font-semibold
                  hover:shadow-glow transition-all duration-300 flex items-center gap-2" id="cta-dashboard">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-dark-100 hover:text-dark-50 transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="px-5 py-2 rounded-lg gradient-brand text-white text-sm font-semibold
                    hover:shadow-glow transition-all duration-300" id="cta-get-started">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-dark-200">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-dark-500/20 bg-dark-800/95 backdrop-blur-xl animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-dark-200 py-2" onClick={() => setMobileMenu(false)}>Features</a>
              <a href="#how-it-works" className="block text-sm text-dark-200 py-2" onClick={() => setMobileMenu(false)}>How it Works</a>
              <a href="#testimonials" className="block text-sm text-dark-200 py-2" onClick={() => setMobileMenu(false)}>Testimonials</a>
              <Link to="/login" className="block text-sm text-dark-200 py-2">Login</Link>
              <Link to="/signup" className="block w-full text-center px-5 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[140px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/25 bg-brand-500/8 mb-8 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-semibold text-brand-300 tracking-wide">Now in Beta — Join 500+ Institutions</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading leading-[1.05] animate-slide-up">
              <span className="gradient-text-hero">The Next Era</span>
              <br />
              <span className="text-dark-50">of Learning</span>
            </h1>

            {/* Subtext */}
            <p className="mt-7 text-lg sm:text-xl text-dark-200 max-w-2xl mx-auto leading-relaxed animate-slide-up stagger-2">
              A premium SaaS platform that manages schools and colleges with smart attendance,
              auto assessments, role-based dashboards, and real-time analytics — built for India.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-slide-up stagger-3">
              <Link to="/signup" className="group px-8 py-3.5 rounded-xl gradient-brand text-white font-semibold
                shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center gap-2 text-base" id="hero-cta-primary">
                Start for Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#how-it-works" className="px-8 py-3.5 rounded-xl border border-dark-500/40 text-dark-100
                hover:border-brand-500/30 hover:bg-dark-700/40 transition-all duration-300 font-medium text-base">
                See How It Works
              </a>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-16 lg:mt-24 relative animate-slide-up stagger-4">
            <div className="relative mx-auto max-w-5xl">
              {/* Glow behind mockup */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-brand-500/20 via-violet-500/20 to-brand-500/20 blur-2xl" />
              <div className="relative rounded-2xl border border-dark-500/30 bg-dark-800 overflow-hidden shadow-elevated">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-dark-700/60 border-b border-dark-500/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="max-w-md mx-auto px-4 py-1 rounded-md bg-dark-800/80 text-xs text-dark-400 text-center">
                      app.skolar.in/dashboard
                    </div>
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-6 min-h-[300px] lg:min-h-[400px]">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Students', value: '2,450', color: 'brand' },
                      { label: 'Teachers', value: '186', color: 'violet' },
                      { label: 'Avg Attendance', value: '94.2%', color: 'success' },
                      { label: 'Assessments', value: '342', color: 'info' },
                    ].map((stat, i) => (
                      <div key={i} className="rounded-xl border border-dark-500/30 bg-dark-700/30 p-4 hidden sm:block">
                        <p className="text-xs text-dark-400">{stat.label}</p>
                        <p className="text-xl font-bold font-heading mt-1 text-dark-50">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 rounded-xl border border-dark-500/30 bg-dark-700/30 p-4 h-48">
                      <p className="text-xs text-dark-400 mb-3">Growth Overview</p>
                      <div className="flex items-end gap-2 h-32">
                        {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90, 80, 95].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm gradient-brand opacity-60" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-dark-500/30 bg-dark-700/30 p-4 h-48">
                      <p className="text-xs text-dark-400 mb-3">Institution Types</p>
                      <div className="flex items-center justify-center h-32">
                        <div className="w-28 h-28 rounded-full border-[8px] border-brand-500 border-t-violet-500 border-l-violet-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-dark-500/15 bg-dark-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
            <div className="text-center">
              <p className="text-3xl font-extrabold font-heading text-dark-50"><AnimatedCounter end={500} suffix="+" /></p>
              <p className="text-sm text-dark-300 mt-1.5 font-medium">Institutions</p>
            </div>
            <div className="hidden md:block w-px h-10 bg-dark-500/30" />
            <div className="text-center">
              <p className="text-3xl font-extrabold font-heading text-dark-50"><AnimatedCounter end={50000} suffix="+" /></p>
              <p className="text-sm text-dark-300 mt-1.5 font-medium">Students</p>
            </div>
            <div className="hidden md:block w-px h-10 bg-dark-500/30" />
            <div className="text-center">
              <p className="text-3xl font-extrabold font-heading text-dark-50"><AnimatedCounter end={5000} suffix="+" /></p>
              <p className="text-sm text-dark-300 mt-1.5 font-medium">Teachers</p>
            </div>
            <div className="hidden md:block w-px h-10 bg-dark-500/30" />
            <div className="text-center">
              <p className="text-3xl font-extrabold font-heading text-dark-50"><AnimatedCounter end={28} /></p>
              <p className="text-sm text-dark-300 mt-1.5 font-medium">States Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-32" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 mb-4">
              <Zap className="w-3 h-3 text-brand-400" />
              <span className="text-xs font-medium text-brand-300">Powerful Features</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-heading text-dark-50">
              Everything you need to <span className="gradient-text">run an institution</span>
            </h2>
            <p className="mt-4 text-dark-200 leading-relaxed">
              From role management to real-time analytics — Skolar handles it all with a beautiful, intuitive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i} className={`group p-7 rounded-2xl border border-dark-500/25 bg-dark-800/60
                hover:border-brand-500/25 hover:bg-dark-700/60 transition-all duration-300 card-hover stagger-${i + 1}`}>
                <div className="w-12 h-12 rounded-xl gradient-brand-subtle flex items-center justify-center mb-5
                  group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold font-heading text-dark-50 mb-2">{feature.title}</h3>
                <p className="text-sm text-dark-200 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-dark-800/30 border-y border-dark-500/20" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-heading text-dark-50">
              Get started in <span className="gradient-text">3 simple steps</span>
            </h2>
            <p className="mt-4 text-dark-200 leading-relaxed">
              From setup to learning — it takes less than 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-[72px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-[2px] bg-gradient-to-r from-brand-500/50 via-violet-500/50 to-brand-500/50" />

            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-brand text-white
                  font-bold text-lg font-heading mb-6 relative z-10 shadow-glow">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold font-heading text-dark-50 mb-3">{step.title}</h3>
                <p className="text-sm text-dark-200 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-heading text-dark-50">
              Loved by <span className="gradient-text">educators across India</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-dark-500/30 bg-dark-800/50 card-hover">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-dark-200 leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                    {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-50">{t.name}</p>
                    <p className="text-xs text-dark-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Hint */}
      <section className="py-20 bg-dark-800/30 border-y border-dark-500/20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-warning/30 bg-warning/10 mb-4">
            <span className="text-xs font-medium text-warning">Coming Soon</span>
          </div>
          <h2 className="text-3xl font-bold font-heading text-dark-50 mb-4">Pricing that makes sense</h2>
          <p className="text-dark-200 mb-8 leading-relaxed">
            We're crafting flexible plans for schools, colleges, and education groups.
            Join the waitlist to get early-bird pricing.
          </p>
          <div className="inline-flex items-center gap-3">
            <div className="flex -space-x-2">
              {['PS', 'RK', 'AR'].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-white
                  border-2 border-dark-800">{initials}</div>
              ))}
            </div>
            <span className="text-sm text-dark-300">Join 200+ on the waitlist</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 relative">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
          bg-brand-500/10 rounded-full blur-[150px]" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold font-heading text-dark-50 leading-tight">
            Ready to transform your<br /><span className="gradient-text">institution?</span>
          </h2>
          <p className="mt-5 text-lg text-dark-300">
            Start managing your school or college with Skolar today. Free to get started, no credit card required.
          </p>
          <Link to="/signup" className="group inline-flex items-center gap-2 mt-8 px-10 py-4 rounded-xl
            gradient-brand text-white font-semibold text-lg hover:shadow-glow-lg transition-all duration-300">
            Start for Free Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-dark-500/20 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <School className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-heading gradient-text">Skolar</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-dark-300 font-medium">
              <a href="#features" className="hover:text-dark-50 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-dark-50 transition-colors">How it Works</a>
              <a href="#testimonials" className="hover:text-dark-50 transition-colors">Testimonials</a>
              <Link to="/login" className="hover:text-dark-50 transition-colors">Login</Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Globe className="w-4 h-4" />
              <span>Made in India 🇮🇳</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-dark-500/20 text-center text-xs text-dark-500">
            © {new Date().getFullYear()} Skolar. All rights reserved. The Next Era of Learning.
          </div>
        </div>
      </footer>
    </div>
  )
}
