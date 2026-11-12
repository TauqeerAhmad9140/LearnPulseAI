import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CirclePlus,
  Layers3,
  Pencil,
  Plus,
  Save,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Alert, Empty, Loading, PageHeader } from "../components/UI";
import { api, messageOf } from "../lib/api";

const blankCourse = {
  title: "",
  description: "",
  category: "Development",
  level: "Beginner",
  duration: "Self-paced",
  thumbnail: "",
};
const blankChapter = {
  title: "",
  order: 1,
  videoId: "",
  duration: "10 min",
  learningText: "",
  topics: "",
};
const fields = (current, setter, key) => ({
  value: current[key] ?? "",
  onChange: (e) => setter({ ...current, [key]: e.target.value }),
});
export function AdminHome() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/admin/courses")
      .then((r) => setCourses(r.data.courses))
      .catch((e) => setError(messageOf(e)));
  }, []);
  return (
    <>
      <PageHeader
        kicker="ADMIN WORKSPACE"
        title="Build better learning."
        description="Create focused courses and make every chapter count."
        action={
          <Link to="/admin/courses" className="button primary">
            Manage courses <ArrowRight size={17} />
          </Link>
        }
      />
      <Alert>{error}</Alert>
      {!courses && !error ? (
        <Loading />
      ) : (
        courses && (
          <>
            <div className="welcome-banner admin-banner">
              <div>
                <span className="eyebrow">CONTENT STUDIO</span>
                <h2>Turn knowledge into momentum.</h2>
                <p>
                  Shape courses, organize lessons, and give students a clear
                  path forward.
                </p>
                <Link className="button white" to="/admin/courses">
                  Open course manager <ArrowRight size={16} />
                </Link>
              </div>
              <div className="banner-art">
                <div className="banner-ring">
                  <Layers3 size={75} />
                </div>
              </div>
            </div>
            <div className="stats-grid admin-stats">
              {[
                ["Total courses", courses.length],
                [
                  "Published",
                  courses.filter((c) => c.status === "published").length,
                ],
                ["Drafts", courses.filter((c) => c.status === "draft").length],
                [
                  "Archived",
                  courses.filter((c) => c.status === "archived").length,
                ],
              ].map(([label, value]) => (
                <div className="stat-card" key={label}>
                  <span className="stat-icon">
                    <BookOpen size={20} />
                  </span>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="section-title">
              <div>
                <span className="eyebrow accent">RECENT WORK</span>
                <h2>Your courses</h2>
              </div>
              <Link className="text-link" to="/admin/courses">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="panel">
              {courses.slice(0, 5).map((c) => (
                <Link
                  key={c._id}
                  className="admin-course-row"
                  to={`/admin/courses/${c._id}`}
                >
                  <span className="admin-course-icon">
                    <Layers3 size={20} />
                  </span>
                  <div>
                    <strong>{c.title}</strong>
                    <small>
                      {c.category} · Updated{" "}
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </small>
                  </div>
                  <span
                    className={`status-pill ${c.status === "published" ? "done" : ""}`}
                  >
                    {c.status}
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ))}
              {!courses.length && (
                <p className="muted">
                  Create your first course in the course manager.
                </p>
              )}
            </div>
          </>
        )
      )}
    </>
  );
}

export function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api
      .get("/admin/courses")
      .then((r) => setCourses(r.data.courses))
      .catch((e) => setError(messageOf(e)));
  }, []);
  async function create() {
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/admin/courses", {
        title: "Untitled course",
        description: "Describe what students will learn in this course.",
      });
      navigate(`/admin/courses/${data.course._id}`);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeader
        kicker="CONTENT STUDIO"
        title="Manage courses"
        description="Create, edit, publish and archive your learning paths."
        action={
          <button className="button primary" disabled={saving} onClick={create}>
            <Plus size={17} />
            {saving ? "Creating..." : "New course"}
          </button>
        }
      />
      <Alert>{error}</Alert>
      {!courses && !error ? (
        <Loading />
      ) : courses?.length ? (
        <div className="panel">
          {courses.map((c) => (
            <Link
              key={c._id}
              className="admin-course-row"
              to={`/admin/courses/${c._id}`}
            >
              <span className="admin-course-icon">
                <Layers3 size={20} />
              </span>
              <div>
                <strong>{c.title}</strong>
                <small>
                  {c.category} · {c.level} · Updated{" "}
                  {new Date(c.updatedAt).toLocaleDateString()}
                </small>
              </div>
              <span
                className={`status-pill ${c.status === "published" ? "done" : ""}`}
              >
                {c.status}
              </span>
              <ArrowRight size={17} />
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="No courses yet"
          detail="Use New course to start building a learning path."
        />
      )}
    </>
  );
}

export function AdminEditor() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapterForm, setChapterForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  async function load() {
    try {
      const { data } = await api.get(`/admin/courses/${id}`);
      setCourse(data.course);
      setChapters(data.chapters);
    } catch (e) {
      setError(messageOf(e));
    }
  }
  useEffect(() => {
    load();
  }, [id]);
  function startChapter(chapter) {
    setEditingId(chapter?._id || null);
    setChapterForm(
      chapter
        ? {
            ...chapter,
            topics: chapter.topics.join(", "),
            videoId: chapter.videoId,
          }
        : {
            ...blankChapter,
            order: chapters.length
              ? Math.max(...chapters.map((ch) => ch.order)) + 1
              : 1,
          },
    );
    setError("");
    setNotice("");
  }
  async function saveCourse(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(`/admin/courses/${id}`, course);
      setCourse(data.course);
      setNotice("Course details saved.");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }
  async function saveChapter(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...chapterForm,
        order: Number(chapterForm.order),
        topics: chapterForm.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (editingId) await api.put(`/admin/chapters/${editingId}`, payload);
      else await api.post(`/admin/courses/${id}/chapters`, payload);
      setChapterForm(null);
      setEditingId(null);
      setNotice("Chapter saved.");
      await load();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }
  async function status(next) {
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch(`/admin/courses/${id}/status`, {
        status: next,
      });
      setCourse(data.course);
      setNotice(`Course ${next}.`);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }
  async function archiveChapter(ch) {
    if (
      !window.confirm(
        `Archive “${ch.title}”? Previous quiz results will remain available.`,
      )
    )
      return;
    try {
      await api.delete(`/admin/chapters/${ch._id}`);
      setNotice("Chapter archived.");
      await load();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  if (!course) return error ? <Alert>{error}</Alert> : <Loading />;
  return (
    <>
      <Link className="back-link" to="/admin/courses">
        <ArrowLeft size={16} /> All courses
      </Link>
      <PageHeader
        kicker="COURSE EDITOR"
        title={course.title}
        description="Edit course details, arrange chapters, and publish when you’re ready."
        action={
          <span
            className={`status-pill ${course.status === "published" ? "done" : ""}`}
          >
            {course.status}
          </span>
        }
      />
      <Alert>{error}</Alert>
      {notice && (
        <div className="notice" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      <div className="editor-layout">
        <div>
          <form className="panel editor-form" onSubmit={saveCourse}>
            <div className="panel-title">
              <h2>Course details</h2>
              <BookOpen size={20} />
            </div>
            <div className="form-grid">
              <label className="span-2">
                Title
                <input
                  required
                  maxLength="120"
                  {...fields(course, setCourse, "title")}
                />
              </label>
              <label>
                Category
                <input
                  maxLength="40"
                  {...fields(course, setCourse, "category")}
                />
              </label>
              <label>
                Level
                <select {...fields(course, setCourse, "level")}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
              <label>
                Duration label
                <input
                  maxLength="40"
                  placeholder="e.g. 2 hours"
                  {...fields(course, setCourse, "duration")}
                />
              </label>
              <label>
                Thumbnail URL (optional)
                <input
                  type="url"
                  placeholder="https://..."
                  {...fields(course, setCourse, "thumbnail")}
                />
              </label>
              <label className="span-2">
                Description
                <textarea
                  required
                  rows="4"
                  maxLength="2000"
                  {...fields(course, setCourse, "description")}
                />
              </label>
            </div>
            <button className="button primary" disabled={saving}>
              <Save size={17} /> Save course
            </button>
          </form>
          <div className="panel editor-form">
            <div className="panel-title">
              <div>
                <h2>Chapters</h2>
                <p>
                  Give each chapter a video, lesson notes, and topic labels.
                </p>
              </div>
              <button
                className="button soft"
                onClick={() => startChapter(null)}
              >
                <Plus size={16} /> Add chapter
              </button>
            </div>
            {chapters.length ? (
              <div className="editor-chapters">
                {chapters.map((ch) => (
                  <div className="admin-course-row" key={ch._id}>
                    <span className="chapter-num">
                      {String(ch.order).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{ch.title}</strong>
                      <small>
                        {ch.topics.join(" · ")} · Version {ch.contentVersion}
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => startChapter(ch)}
                      aria-label={`Edit ${ch.title}`}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => archiveChapter(ch)}
                      aria-label={`Archive ${ch.title}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                No chapters yet. Add one before publishing.
              </p>
            )}
          </div>
          {chapterForm && (
            <form
              className="panel editor-form chapter-form"
              onSubmit={saveChapter}
            >
              <div className="panel-title">
                <h2>{editingId ? "Edit chapter" : "New chapter"}</h2>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setChapterForm(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="form-grid">
                <label className="span-2">
                  Chapter title
                  <input
                    required
                    maxLength="120"
                    {...fields(chapterForm, setChapterForm, "title")}
                  />
                </label>
                <label>
                  Order
                  <input
                    required
                    type="number"
                    min="1"
                    {...fields(chapterForm, setChapterForm, "order")}
                  />
                </label>
                <label>
                  Duration label
                  <input
                    maxLength="40"
                    {...fields(chapterForm, setChapterForm, "duration")}
                  />
                </label>
                <label className="span-2">
                  YouTube link or video ID
                  <input
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    {...fields(chapterForm, setChapterForm, "videoId")}
                  />
                </label>
                <label className="span-2">
                  Topic labels, separated by commas
                  <input
                    required
                    placeholder="Variables, Data types"
                    {...fields(chapterForm, setChapterForm, "topics")}
                  />
                </label>
                <label className="span-2">
                  Lesson text / transcript
                  <textarea
                    required
                    minLength="60"
                    maxLength="20000"
                    rows="9"
                    placeholder="Write the actual lesson content that the AI will use to create the quiz..."
                    {...fields(chapterForm, setChapterForm, "learningText")}
                  />
                  <small>
                    At least 60 characters. The AI uses this text to ground its
                    questions.
                  </small>
                </label>
              </div>
              <button className="button primary" disabled={saving}>
                <Save size={17} /> Save chapter
              </button>
            </form>
          )}
        </div>
        <aside className="panel publish-panel">
          <span className="eyebrow accent">PUBLISHING</span>
          <h2>Ready to share?</h2>
          <p>
            Students can view published courses and take chapter quizzes. Drafts
            stay in the admin workspace.
          </p>
          <div className="publish-check">
            <Check size={17} /> At least one complete chapter
          </div>
          <div className="publish-check">
            <Check size={17} /> Video and lesson notes
          </div>
          <div className="publish-check">
            <Check size={17} /> Topic labels for quiz feedback
          </div>
          {course.status !== "published" && (
            <button
              className="button primary full"
              disabled={saving}
              onClick={() => status("published")}
            >
              Publish course <ArrowRight size={16} />
            </button>
          )}
          {course.status === "published" && (
            <button
              className="button soft full"
              disabled={saving}
              onClick={() => status("draft")}
            >
              Move to draft
            </button>
          )}
          {course.status !== "archived" && (
            <button
              className="button ghost full"
              disabled={saving}
              onClick={() => status("archived")}
            >
              Archive course
            </button>
          )}
          {course.status === "published" && (
            <Link className="text-link" to={`/courses/${id}`}>
              View public course <ArrowRight size={15} />
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
