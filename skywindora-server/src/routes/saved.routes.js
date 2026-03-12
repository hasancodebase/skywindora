import express from "express";
import {
  getSavedLocations,
  saveLocation,
  deleteSavedLocation,
  clearSavedLocations,
} from "../controllers/saved.controller.js";

const router = express.Router();

// GET /api/saved/:deviceId — get all saved locations
router.get("/:deviceId", getSavedLocations);

// POST /api/saved — save a location
router.post("/", saveLocation);

// DELETE /api/saved/:deviceId/:query — delete one location
router.delete("/:deviceId/:query", deleteSavedLocation);

// DELETE /api/saved/:deviceId — clear all locations
router.delete("/:deviceId", clearSavedLocations);

export default router;