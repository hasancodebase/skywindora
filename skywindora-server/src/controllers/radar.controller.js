import { fetchRadarData } from "../services/radar.service.js";

export const getRadarData = async (req, res) => {
  try {
    const data = await fetchRadarData();
    res.json(data);
  } catch (error) {
    console.error("Radar Error:", error.message);
    res.status(500).json({ error: "Radar service failed" });
  }
};