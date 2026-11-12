import { Link, Route, Routes } from "react-router-dom";
import { Protected, Shell } from "./components/UI";
import { Home, Catalog, CourseDetail, AuthPage } from "./pages/Public";
import { Dashboard, Lesson, QuizPage, Result, History } from "./pages/Student";
import { AdminHome, AdminCourses, AdminEditor } from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Catalog />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<Protected role="student" />}>
        <Route element={<Shell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/courses/:courseId/chapters/:chapterId"
            element={<Lesson />}
          />
          <Route path="/chapters/:chapterId/quiz" element={<QuizPage />} />
          <Route path="/results/:id" element={<Result />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Route>
      <Route element={<Protected role="admin" />}>
        <Route element={<Shell />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/courses/:id" element={<AdminEditor />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <div className="not-found">
            <h1>Lost in the learning universe?</h1>
            <p>This page does not exist.</p>
            <Link className="button primary" to="/">
              Go home
            </Link>
          </div>
        }
      />
    </Routes>
  );
}
