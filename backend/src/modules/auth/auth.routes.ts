import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  csrfHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
} from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/logout", requireAuth, logoutHandler);
authRouter.get("/me", requireAuth, meHandler);
authRouter.get("/csrf", csrfHandler);
