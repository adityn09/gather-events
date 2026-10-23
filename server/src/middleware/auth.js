import jwt from "jsonwebtoken";
import { User } from "../models.js";
import { problem } from "../helpers.js";
export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
});
export function authMiddleware(secret) {
  return async (req, res, next) => {
    try {
      const p = jwt.verify(req.cookies.gather_session, secret, {
        issuer: "gather",
        audience: "gather-web",
        algorithms: ["HS256"],
      });
      req.user = await User.findById(p.sub);
      if (!req.user) throw new Error();
      next();
    } catch {
      next(problem(401, "Please sign in to continue."));
    }
  };
}
export function organizer(req, res, next) {
  return req.user.role === "organizer"
    ? next()
    : next(problem(403, "Organizer access is required."));
}
export function session(res, user, secret, options) {
  res.cookie(
    "gather_session",
    jwt.sign({ sub: String(user._id) }, secret, {
      expiresIn: "8h",
      issuer: "gather",
      audience: "gather-web",
    }),
    { ...options, maxAge: 8 * 3600000 },
  );
}
