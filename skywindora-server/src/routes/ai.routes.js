import express from "express";
import { getAIBriefing, getGoNoGo, askAI } from "../controllers/ai.controller.js";

const router = express.Router();

// POST /api/ai/briefing — AI weather briefing
router.post("/briefing", getAIBriefing);

// POST /api/ai/gonogo — Go/No-Go assessment
router.post("/gonogo", getGoNoGo);

// POST /api/ai/ask — AI Q&A chatbot
router.post("/ask", askAI);

export default router;