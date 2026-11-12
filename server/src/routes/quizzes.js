import { Router } from 'express';
import { Chapter, Course, Question, Quiz, QuizAttempt, StudentProgress } from '../models/index.js';
import { asyncRoute, authenticate, studentOnly, HttpError, parseId } from '../middleware/http.js';
import { generateQuestions } from '../services/ai.js';
import { gradeQuiz, publicQuestion } from '../services/quiz.js';

const router = Router();
router.use(authenticate, studentOnly);

async function eligibleChapter(id, studentId) {
  const chapter = await Chapter.findOne({ _id: parseId(id), archived: false });
  const course = chapter && await Course.findOne({ _id: chapter.course, status: 'published' });
  if (!chapter || !course) throw new HttpError(404, 'Chapter not found');
  if (!await StudentProgress.exists({ student: studentId, chapter: chapter._id })) throw new HttpError(403, 'Complete this chapter before taking the quiz');
  return { chapter, course };
}
router.get('/chapter/:chapterId', asyncRoute(async (req, res) => {
  const { chapter } = await eligibleChapter(req.params.chapterId, req.user._id);
  let quiz = await Quiz.findOne({ chapter: chapter._id, contentVersion: chapter.contentVersion });
  // Reclaim abandoned reservations after a server restart or a failed worker.
  if (quiz?.status === 'generating' && quiz.createdAt.getTime() < Date.now() - 60000) {
    const removed = await Quiz.deleteOne({ _id: quiz._id, status: 'generating', createdAt: quiz.createdAt });
    if (removed.deletedCount) await Question.deleteMany({ quiz: quiz._id });
    quiz = await Quiz.findOne({ chapter: chapter._id, contentVersion: chapter.contentVersion });
  }
  let reservedHere = false;
  if (!quiz) {
    // Reserve the quiz before calling a metered external service.
    try { quiz = await Quiz.create({ chapter: chapter._id, contentVersion: chapter.contentVersion, status: 'generating' }); reservedHere = true; }
    catch (error) { if (error.code !== 11000) throw error; quiz = await Quiz.findOne({ chapter: chapter._id, contentVersion: chapter.contentVersion }); }
    if (reservedHere) {
      try {
        const generated = await generateQuestions(chapter);
        await Question.insertMany(generated.map(q => ({ ...q, quiz: quiz._id })), { ordered: true });
        quiz.status = 'ready';
        await quiz.save();
      } catch (error) {
        await Question.deleteMany({ quiz: quiz._id });
        await Quiz.deleteOne({ _id: quiz._id, status: 'generating' });
        throw error;
      }
    }
  }
  if (quiz.status !== 'ready') throw new HttpError(503, 'Quiz is being prepared. Try again shortly.');
  const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 });
  if (questions.length !== 5) throw new HttpError(503, 'Quiz is temporarily unavailable');
  res.json({ quiz: { id: String(quiz._id), chapterId: String(chapter._id), title: chapter.title, questions: questions.map(publicQuestion) } });
}));
router.post('/:quizId/attempts', asyncRoute(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: parseId(req.params.quizId), status: 'ready' });
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  const { chapter, course } = await eligibleChapter(String(quiz.chapter), req.user._id);
  if (quiz.contentVersion !== chapter.contentVersion) throw new HttpError(409, 'This chapter changed. Reload the current quiz.');
  const requestId = req.body.requestId;
  if (typeof requestId !== 'string' || !/^[\w-]{8,80}$/.test(requestId)) throw new HttpError(400, 'Invalid submission ID');
  const previous = await QuizAttempt.findOne({ student: req.user._id, requestId });
  if (previous) {
    if (String(previous.quiz) !== String(quiz._id)) throw new HttpError(409, 'Submission ID was already used');
    return res.json({ attempt: previous });
  }
  const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 });
  const result = gradeQuiz(questions, req.body.answers);
  try {
    const attempt = await QuizAttempt.create({ ...result, student: req.user._id, course: course._id, chapter: chapter._id, quiz: quiz._id, requestId });
    res.status(201).json({ attempt });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await QuizAttempt.findOne({ student: req.user._id, requestId });
    if (!existing || String(existing.quiz) !== String(quiz._id)) throw new HttpError(409, 'Submission ID was already used');
    res.json({ attempt: existing });
  }
}));
router.get('/attempts', asyncRoute(async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const attempts = await QuizAttempt.find({ student: req.user._id }).select('-answers').sort({ createdAt: -1 }).skip((page - 1) * 10).limit(10).populate('course', 'title').populate('chapter', 'title').lean();
  res.json({ attempts, page, hasMore: attempts.length === 10 });
}));
router.get('/attempts/:id', asyncRoute(async (req, res) => {
  const attempt = await QuizAttempt.findOne({ _id: parseId(req.params.id), student: req.user._id }).populate('course', 'title').populate('chapter', 'title');
  if (!attempt) throw new HttpError(404, 'Result not found');
  res.json({ attempt });
}));
export default router;
