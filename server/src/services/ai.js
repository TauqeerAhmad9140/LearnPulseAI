import { HttpError } from '../middleware/http.js';
import { validateQuestions } from './quiz.js';

export async function generateQuestions(chapter) {
  const { AI_API_URL, AI_API_KEY, AI_MODEL } = process.env;
  if (!AI_API_URL || !AI_API_KEY || !AI_MODEL) throw new HttpError(503, 'AI service is not configured yet. Ask the administrator to configure it.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, temperature: 0.3,
        messages: [
          { role: 'system', content: 'You generate accurate chapter assessments. Use only the provided lesson material. Return a JSON object with a questions array of exactly five objects. Each object has text, options (four unique strings), correctIndex (integer 0-3), topic (exact match to one allowed topic), explanation. Do not include Markdown.' },
          { role: 'user', content: JSON.stringify({ title: chapter.title, topics: chapter.topics, lesson: chapter.learningText.slice(0, 16000) }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('Empty AI response');
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(content);
    return validateQuestions(parsed.questions, chapter.topics);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('Quiz generation failed:', error.message);
    throw new HttpError(503, 'Quiz generation is temporarily unavailable. Please retry.');
  } finally { clearTimeout(timeout); }
}
