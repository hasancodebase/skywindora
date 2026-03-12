import express from "express";
import { getRadarData } from "../controllers/radar.controller.js";

const router = express.Router();

router.get("/", getRadarData);

export default router;