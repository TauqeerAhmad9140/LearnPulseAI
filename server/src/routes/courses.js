import { Router } from 'express';
import { Chapter, Course, StudentProgress } from '../models/index.js';
import { asyncRoute, authenticate, studentOnly, parseId, HttpError } from '../middleware/http.js';

const router = Router();
router.get('/', asyncRoute(async (req, res) => {
  const courses = await Course.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
  const counts = await Chapter.aggregate([{ $match: { archived: false } }, { $group: { _id: '$course', count: { $sum: 1 } } }]);
  const byId = new Map(counts.map(c => [String(c._id), c.count]));
  res.json({ courses: courses.map(c => ({ ...c, chapterCount: byId.get(String(c._id)) || 0 })) });
}));
router.get('/:id', asyncRoute(async (req, res) => {
  const course = await Course.findOne({ _id: parseId(req.params.id), status: 'published' }).lean();
  if (!course) throw new HttpError(404, 'Course not found');
  const chapters = await Chapter.find({ course: course._id, archived: false }).select('title order duration topics').sort({ order: 1 }).lean();
  res.json({ course, chapters });
}));
router.get('/:id/chapters/:chapterId', authenticate, studentOnly, asyncRoute(async (req, res) => {
  const course = await Course.findOne({ _id: parseId(req.params.id), status: 'published' });
  const chapter = course && await Chapter.findOne({ _id: parseId(req.params.chapterId), course: course._id, archived: false });
  if (!chapter) throw new HttpError(404, 'Chapter not found');
  const progress = await StudentProgress.findOne({ student: req.user._id, chapter: chapter._id });
  res.json({ course: { _id: course._id, title: course.title }, chapter, completed: Boolean(progress) });
}));
router.put('/:id/chapters/:chapterId/completion', authenticate, studentOnly, asyncRoute(async (req, res) => {
  const course = await Course.findOne({ _id: parseId(req.params.id), status: 'published' });
  const chapter = course && await Chapter.findOne({ _id: parseId(req.params.chapterId), course: course._id, archived: false });
  if (!chapter) throw new HttpError(404, 'Chapter not found');
  const progress = await StudentProgress.findOneAndUpdate({ student: req.user._id, chapter: chapter._id },
    { $setOnInsert: { student: req.user._id, course: course._id, chapter: chapter._id, completedAt: new Date() } }, { new: true, upsert: true });
  res.json({ progress });
}));
export default router;
