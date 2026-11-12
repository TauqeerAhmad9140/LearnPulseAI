import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { User } from "../models/index.js";
import {
  asyncRoute,
  authenticate,
  HttpError,
  requireFields,
} from "../middleware/http.js";

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const cookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAMESITE === "none" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});
function startSession(res, user) {
  const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("lp_session", token, cookieConfig());
  res.json({ user: user.toSafeJSON() });
}
router.post(
  "/register",
  limiter,
  asyncRoute(async (req, res) => {
    requireFields(req.body, ["name", "email", "password"]);
    const { name, email, password } = req.body;
    if (name.trim().length < 2 || name.length > 80)
      throw new HttpError(400, "Name must have 2–80 characters");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new HttpError(400, "Enter a valid email");
    if (password.length < 8 || password.length > 128)
      throw new HttpError(400, "Password must have 8–128 characters");
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 12),
      role: "student",
    });
    startSession(res, user);
  }),
);
router.post(
  "/login",
  limiter,
  asyncRoute(async (req, res) => {
    requireFields(req.body, ["email", "password"]);
    const user = await User.findOne({
      email: req.body.email.toLowerCase().trim(),
    }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      throw new HttpError(401, "Incorrect email or password");
    startSession(res, user);
  }),
);
router.post("/logout", (_req, res) => {
  res.clearCookie("lp_session", { ...cookieConfig(), maxAge: undefined });
  res.json({ message: "Logged out" });
});
router.get("/me", authenticate, (req, res) =>
  res.json({ user: req.user.toSafeJSON() }),
);
export default router;
