# LearnPulse AI

A MERN learning and assessment platform. Admins publish structured video courses. Students complete chapters, take five-question quizzes, review explanations and topics to revise, and track course progress.

## What works

- Student registration and login; admin login; protected routes and server-side role checks.
- Admin course and chapter editor with draft, publish, archive, ordering, video IDs, notes and topic labels.
- Course catalog, chapter video player, lesson notes and persistent completion.
- Five-question quiz with server-side grading, immutable attempt snapshots, result review and dashboard.
- AI quiz generation from chapter notes through an OpenAI-compatible chat-completions endpoint. A sample course includes two prewritten quizzes for immediate demonstration.
- Responsive layout, loading and error states, mobile navigation, and reduced-motion support.

## Requirements

- Node.js 20.19+ or 22.12+ (Node 24 is also supported by Vite).
- MongoDB locally or a MongoDB Atlas connection string.
- An AI provider and key **only** to generate quizzes for newly created chapters. The seeded lessons work without an AI key.

## Local setup

```bash
cd learnpulse-ai
cp server/.env.example server/.env
npm install
npm run install:all
```

Edit `server/.env` with your MongoDB connection, a long random `JWT_SECRET`, and a password in `SEED_ADMIN_PASSWORD`. For example, generate a secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Keep this file private.

Create the initial admin and demo content, then start both applications:

```bash
npm run seed --prefix server
npm run dev
```

Open http://localhost:5173. Sign in as the seed admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) to manage content. Register a separate student account to complete the sample chapters. The Express API runs at http://localhost:8000; Vite proxies `/api` during development.

## AI configuration

Set these server-only variables in `server/.env`:

```dotenv
AI_API_URL=https://your-provider.example/v1/chat/completions
AI_API_KEY=your-secret-key
AI_MODEL=your-supported-model
```

The endpoint must accept an OpenAI-compatible `messages` request and return `choices[0].message.content` as JSON text containing `{ "questions": [...] }`. AI output is validated before it is stored. Chapter notes or a transcript are required: an embedded YouTube URL alone cannot provide lesson content to the AI. If generation fails, the learner can retry. Do not put AI keys into client environment variables.

## API routes

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Public/session |
| GET | `/api/auth/me` | Signed in |
| GET | `/api/courses`, `/api/courses/:id` | Public |
| GET | `/api/courses/:id/chapters/:chapterId` | Student |
| PUT | `/api/courses/:id/chapters/:chapterId/completion` | Student |
| GET | `/api/quizzes/chapter/:chapterId` | Student who completed chapter |
| POST | `/api/quizzes/:quizId/attempts` | Student who completed chapter |
| GET | `/api/quizzes/attempts`, `/api/quizzes/attempts/:id` | Student, own results |
| GET | `/api/dashboard` | Student |
| GET/POST/PUT/PATCH | `/api/admin/courses...` | Admin |
| POST/PUT/DELETE | `/api/admin/.../chapters...` | Admin |

Answers are evaluated on the server. A quiz request omits correct options and explanations. Results save question snapshots so editing a chapter does not change historical attempts. Chapter edits to title, notes, or topics increase its content version and cause a new quiz to be generated. The same submission ID is safe to retry without duplicating the attempt.

## Checks

```bash
npm test
npm run build
```

The unit tests cover scoring, invalid answers, AI validation and public question sanitization. Manually check the complete flow with a running MongoDB: seed -> register student -> finish chapter -> quiz -> results -> dashboard; then create and publish a chapter as admin.

## Production configuration

Deploy `server` as a Node service and build `client` with `npm run build`. Serve `client/dist` from a static host and route frontend paths to `index.html`. Set `VITE_API_URL` at build time when the API is hosted separately. Set `CLIENT_ORIGIN` to the frontend's exact HTTPS origin, use HTTPS, and set `COOKIE_SAMESITE=none` for a cross-site API origin (keep `NODE_ENV=production` for secure cookies). The API checks `Origin` on state-changing requests; configure only the frontend origin. Use an authenticated hosted MongoDB database and private server environment variables. Protect the admin credentials and rotate any exposed secrets.

## Current limitations

- Video completion is student-confirmed; the application does not verify playback duration.
- Topic feedback from five questions identifies topics to revise, not full mastery.
- AI accuracy depends on the supplied chapter notes and provider response; the validator enforces structure, not pedagogical correctness.
- Real AI generation needs an external provider key. The sample course includes prewritten quizzes to make the project usable without one.
- Course statistics in this version focus on each student's progress; instructor analytics, certificates and payment plans are future additions.

