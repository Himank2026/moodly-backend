import express from "express";
import {
  getUser,
  registerUser,
  loginUser,
  logoutUser,
  followUser,
  getMe,     // <-- Added
  updateMe,  // <-- Added
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// --- New routes for settings ---
router.get("/me", verifyToken, getMe);
router.patch("/me", verifyToken, updateMe);
// -------------------------------

router.get("/:username", getUser);
router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/logout", logoutUser);
router.post("/follow/:username", verifyToken, followUser);

export default router;