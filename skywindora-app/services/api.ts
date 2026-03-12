import axios from "axios";

const BASE_URL = "http://192.168.18.29:5000/api";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

// City weather
export const getWeather = (city) => API.get(`/weather/${city}`);

// Aviation METAR/TAF
export const getAviation = (icao) => API.get(`/aviation/${icao}`);

// AI Briefing
export const getAIBriefing = (weatherData, type) =>
  API.post("/ai/briefing", { weatherData, type });

// Go/No-Go Assessment
export const getGoNoGo = (weatherData) =>
  API.post("/ai/gonogo", { weatherData });

// Ask AI
export const askAI = (question, weatherData = null) =>
  API.post("/ai/ask", { question, weatherData });

// Saved locations
export const getSavedLocations = (deviceId) =>
  API.get(`/saved/${deviceId}`);

export const saveLocation = (data) =>
  API.post("/saved", data);

export const deleteSavedLocation = (deviceId, query) =>
  API.delete(`/saved/${deviceId}/${query}`);

export const clearSavedLocations = (deviceId) =>
  API.delete(`/saved/${deviceId}`);