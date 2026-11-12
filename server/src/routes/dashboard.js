import { Router } from 'express';
import { Chapter, Course, QuizAttempt, StudentProgress } from '../models/index.js';
import { asyncRoute, authenticate, studentOnly } from '../middleware/http.js';

const router = Router();
router.get('/', authenticate, studentOnly, asyncRoute(async (req, res) => {
  const [progress, attempts] = await Promise.all([
    StudentProgress.find({ student: req.user._id }).sort({ completedAt: -1 }).lean(),
    QuizAttempt.find({ student: req.user._id }).sort({ createdAt: -1 }).select('-answers').populate('course', 'title').populate('chapter', 'title').lean(),
  ]);
  const courseIds = [...new Set(progress.map(p => String(p.course)))];
  const [courses, chapters] = await Promise.all([Course.find({ _id: { $in: courseIds }, status: 'published' }).lean(), Chapter.find({ course: { $in: courseIds }, archived: false }).select('course').lean()]);
  const byCourse = courses.map(course => {
    const total = chapters.filter(ch => String(ch.course) === String(course._id)).length;
    const visible = new Set(chapters.filter(ch => String(ch.course) === String(course._id)).map(ch => String(ch._id)));
    const completed = progress.filter(p => String(p.course) === String(course._id) && visible.has(String(p.chapter))).length;
    return { id: course._id, title: course.title, thumbnail: course.thumbnail, completed, total, percentage: total ? Math.round(completed / total * 100) : 0 };
  });
  const latestByChapter = new Map();
  for (const attempt of attempts) if (!latestByChapter.has(String(attempt.chapter?._id || attempt.chapter))) latestByChapter.set(String(attempt.chapter?._id || attempt.chapter), attempt);
  const weakTopics = [...new Set([...latestByChapter.values()].flatMap(a => a.weakTopics))].slice(0, 8);
  res.json({ stats: { coursesStarted: byCourse.length, completedChapters: progress.length, quizzesTaken: attempts.length, averageScore: attempts.length ? Math.round(attempts.reduce((n, a) => n + a.percentage, 0) / attempts.length) : 0 }, courses: byCourse, recentAttempts: attempts.slice(0, 5), weakTopics });
}));
export default router;
