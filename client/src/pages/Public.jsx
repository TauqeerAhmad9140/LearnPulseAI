import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CirclePlay,
  Compass,
  Layers3,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Alert,
  CourseCard,
  Empty,
  Loading,
  PublicHeader,
} from "../components/UI";
import { useAuth } from "../context/Auth";
import { api, messageOf } from "../lib/api";

export function Home() {
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    api
      .get("/courses")
      .then((r) => setCourses(r.data.courses.slice(0, 3)))
      .catch(() => {});
  }, []);
  return (
    <div className="public-site">
      <PublicHeader />
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <Sparkles size={15} /> A smarter way to learn
          </span>
          <h1>
            Make every lesson <em>count.</em>
          </h1>
          <p>
            Learn from focused video chapters, test what you know with
            intelligent quizzes, and watch your progress take shape.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" to="/courses">
              Explore courses <ArrowRight size={18} />
            </Link>
            <Link className="button ghost large" to="/register">
              Create free account <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="hero-social">
            <div className="mini-avatars">
              <span>A</span>
              <span>S</span>
              <span>M</span>
            </div>
            <div>
              <strong>Learn at your own pace</strong>
              <small>One chapter at a time</small>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="glow-one" />
          <div className="visual-panel">
            <div className="panel-heading">
              <span className="panel-icon">
                <BookOpen size={19} />
              </span>
              <span>YOUR LEARNING JOURNEY</span>
              <span className="panel-dots">•••</span>
            </div>
            <div className="visual-title">
              JavaScript Foundations <span>✦</span>
            </div>
            <div className="visual-sub">
              Chapter 01 · Variables and data types
            </div>
            <div className="visual-video">
              <CirclePlay size={53} fill="rgba(255,255,255,.16)" />
              <span>Learn something new today</span>
            </div>
            <div className="visual-progress">
              <div>
                <span>Course progress</span>
                <b>65%</b>
              </div>
              <div className="visual-track">
                <i />
              </div>
            </div>
          </div>
          <div className="float-card float-score">
            <span className="round-icon">
              <Target size={20} />
            </span>
            <div>
              <b>Great work!</b>
              <small>Quiz score · 80%</small>
            </div>
          </div>
          <div className="float-card float-streak">
            <Zap size={18} fill="currentColor" /> Keep growing
          </div>
        </div>
      </section>
      <section className="feature-section">
        <div className="section-heading">
          <span className="eyebrow accent">THE LEARNING LOOP</span>
          <h2>Everything you need to keep moving</h2>
          <p>
            From your first lesson to your next milestone, each step helps you
            learn with purpose.
          </p>
        </div>
        <div className="feature-grid">
          {[
            [
              CirclePlay,
              "Learn by watching",
              "Short, structured video chapters make complex ideas easier to understand.",
            ],
            [
              Sparkles,
              "Test your knowledge",
              "Answer five chapter-based questions and get immediate feedback.",
            ],
            [
              TrendingUp,
              "See your progress",
              "Track completed chapters, scores, and topics to revisit.",
            ],
          ].map(([Icon, title, detail]) => (
            <div className="feature-card" key={title}>
              <span className="feature-icon">
                <Icon size={23} />
              </span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="featured-section">
        <div className="section-heading inline">
          <div>
            <span className="eyebrow accent">START EXPLORING</span>
            <h2>Find your next course</h2>
          </div>
          <Link to="/courses" className="text-link">
            Browse all courses <ArrowRight size={17} />
          </Link>
        </div>
        {courses.length ? (
          <div className="course-grid">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        ) : (
          <div className="preview-note">
            <Compass size={22} /> Courses will appear here as soon as an admin
            publishes them.
          </div>
        )}
      </section>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} LearnPulse AI</span>
        <span>Learn. Test. Grow.</span>
      </footer>
    </div>
  );
}

export function Catalog() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    api
      .get("/courses")
      .then((r) => setCourses(r.data.courses))
      .catch((e) => setError(messageOf(e)));
  }, []);
  const filtered = courses?.filter((c) =>
    `${c.title} ${c.description} ${c.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="public-site">
      <PublicHeader />
      <main className="public-main">
        <div className="catalog-hero">
          <span className="eyebrow accent">EXPLORE THE LIBRARY</span>
          <h1>
            Learn something <em>new.</em>
          </h1>
          <p>
            Choose a course and start building knowledge, one chapter at a time.
          </p>
          <input
            className="search-box"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search courses"
          />
        </div>
        <Alert>{error}</Alert>
        {!courses && !error ? (
          <Loading />
        ) : filtered?.length ? (
          <div className="course-grid">
            {filtered.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        ) : (
          <Empty
            title="No courses found"
            detail={
              courses?.length
                ? "Try another search term."
                : "Published courses will appear here soon."
            }
          />
        )}
      </main>
    </div>
  );
}

export function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get(`/courses/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(messageOf(e)));
  }, [id]);
  return (
    <div className="public-site">
      <PublicHeader />
      <main className="public-main">
        <Alert>{error}</Alert>
        {!data && !error ? (
          <Loading />
        ) : (
          data && (
            <>
              <div className="detail-hero">
                <div>
                  <Link className="back-link" to="/courses">
                    ← All courses
                  </Link>
                  <span className="eyebrow accent">
                    {data.course.category} · {data.course.level}
                  </span>
                  <h1>{data.course.title}</h1>
                  <p>{data.course.description}</p>
                  <div className="detail-meta">
                    <span>
                      <Layers3 size={17} />
                      {data.chapters.length} chapters
                    </span>
                    <span>
                      <CirclePlay size={17} />
                      {data.course.duration}
                    </span>
                  </div>
                  <Link
                    className="button primary large"
                    to={
                      user?.role === "student"
                        ? `/courses/${id}/chapters/${data.chapters[0]?._id}`
                        : "/register"
                    }
                  >
                    {user?.role === "student"
                      ? "Start learning"
                      : "Join to start learning"}{" "}
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="detail-decoration">
                  <div className="detail-circle">
                    <BookOpen size={94} />
                  </div>
                </div>
              </div>
              <section className="curriculum">
                <div className="section-heading">
                  <span className="eyebrow accent">COURSE CONTENT</span>
                  <h2>Your learning path</h2>
                </div>
                <div className="chapter-list">
                  {data.chapters.map((ch, i) => (
                    <Link
                      to={
                        user?.role === "student"
                          ? `/courses/${id}/chapters/${ch._id}`
                          : "/login"
                      }
                      className="chapter-row"
                      key={ch._id}
                    >
                      <span className="chapter-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <strong>{ch.title}</strong>
                        <small>{ch.topics.join(" · ")}</small>
                      </div>
                      <span className="chapter-time">{ch.duration}</span>
                      <ArrowRight size={17} />
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )
        )}
      </main>
    </div>
  );
}

export function AuthPage({ mode }) {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user)
      navigate(user.role === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      });
  }, [user, navigate]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const person =
        mode === "login"
          ? await login(form.email, form.password)
          : await register(form.name, form.email, form.password);
      navigate(person.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="public-site">
      <PublicHeader />
      <div className="auth-layout">
        <div className="auth-art">
          <div className="auth-orb">
            <Sparkles size={88} />
          </div>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>
            Curiosity looks
            <br />
            good on you.
          </h2>
          <p>Make space to learn, practice and see how far you have come.</p>
          <div className="auth-small-card">
            <Check size={18} /> Learn. Test. Grow.
          </div>
        </div>
        <div className="auth-form-wrap">
          <form className="auth-form" onSubmit={submit}>
            <span className="eyebrow accent">
              WELCOME {mode === "login" ? "BACK" : "TO LEARNPULSE"}
            </span>
            <h1>
              {mode === "login"
                ? "Sign in to your space"
                : "Start learning today"}
            </h1>
            <p>
              {mode === "login"
                ? "Continue where you left off."
                : "Create your free account and discover your next skill."}
            </p>
            <Alert>{error}</Alert>
            {mode === "register" && (
              <label>
                Full name
                <input
                  required
                  minLength="2"
                  maxLength="80"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
            )}
            <label>
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                minLength="8"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <button disabled={busy} className="button primary full large">
              {busy
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}{" "}
              <ArrowRight size={18} />
            </button>
            <div className="auth-switch">
              {mode === "login" ? (
                <>
                  New here? <Link to="/register">Create an account</Link>
                </>
              ) : (
                <>
                  Already have an account? <Link to="/login">Sign in</Link>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
