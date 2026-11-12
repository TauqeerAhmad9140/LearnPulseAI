import mongoose from "mongoose";

const { Schema, model } = mongoose;
const opts = { timestamps: true };

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "admin"], default: "student" },
  },
  opts,
);
userSchema.methods.toSafeJSON = function () {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
  };
};

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      default: "Development",
      trim: true,
      maxlength: 40,
    },
    thumbnail: { type: String, default: "" },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    duration: { type: String, default: "Self-paced" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  opts,
);

const chapterSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    order: { type: Number, required: true, min: 1 },
    videoId: { type: String, required: true },
    learningText: { type: String, required: true, minlength: 60 },
    topics: { type: [String], default: [] },
    duration: { type: String, default: "10 min" },
    contentVersion: { type: Number, default: 1 },
    archived: { type: Boolean, default: false },
  },
  opts,
);
chapterSchema.index({ course: 1, order: 1 });

const quizSchema = new Schema(
  {
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    contentVersion: { type: Number, required: true },
    status: { type: String, enum: ["ready", "generating"], default: "ready" },
    source: { type: String, enum: ["ai", "seed"], default: "ai" },
  },
  opts,
);
quizSchema.index({ chapter: 1, contentVersion: 1 }, { unique: true });

const questionSchema = new Schema(
  {
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    topic: { type: String, required: true },
    explanation: { type: String, required: true },
    order: { type: Number, required: true },
  },
  opts,
);
questionSchema.index({ quiz: 1, order: 1 }, { unique: true });

const attemptSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    requestId: { type: String, required: true },
    answers: [
      {
        question: Schema.Types.ObjectId,
        selectedIndex: Number,
        correctIndex: Number,
        isCorrect: Boolean,
        topic: String,
        text: String,
        options: [String],
        explanation: String,
      },
    ],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    weakTopics: { type: [String], default: [] },
  },
  opts,
);
attemptSchema.index({ student: 1, requestId: 1 }, { unique: true });
attemptSchema.index({ student: 1, createdAt: -1 });

const progressSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    completedAt: { type: Date, default: Date.now },
  },
  opts,
);
progressSchema.index({ student: 1, chapter: 1 }, { unique: true });

export const User = model("User", userSchema);
export const Course = model("Course", courseSchema);
export const Chapter = model("Chapter", chapterSchema);
export const Quiz = model("Quiz", quizSchema);
export const Question = model("Question", questionSchema);
export const QuizAttempt = model("QuizAttempt", attemptSchema);
export const StudentProgress = model("StudentProgress", progressSchema);
