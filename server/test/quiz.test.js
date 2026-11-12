import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeQuiz, publicQuestion, validateQuestions } from '../src/services/quiz.js';

const ids = Array.from({ length: 5 }, (_, i) => `${String(i + 1).padStart(24, '0')}`);
const questions = ids.map((_id, i) => ({ _id, text: `Question number ${i + 1} about variables?`, options: ['One', 'Two', 'Three', 'Four'], correctIndex: i % 4, topic: i < 2 ? 'Variables' : 'Functions', explanation: 'The lesson provides this answer.', order: i + 1 }));
test('server grades five answers and identifies topics for revision', () => {
  const answers = questions.map((q, i) => ({ questionId: String(q._id), selectedIndex: i === 1 ? 3 : q.correctIndex }));
  const result = gradeQuiz(questions, answers);
  assert.equal(result.score, 4);
  assert.equal(result.percentage, 80);
  assert.deepEqual(result.weakTopics, ['Variables']);
});
test('duplicate or invalid answers are rejected', () => {
  assert.throws(() => gradeQuiz(questions, Array(5).fill({ questionId: ids[0], selectedIndex: 0 })), /Each question/);
  assert.throws(() => gradeQuiz(questions, questions.map(q => ({ questionId: q._id, selectedIndex: 8 }))), /Invalid answer/);
});
test('AI output must be complete and grounded to allowed topics', () => {
  assert.equal(validateQuestions(questions, ['Variables', 'Functions']).length, 5);
  assert.throws(() => validateQuestions(questions.map((q, i) => ({ ...q, topic: i === 0 ? 'Invented' : q.topic })), ['Variables', 'Functions']), /invalid question/);
  assert.throws(() => validateQuestions(questions.slice(0, 4), ['Variables', 'Functions']), /exactly five/);
});
test('public questions never reveal correct answers', () => {
  const output = publicQuestion(questions[0]);
  assert.equal(output.correctIndex, undefined);
  assert.equal(output.explanation, undefined);
});
