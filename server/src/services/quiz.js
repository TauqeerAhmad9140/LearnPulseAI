import { HttpError } from '../middleware/http.js';

export function validateQuestions(value, allowedTopics) {
  if (!Array.isArray(value) || value.length !== 5) throw new HttpError(502, 'AI must return exactly five questions');
  return value.map((q, index) => {
    if (typeof q.text !== 'string' || q.text.trim().length < 12 || !Array.isArray(q.options) || q.options.length !== 4 ||
      q.options.some(o => typeof o !== 'string' || !o.trim()) || new Set(q.options.map(o => o.trim().toLowerCase())).size !== 4 ||
      !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3 ||
      typeof q.topic !== 'string' || !allowedTopics.includes(q.topic) ||
      typeof q.explanation !== 'string' || q.explanation.trim().length < 8) {
      throw new HttpError(502, `AI returned an invalid question at position ${index + 1}`);
    }
    return { text: q.text.trim(), options: q.options.map(o => o.trim()), correctIndex: q.correctIndex, topic: q.topic, explanation: q.explanation.trim(), order: index + 1 };
  });
}

export function gradeQuiz(questions, answers) {
  if (!Array.isArray(answers) || answers.length !== questions.length || questions.length !== 5) throw new HttpError(400, 'Answer all five questions');
  if (answers.some(a => !a || typeof a.questionId !== 'string')) throw new HttpError(400, 'Invalid answer');
  const byId = new Map(answers.map(a => [String(a.questionId), a.selectedIndex]));
  if (byId.size !== 5) throw new HttpError(400, 'Each question needs one answer');
  const marked = questions.map(q => {
    const selectedIndex = byId.get(String(q._id));
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) throw new HttpError(400, 'Invalid answer');
    return { question: q._id, selectedIndex, correctIndex: q.correctIndex, isCorrect: selectedIndex === q.correctIndex, topic: q.topic, text: q.text, options: q.options, explanation: q.explanation };
  });
  const score = marked.filter(a => a.isCorrect).length;
  return { answers: marked, score, total: questions.length, percentage: Math.round(score / questions.length * 100), weakTopics: [...new Set(marked.filter(a => !a.isCorrect).map(a => a.topic))] };
}

export function publicQuestion(q) { return { id: String(q._id), text: q.text, options: q.options, topic: q.topic, order: q.order }; }
