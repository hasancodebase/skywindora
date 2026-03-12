import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.18.29:5000/api",
  timeout: 20000,
});

export const getWeather = async (city) => {
  const response = await API.get(`/weather/${city}`);
  return response.data; // ✅ return only JSON data
};