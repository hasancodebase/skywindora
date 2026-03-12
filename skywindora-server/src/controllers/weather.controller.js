import { fetchWeatherData } from "../services/weather.service.js";

export const getWeatherByCity = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({ error: "City name is required" });
    }

    const data = await fetchWeatherData(city);
    res.json(data);

  } catch (err) {
    console.error("Weather Controller Error:", err.message);

    if (err.message === "City not found") {
      return res.status(404).json({ error: "City not found" });
    }

    res.status(500).json({
      error: "Weather service failed",
      details: err.message
    });
  }
};