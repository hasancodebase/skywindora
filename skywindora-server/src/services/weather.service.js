import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache

export const fetchWeatherData = async (city) => {
  const cacheKey = `weather_${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Step 1 — Geocode city name to coordinates
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoRes = await axios.get(geoUrl);

  if (!geoRes.data.results || !geoRes.data.results.length) {
    throw new Error("City not found");
  }

  const { latitude, longitude, name, country, timezone } = geoRes.data.results[0];

  // Step 2 — Get weather data
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code,wind_speed_10m_max&timezone=${encodeURIComponent(timezone)}&forecast_days=7`;

  const weatherRes = await axios.get(weatherUrl);
  const w = weatherRes.data;

  // Step 3 — Format response
  const data = {
    type: "city",
    location: {
      city: name,
      country,
      latitude,
      longitude,
      timezone
    },
    current: {
      temperature: Math.round(w.current.temperature_2m),
      feelsLike: Math.round(w.current.apparent_temperature),
      humidity: w.current.relative_humidity_2m,
      windSpeed: Math.round(w.current.wind_speed_10m),
      windDirection: w.current.wind_direction_10m,
      pressure: Math.round(w.current.surface_pressure),
      visibility: w.current.visibility,
      weatherCode: w.current.weather_code,
      condition: getWeatherCondition(w.current.weather_code)
    },
    hourly: {
      times: w.hourly.time.slice(0, 24),
      temperatures: w.hourly.temperature_2m.slice(0, 24),
      humidity: w.hourly.relative_humidity_2m.slice(0, 24),
      windSpeed: w.hourly.wind_speed_10m.slice(0, 24),
      weatherCodes: w.hourly.weather_code.slice(0, 24)
    },
    daily: {
      times: w.daily.time,
      maxTemps: w.daily.temperature_2m_max,
      minTemps: w.daily.temperature_2m_min,
      sunrise: w.daily.sunrise,
      sunset: w.daily.sunset,
      weatherCodes: w.daily.weather_code,
      maxWindSpeed: w.daily.wind_speed_10m_max
    },
    fetchedAt: new Date().toISOString()
  };

  cache.set(cacheKey, data);
  return data;
};

// WMO Weather Code to condition
export const getWeatherCondition = (code) => {
  const conditions = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Icy Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Heavy Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Showers",
    81: "Moderate Showers",
    82: "Heavy Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Hail",
    99: "Thunderstorm with Heavy Hail"
  };
  return conditions[code] || "Unknown";
};

// Weather code to emoji icon
export const getWeatherIcon = (code) => {
  if (code === 0 || code === 1) return "☀️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌦️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌩️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
};