import { fetchAviationWeather } from "../services/aviation.service.js";

export const getAviationByICAO = async (req, res) => {
  try {
    const { icao } = req.params;

    if (!icao) {
      return res.status(400).json({ error: "ICAO code is required" });
    }

    if (!/^[A-Za-z]{4}$/.test(icao)) {
      return res.status(400).json({ error: "Invalid ICAO code — must be 4 letters e.g. EGLL" });
    }

    const data = await fetchAviationWeather(icao.toUpperCase());
    res.json(data);

  } catch (err) {
    console.error("Aviation Controller Error:", err.message);

    if (err.message.includes("not found")) {
      return res.status(404).json({ error: `Airport ${req.params.icao} not found` });
    }

    res.status(500).json({
      error: "Aviation service failed",
      details: err.message
    });
  }
};