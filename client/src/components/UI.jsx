import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardList,
  Compass,
  GraduationCap,
  Layers3,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/Auth";

export function Loading({ label = "Preparing your space..." }) {
  return (
    <div className="page-loading">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
export function Alert({ children }) {
  return children ? (
    <div className="alert" role="alert">
      {children}
    </div>
  ) : null;
}
export function Empty({ title, detail, action, to }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <BookOpen size={24} />
      </div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {to && (
        <Link className="button primary" to={to}>
          {action || "Explore courses"} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function CourseCard({ course, progress }) {
  return (
    <Link className="course-card" to={`/courses/${course._id || course.id}`}>
      <div className="course-cover">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" />
        ) : (
          <div className="cover-art">
            <Layers3 size={54} />
            <span className="orbit orbit-a" />
            <span className="orbit orbit-b" />
          </div>
        )}
        <span className="cover-pill">{course.category || "Development"}</span>
      </div>
      <div className="course-card-body">
        <span className="eyebrow">
          {course.level || "COURSE"} ·{" "}
          {course.chapterCount || course.total || 0} CHAPTERS
        </span>
        <h3>{course.title}</h3>
        <p>{course.description || "Continue your learning journey."}</p>
        {progress ? (
          <div className="course-progress">
            <div>
              <strong>{progress.percentage}% complete</strong>
              <small>
                {progress.completed}/{progress.total} chapters
              </small>
            </div>
            <ProgressBar value={progress.percentage} />
          </div>
        ) : (
          <div className="card-bottom">
            <span>{course.duration || "Self-paced"}</span>
            <ArrowRight size={18} />
          </div>
        )}
      </div>
    </Link>
  );
}

const studentNav = [
  { to: "/dashboard", icon: ChartNoAxesCombined, label: "Overview" },
  { to: "/courses", icon: Compass, label: "Explore courses" },
  { to: "/history", icon: ClipboardList, label: "Quiz history" },
];
const adminNav = [
  { to: "/admin", icon: ChartNoAxesCombined, label: "Overview" },
  { to: "/admin/courses", icon: Layers3, label: "Manage courses" },
];
export function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = user?.role === "admin" ? adminNav : studentNav;
  async function signOut() {
    await logout();
    navigate("/");
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-icon">
            <GraduationCap size={22} />
          </span>
          <span>
            LearnPulse <b>AI</b>
          </span>
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              end={to === "/dashboard" || to === "/admin"}
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `side-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <Sparkles size={18} />
            <strong>Small steps. Big progress.</strong>
            <span>Learn a chapter, test yourself, keep growing.</span>
          </div>
          <button className="side-link signout" onClick={signOut}>
            <LogOut size={19} /> Sign out
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="mobile-overlay"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className="shell-main">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
          >
            {open ? <X /> : <Menu />}
          </button>
          <span className="topbar-caption">
            {user?.role === "admin" ? "ADMIN WORKSPACE" : "YOUR LEARNING SPACE"}
          </span>
          <div className="user-badge">
            <span className="avatar">
              {user?.name?.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export function Protected({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role)
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />
    );
  return <Outlet />;
}
export function PageHeader({ kicker, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow accent">{kicker}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function PublicHeader() {
  const { user } = useAuth();
  return (
    <header className="public-header">
      <Link to="/" className="brand">
        <span className="brand-icon">
          <GraduationCap size={22} />
        </span>
        <span>
          LearnPulse <b>AI</b>
        </span>
      </Link>
      <nav>
        <Link to="/courses">Courses</Link>
        <Link
          to={
            user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"
          }
          className="button primary small"
        >
          {user ? "My workspace" : "Get started"} <ArrowRight size={16} />
        </Link>
      </nav>
    </header>
  );
}
