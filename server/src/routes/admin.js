import { Router } from "express";
import { Chapter, Course } from "../models/index.js";
import {
  adminOnly,
  asyncRoute,
  authenticate,
  HttpError,
  parseId,
  requireFields,
} from "../middleware/http.js";

const router = Router();
router.use(authenticate, adminOnly);
function courseInput(body) {
  requireFields(body, ["title", "description"]);
  if (body.title.length > 120 || body.description.length > 2000)
    throw new HttpError(400, "Course text is too long");
  if (body.thumbnail && !/^https?:\/\//.test(body.thumbnail))
    throw new HttpError(400, "Thumbnail must be an http(s) URL");
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    category: String(body.category || "Development")
      .trim()
      .slice(0, 40),
    thumbnail: body.thumbnail || "",
    level: ["Beginner", "Intermediate", "Advanced"].includes(body.level)
      ? body.level
      : "Beginner",
    duration: String(body.duration || "Self-paced").slice(0, 40),
  };
}
function videoId(value) {
  try {
    const url = new URL(value);
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    )
      return (
        url.searchParams.get("v") ||
        url.pathname.split("/").filter(Boolean).pop()
      );
    if (["youtu.be", "www.youtu.be"].includes(url.hostname))
      return url.pathname.slice(1).split("/")[0];
  } catch {
    /* plain ID below */
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  throw new HttpError(400, "Enter a valid YouTube URL or video ID");
}
function chapterInput(body) {
  requireFields(body, ["title", "videoId", "learningText"]);
  const topics = Array.isArray(body.topics)
    ? [...new Set(body.topics.map((v) => String(v).trim()).filter(Boolean))]
    : [];
  if (
    body.title.length > 120 ||
    body.learningText.trim().length < 60 ||
    body.learningText.length > 20000 ||
    topics.length < 1 ||
    topics.length > 10 ||
    topics.some((t) => t.length > 60)
  )
    throw new HttpError(
      400,
      "Add a title, at least 60 characters of lesson notes, and 1–10 topics",
    );
  const order = Number(body.order);
  if (!Number.isInteger(order) || order < 1)
    throw new HttpError(400, "Chapter order must be a positive number");
  return {
    title: body.title.trim(),
    videoId: videoId(body.videoId.trim()),
    learningText: body.learningText.trim(),
    topics,
    order,
    duration: String(body.duration || "10 min").slice(0, 40),
  };
}
router.get(
  "/courses",
  asyncRoute(async (_req, res) =>
    res.json({ courses: await Course.find().sort({ createdAt: -1 }).lean() }),
  ),
);
router.post(
  "/courses",
  asyncRoute(async (req, res) =>
    res
      .status(201)
      .json({
        course: await Course.create({
          ...courseInput(req.body),
          createdBy: req.user._id,
        }),
      }),
  ),
);
router.get(
  "/courses/:id",
  asyncRoute(async (req, res) => {
    const course = await Course.findById(parseId(req.params.id));
    if (!course) throw new HttpError(404, "Course not found");
    res.json({
      course,
      chapters: await Chapter.find({ course: course._id, archived: false })
        .sort({ order: 1 })
        .lean(),
    });
  }),
);
router.put(
  "/courses/:id",
  asyncRoute(async (req, res) => {
    const course = await Course.findByIdAndUpdate(
      parseId(req.params.id),
      courseInput(req.body),
      { new: true, runValidators: true },
    );
    if (!course) throw new HttpError(404, "Course not found");
    res.json({ course });
  }),
);
router.patch(
  "/courses/:id/status",
  asyncRoute(async (req, res) => {
    if (!["draft", "published", "archived"].includes(req.body.status))
      throw new HttpError(400, "Invalid status");
    const course = await Course.findById(parseId(req.params.id));
    if (!course) throw new HttpError(404, "Course not found");
    if (req.body.status === "published") {
      const chapters = await Chapter.find({
        course: course._id,
        archived: false,
      });
      if (
        !chapters.length ||
        chapters.some((c) => !c.topics.length || c.learningText.length < 60)
      )
        throw new HttpError(400, "Add a complete chapter before publishing");
    }
    course.status = req.body.status;
    await course.save();
    res.json({ course });
  }),
);
router.post(
  "/courses/:id/chapters",
  asyncRoute(async (req, res) => {
    const course = await Course.findById(parseId(req.params.id));
    if (!course) throw new HttpError(404, "Course not found");
    const data = chapterInput(req.body);
    if (
      await Chapter.exists({
        course: course._id,
        order: data.order,
        archived: false,
      })
    )
      throw new HttpError(409, "This chapter order is already used");
    res
      .status(201)
      .json({ chapter: await Chapter.create({ ...data, course: course._id }) });
  }),
);
router.put(
  "/chapters/:id",
  asyncRoute(async (req, res) => {
    const chapter = await Chapter.findOne({
      _id: parseId(req.params.id),
      archived: false,
    });
    if (!chapter) throw new HttpError(404, "Chapter not found");
    const data = chapterInput(req.body);
    if (
      await Chapter.exists({
        course: chapter.course,
        order: data.order,
        archived: false,
        _id: { $ne: chapter._id },
      })
    )
      throw new HttpError(409, "This chapter order is already used");
    const changed = ["learningText", "topics", "title"].some(
      (key) => JSON.stringify(chapter[key]) !== JSON.stringify(data[key]),
    );
    Object.assign(chapter, data);
    if (changed) chapter.contentVersion++;
    await chapter.save();
    res.json({ chapter });
  }),
);
router.delete(
  "/chapters/:id",
  asyncRoute(async (req, res) => {
    const chapter = await Chapter.findByIdAndUpdate(
      parseId(req.params.id),
      { archived: true },
      { new: true },
    );
    if (!chapter) throw new HttpError(404, "Chapter not found");
    res.json({ message: "Chapter archived" });
  }),
);
export default router;
