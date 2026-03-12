import express from "express";
import { getWeatherByCity } from "../controllers/weather.controller.js";

const router = express.Router();

// GET /api/weather/:city — get weather for city
router.get("/:city", getWeatherByCity);

export default router;