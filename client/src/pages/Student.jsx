import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  ClipboardList,
  Flame,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Alert,
  CourseCard,
  Empty,
  Loading,
  PageHeader,
  ProgressBar,
} from "../components/UI";
import { api, messageOf, videoUrl } from "../lib/api";
import { useAuth } from "../context/Auth";

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data))
      .catch((e) => setError(messageOf(e)));
  }, []);
  return (
    <>
      <PageHeader
        kicker="YOUR DASHBOARD"
        title={`Keep it going, ${user?.name?.split(" ")[0]} 👋`}
        description="Your next breakthrough starts with one chapter."
        action={
          <Link className="button primary" to="/courses">
            Explore courses <ArrowRight size={16} />
          </Link>
        }
      />
      <Alert>{error}</Alert>
      {!data && !error ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="welcome-banner">
              <div>
                <span className="eyebrow">A LITTLE PROGRESS EVERY DAY</span>
                <h2>Learning looks good on you.</h2>
                <p>Pick up where you left off or discover something new.</p>
                <Link to="/courses" className="button white">
                  Find a course <ArrowRight size={17} />
                </Link>
              </div>
              <div className="banner-art">
                <div className="banner-ring">
                  <GraduationCap size={72} />
                </div>
                <span className="banner-star">✦</span>
              </div>
            </div>
            <div className="stats-grid">
              {[
                [BookOpen, "Courses started", data.stats.coursesStarted],
                [
                  CheckCircle2,
                  "Chapters completed",
                  data.stats.completedChapters,
                ],
                [ClipboardList, "Quizzes taken", data.stats.quizzesTaken],
                [Target, "Average score", `${data.stats.averageScore}%`],
              ].map(([Icon, label, value]) => (
                <div className="stat-card" key={label}>
                  <span className="stat-icon">
                    <Icon size={21} />
                  </span>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="section-title">
              <div>
                <span className="eyebrow accent">PICK UP THE THREAD</span>
                <h2>My courses</h2>
              </div>
              <Link to="/courses" className="text-link">
                View courses <ArrowRight size={16} />
              </Link>
            </div>
            {data.courses.length ? (
              <div className="course-grid dashboard-courses">
                {data.courses.map((c) => (
                  <CourseCard key={c.id} course={c} progress={c} />
                ))}
              </div>
            ) : (
              <Empty
                title="Your learning journey starts here"
                detail="Choose a course, watch your first chapter, and your progress will appear here."
                action="Browse courses"
                to="/courses"
              />
            )}
            <div className="dashboard-bottom">
              <div className="panel">
                <div className="panel-title">
                  <h2>Recent quizzes</h2>
                  <Link to="/history">
                    View all <ArrowRight size={15} />
                  </Link>
                </div>
                {data.recentAttempts.length ? (
                  data.recentAttempts.map((a) => (
                    <Link
                      key={a._id}
                      to={`/results/${a._id}`}
                      className="attempt-row"
                    >
                      <span className="attempt-symbol">
                        <ClipboardList size={19} />
                      </span>
                      <div>
                        <strong>{a.chapter?.title || "Chapter"}</strong>
                        <small>
                          {a.course?.title || "Archived course"} ·{" "}
                          {new Date(a.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <b>{a.percentage}%</b>
                    </Link>
                  ))
                ) : (
                  <p className="muted">
                    Results will show up after your first quiz.
                  </p>
                )}
              </div>
              <div className="panel">
                <div className="panel-title">
                  <h2>Topics to revisit</h2>
                  <Lightbulb size={20} />
                </div>
                {data.weakTopics.length ? (
                  <div className="topic-list">
                    {data.weakTopics.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                ) : (
                  <div className="no-topics">
                    <Sparkles size={31} />
                    <strong>Ready when you are</strong>
                    <p>Quiz feedback will help you focus your revision.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      )}
    </>
  );
}

export function Lesson() {
  const { courseId, chapterId } = useParams();
  const [data, setData] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setData(null);
    setError("");
    Promise.all([
      api.get(`/courses/${courseId}/chapters/${chapterId}`),
      api.get(`/courses/${courseId}`),
    ])
      .then(([a, b]) => {
        setData(a.data);
        setChapters(b.data.chapters);
      })
      .catch((e) => setError(messageOf(e)));
  }, [courseId, chapterId]);
  async function complete() {
    setBusy(true);
    setError("");
    try {
      await api.put(`/courses/${courseId}/chapters/${chapterId}/completion`);
      setData((d) => ({ ...d, completed: true }));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  const index = chapters.findIndex((ch) => ch._id === chapterId);
  return (
    <>
      <Alert>{error}</Alert>
      {!data && !error ? (
        <Loading />
      ) : (
        data && (
          <>
            <Link className="back-link" to={`/courses/${courseId}`}>
              <ArrowLeft size={16} /> Back to course
            </Link>
            <div className="lesson-heading">
              <div>
                <span className="eyebrow accent">
                  {data.course.title} · CHAPTER {index + 1}
                </span>
                <h1>{data.chapter.title}</h1>
                <p>
                  Watch the lesson, review your notes, and test your
                  understanding.
                </p>
              </div>
              <span className={`status-pill ${data.completed ? "done" : ""}`}>
                {data.completed ? "✓ Completed" : "In progress"}
              </span>
            </div>
            <div className="lesson-layout">
              <div>
                <div className="video-frame">
                  <iframe
                    src={videoUrl(data.chapter.videoId)}
                    title={data.chapter.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="panel lesson-notes">
                  <span className="eyebrow accent">CHAPTER NOTES</span>
                  <h2>What you’ll learn</h2>
                  <p>{data.chapter.learningText}</p>
                  <h3>Topics covered</h3>
                  <div className="topic-list">
                    {data.chapter.topics.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="lesson-actions">
                  {!data.completed ? (
                    <button
                      className="button primary large"
                      disabled={busy}
                      onClick={complete}
                    >
                      <Check size={18} />
                      {busy ? "Saving..." : "Mark chapter complete"}
                    </button>
                  ) : (
                    <Link
                      className="button primary large"
                      to={`/chapters/${chapterId}/quiz`}
                    >
                      <Sparkles size={18} /> Take chapter quiz
                    </Link>
                  )}
                  {index > 0 && (
                    <Link
                      className="button ghost"
                      to={`/courses/${courseId}/chapters/${chapters[index - 1]._id}`}
                    >
                      <ChevronLeft size={16} /> Previous
                    </Link>
                  )}
                  {index >= 0 && index < chapters.length - 1 && (
                    <Link
                      className="button ghost"
                      to={`/courses/${courseId}/chapters/${chapters[index + 1]._id}`}
                    >
                      Next chapter <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
              <aside className="panel lesson-sidebar">
                <span className="eyebrow accent">IN THIS COURSE</span>
                <h3>{data.course.title}</h3>
                <div className="sidebar-chapters">
                  {chapters.map((ch, i) => (
                    <Link
                      className={ch._id === chapterId ? "selected" : ""}
                      to={`/courses/${courseId}/chapters/${ch._id}`}
                      key={ch._id}
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{ch.title}</strong>
                        <small>{ch.duration}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </>
        )
      )}
    </>
  );
}

export function QuizPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [position, setPosition] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/quizzes/chapter/${chapterId}`);
      setQuiz(data.quiz);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [chapterId]);
  async function submit() {
    if (Object.keys(answers).length !== 5) {
      setError("Answer all five questions before submitting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const key = `lp-submit-${quiz.id}`;
      let requestId = sessionStorage.getItem(key);
      if (!requestId) {
        requestId = crypto.randomUUID();
        sessionStorage.setItem(key, requestId);
      }
      const { data } = await api.post(`/quizzes/${quiz.id}/attempts`, {
        requestId,
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedIndex: answers[q.id],
        })),
      });
      sessionStorage.removeItem(key);
      navigate(`/results/${data.attempt._id}`, { replace: true });
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading label="Preparing your chapter quiz..." />;
  if (!quiz)
    return (
      <div className="panel quiz-error">
        <Alert>{error}</Alert>
        <button className="button primary" onClick={load}>
          Try again
        </button>
      </div>
    );
  const q = quiz.questions[position];
  return (
    <div className="quiz-shell">
      <span className="eyebrow accent">CHAPTER KNOWLEDGE CHECK</span>
      <h1>Let’s see what stuck.</h1>
      <p>
        Five questions based on <strong>{quiz.title}</strong>. Take your time.
      </p>
      <div className="quiz-main">
        <div className="quiz-meta">
          <span>QUESTION {position + 1} OF 5</span>
          <span>{Object.keys(answers).length}/5 answered</span>
        </div>
        <ProgressBar value={(position + 1) * 20} />
        <div className="quiz-card">
          <span className="question-topic">{q.topic}</span>
          <h2>{q.text}</h2>
          <div className="options">
            {q.options.map((option, i) => (
              <button
                key={i}
                className={`option ${answers[q.id] === i ? "chosen" : ""}`}
                onClick={() => {
                  setAnswers({ ...answers, [q.id]: i });
                  setError("");
                }}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
                {answers[q.id] === i && <Check size={18} />}
              </button>
            ))}
          </div>
        </div>
        <Alert>{error}</Alert>
        <div className="quiz-controls">
          <button
            className="button ghost"
            disabled={!position}
            onClick={() => setPosition(position - 1)}
          >
            <ChevronLeft size={17} /> Previous
          </button>
          {position < 4 ? (
            <button
              className="button primary"
              onClick={() => setPosition(position + 1)}
            >
              Next question <ChevronRight size={17} />
            </button>
          ) : (
            <button className="button primary" disabled={busy} onClick={submit}>
              {busy ? "Submitting..." : "Submit answers"}{" "}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
        <div className="question-dots">
          {quiz.questions.map((item, i) => (
            <button
              key={item.id}
              aria-label={`Question ${i + 1}`}
              onClick={() => setPosition(i)}
              className={`${i === position ? "current" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Result() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get(`/quizzes/attempts/${id}`)
      .then((r) => setAttempt(r.data.attempt))
      .catch((e) => setError(messageOf(e)));
  }, [id]);
  if (!attempt) return error ? <Alert>{error}</Alert> : <Loading />;
  return (
    <div className="result-wrap">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={16} /> Dashboard
      </Link>
      <div className="result-hero">
        <div className="result-burst">✦</div>
        <span className="eyebrow">QUIZ COMPLETE</span>
        <h1>Another step forward!</h1>
        <p>
          You got {attempt.score} out of {attempt.total} questions right in{" "}
          {attempt.chapter?.title || "this chapter"}.
        </p>
        <div className="result-score">
          {attempt.percentage}
          <span>%</span>
        </div>
        <strong>
          {attempt.percentage >= 80
            ? "Excellent work!"
            : attempt.percentage >= 60
              ? "Nice progress!"
              : "Keep practicing!"}
        </strong>
      </div>
      <div className="result-summary">
        <div className="panel">
          <span className="eyebrow accent">YOUR SCORE</span>
          <h2>
            {attempt.score} / {attempt.total} correct
          </h2>
          <p>Every attempt is a chance to learn.</p>
        </div>
        <div className="panel">
          <span className="eyebrow accent">TOPICS TO REVISIT</span>
          {attempt.weakTopics.length ? (
            <div className="topic-list">
              {attempt.weakTopics.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          ) : (
            <h2>All clear! ✨</h2>
          )}
          <p>Based on this quiz attempt.</p>
        </div>
      </div>
      <h2 className="review-heading">Review your answers</h2>
      <div className="review-list">
        {attempt.answers.map((a, i) => (
          <div className="review-card" key={i}>
            <span
              className={`review-mark ${a.isCorrect ? "correct" : "incorrect"}`}
            >
              {a.isCorrect ? <Check size={18} /> : "×"}
            </span>
            <div>
              <span className="eyebrow">
                QUESTION {i + 1} · {a.topic}
              </span>
              <h3>{a.text}</h3>
              <p>
                Your answer: <strong>{a.options[a.selectedIndex]}</strong>
              </p>
              {!a.isCorrect && (
                <p>
                  Correct answer: <strong>{a.options[a.correctIndex]}</strong>
                </p>
              )}
              <p className="explanation">{a.explanation}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="lesson-actions">
        <Link className="button primary" to="/dashboard">
          Back to dashboard <ArrowRight size={17} />
        </Link>
        <Link className="button ghost" to="/courses">
          Explore courses
        </Link>
      </div>
    </div>
  );
}

export function History() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    api
      .get(`/quizzes/attempts?page=${page}`)
      .then((r) => {
        setItems((old) =>
          page === 1 ? r.data.attempts : [...old, ...r.data.attempts],
        );
        setHasMore(r.data.hasMore);
      })
      .catch((e) => setError(messageOf(e)))
      .finally(() => setLoading(false));
  }, [page]);
  return (
    <>
      <PageHeader
        kicker="YOUR PROGRESS"
        title="Quiz history"
        description="A record of what you’ve learned and where you can grow."
      />
      <Alert>{error}</Alert>
      {items.length ? (
        <div className="panel history-panel">
          {items.map((a) => (
            <Link className="attempt-row" key={a._id} to={`/results/${a._id}`}>
              <span className="attempt-symbol">
                <ClipboardList size={20} />
              </span>
              <div>
                <strong>{a.chapter?.title || "Archived chapter"}</strong>
                <small>
                  {a.course?.title || "Archived course"} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </small>
              </div>
              <b>{a.percentage}%</b>
              <ArrowRight size={16} />
            </Link>
          ))}
          {hasMore && (
            <button
              disabled={loading}
              className="button ghost history-more"
              onClick={() => setPage(page + 1)}
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      ) : loading ? (
        <Loading />
      ) : (
        <Empty
          title="No quiz attempts yet"
          detail="Finish a chapter and take its quiz to see results here."
          to="/courses"
        />
      )}
    </>
  );
}
