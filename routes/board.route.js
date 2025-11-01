import express from "express";
import { getUserBoards, getMyBoards} from "../controllers/board.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/:userId", getUserBoards);
router.get("/", verifyToken, getMyBoards);

export default router;