import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Course, Chapter, Quiz, Question } from "../models/index.js";

if (
  !process.env.MONGODB_URI ||
  !process.env.SEED_ADMIN_EMAIL ||
  !process.env.SEED_ADMIN_PASSWORD ||
  process.env.SEED_ADMIN_PASSWORD.length < 8
) {
  console.error(
    "Set MONGODB_URI, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least 8 characters) in server/.env",
  );
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI);
try {
  const email = process.env.SEED_ADMIN_EMAIL.toLowerCase().trim();
  let admin = await User.findOne({ email });
  if (!admin)
    admin = await User.create({
      name: "LearnPulse Admin",
      email,
      passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12),
      role: "admin",
    });
  if (admin.role !== "admin")
    throw new Error("Seed email is already used by a student");
  let course = await Course.findOne({
    title: "JavaScript Foundations",
    createdBy: admin._id,
  });
  if (!course)
    course = await Course.create({
      title: "JavaScript Foundations",
      description:
        "A practical starting point for modern JavaScript. Learn variables, functions, arrays, and loops through bite-sized video lessons and quick knowledge checks.",
      category: "Development",
      level: "Beginner",
      duration: "2 chapters · 25 min",
      status: "published",
      createdBy: admin._id,
    });
  const lessons = [
    {
      title: "Variables and data types",
      order: 1,
      videoId: "PkZNo7MFNFg",
      duration: "12 min",
      topics: ["Variables", "Data types"],
      learningText:
        "JavaScript variables store values. Use let for a binding that will change and const for a binding that will not be reassigned. A const object can still have mutable properties. JavaScript primitive values include strings, numbers, booleans, null, undefined, bigint, and symbols. The typeof operator reports the type of most values, although typeof null is historically object. Strict equality === compares without type coercion. A string is written with quotes and a number can be used in arithmetic.",
      questions: [
        [
          "Which keyword declares a binding that can be reassigned?",
          ["const", "let", "typeof", "null"],
          1,
          "Variables",
          "let allows reassignment of a binding.",
        ],
        [
          "What does const prevent?",
          [
            "Changing object properties",
            "Reassigning the binding",
            "Reading a value",
            "Using strings",
          ],
          1,
          "Variables",
          "const prevents reassignment of its binding.",
        ],
        [
          "Which of these is a primitive type?",
          ["array", "object", "boolean", "function"],
          2,
          "Data types",
          "Boolean is one of the JavaScript primitive types.",
        ],
        [
          "What does strict equality compare without?",
          ["Numbers", "Variables", "Type coercion", "Strings"],
          2,
          "Data types",
          "The === operator compares without type coercion.",
        ],
        [
          "What is the historical typeof null result?",
          ["null", "undefined", "boolean", "object"],
          3,
          "Data types",
          "typeof null returns object for historical reasons.",
        ],
      ],
    },
    {
      title: "Functions, arrays and loops",
      order: 2,
      videoId: "N8ap4k_1QEQ",
      duration: "13 min",
      topics: ["Functions", "Arrays", "Loops"],
      learningText:
        "A function groups reusable instructions. Parameters are named inputs and arguments are the values passed when calling the function. The return keyword sends a value back to the caller. An array holds an ordered list of values, with zero-based indexes: the first item is at index 0. The array length property reports the number of items. A for loop repeats instructions while its condition remains true. A for...of loop visits the values in an iterable such as an array. Array map creates a new array by transforming each element, while forEach visits items without returning a transformed array.",
      questions: [
        [
          "What does return do in a function?",
          [
            "Declares an array",
            "Sends a value to the caller",
            "Starts a loop",
            "Changes a parameter name",
          ],
          1,
          "Functions",
          "return sends the function result to the caller.",
        ],
        [
          "What is the index of the first array element?",
          ["1", "-1", "0", "length"],
          2,
          "Arrays",
          "JavaScript arrays use zero-based indexes.",
        ],
        [
          "What does the length property report?",
          ["Last index", "Number of elements", "First value", "Data type"],
          1,
          "Arrays",
          "length reports the number of elements.",
        ],
        [
          "What does for...of visit for an array?",
          ["Property names", "Array values", "Only indexes", "Function names"],
          1,
          "Loops",
          "for...of iterates over array values.",
        ],
        [
          "Which array method creates a transformed new array?",
          ["forEach", "length", "map", "return"],
          2,
          "Arrays",
          "map creates a new array from transformed elements.",
        ],
      ],
    },
  ];
  for (const lesson of lessons) {
    let chapter = await Chapter.findOne({
      course: course._id,
      order: lesson.order,
      archived: false,
    });
    if (!chapter)
      chapter = await Chapter.create({
        course: course._id,
        title: lesson.title,
        order: lesson.order,
        videoId: lesson.videoId,
        duration: lesson.duration,
        topics: lesson.topics,
        learningText: lesson.learningText,
      });
    let quiz = await Quiz.findOne({
      chapter: chapter._id,
      contentVersion: chapter.contentVersion,
    });
    if (!quiz)
      quiz = await Quiz.create({
        chapter: chapter._id,
        contentVersion: chapter.contentVersion,
        status: "ready",
        source: "seed",
      });
    if (!(await Question.countDocuments({ quiz: quiz._id })))
      await Question.insertMany(
        lesson.questions.map(
          ([text, options, correctIndex, topic, explanation], i) => ({
            quiz: quiz._id,
            text,
            options,
            correctIndex,
            topic,
            explanation,
            order: i + 1,
          }),
        ),
      );
  }
  console.log("Demo course and administrator are ready. Admin email:", email);
} finally {
  await mongoose.disconnect();
}
