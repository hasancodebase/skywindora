import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

import connectDB from "./src/config/db.js";
import weatherRoutes from "./src/routes/weather.routes.js";
import aviationRoutes from "./src/routes/aviation.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";
import savedRoutes from "./src/routes/saved.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Connect MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("SkyWindora API Running 🚀");
});

// Routes
app.use("/api/weather", weatherRoutes);
app.use("/api/aviation", aviationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/saved", savedRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SkyWindora Server running on port ${PORT}`);
});