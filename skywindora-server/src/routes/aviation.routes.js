import express from "express";
import { getAviationByICAO } from "../controllers/aviation.controller.js";

const router = express.Router();

// GET /api/aviation/:icao — get METAR/TAF for airport
router.get("/:icao", getAviationByICAO);

export default router;