import axios from "axios";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const groqRequest = async (prompt, maxTokens = 1000) => {
  const key = process.env.GROQ_API_KEY;
  console.log("GROQ KEY EXISTS:", !!key);
  console.log("GROQ KEY PREVIEW:", key?.slice(0, 15));

  const response = await axios.post(
    GROQ_URL,
    {
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data.choices[0].message.content;
};

export const getAIBriefing = async (req, res) => {
  try {
    const { weatherData, type } = req.body;

    if (!weatherData) {
      return res.status(400).json({ error: "Weather data is required" });
    }

    let prompt = "";

    if (type === "aviation") {
      prompt = `You are an expert aviation weather briefer. Analyze this METAR/TAF data and provide a professional briefing for pilots and flight dispatchers.

Weather Data:
${JSON.stringify(weatherData, null, 2)}

Provide a structured briefing with:
1. Current Conditions Summary (2-3 sentences)
2. Flight Category: ${weatherData.flightCategory} — explain what this means
3. Key Hazards (list any dangerous conditions)
4. Go/No-Go Assessment for VFR pilots
5. Go/No-Go Assessment for IFR pilots
6. TAF Trend (if available — improving or deteriorating)
7. Dispatcher Recommendation (one clear sentence)

Keep it professional, clear, and concise.`;

    } else {
      prompt = `You are an expert meteorologist. Analyze this weather data and provide a clear briefing.

Weather Data:
${JSON.stringify(weatherData, null, 2)}

Provide:
1. Current Conditions Summary (2-3 sentences)
2. How it feels outside
3. Key weather highlights for today
4. 3-day outlook based on the forecast
5. Any weather warnings or things to watch out for
6. Best time of day to go outside

Keep it friendly and easy to understand.`;
    }

    const briefing = await groqRequest(prompt, 1000);
    res.json({ briefing });

  } catch (err) {
    console.error("AI Briefing Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "AI briefing failed",
      details: err.response?.data || err.message
    });
  }
};

export const getGoNoGo = async (req, res) => {
  try {
    const { weatherData } = req.body;

    if (!weatherData) {
      return res.status(400).json({ error: "Weather data is required" });
    }

    const prompt = `You are an expert aviation safety officer. Based on this weather data, provide a Go/No-Go assessment.

Weather Data:
${JSON.stringify(weatherData, null, 2)}

Respond in this exact JSON format only, no extra text, no markdown:
{
  "verdict": "GO",
  "riskLevel": "LOW",
  "vfrAssessment": "one sentence for VFR pilots",
  "ifrAssessment": "one sentence for IFR pilots",
  "primaryHazards": ["hazard 1", "hazard 2"],
  "recommendation": "one clear actionable recommendation",
  "briefingSummary": "2-3 sentence plain English summary"
}`;

    const text = await groqRequest(prompt, 500);
    console.log("GONOGO RAW:", text.slice(0, 200));
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);

  } catch (err) {
    console.error("Go/No-Go Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Go/No-Go assessment failed",
      details: err.response?.data || err.message
    });
  }
};

export const askAI = async (req, res) => {
  try {
    const { question, weatherData } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const prompt = `You are SkyWindora AI — an expert aviation weather assistant helping pilots, flight dispatchers, and weather enthusiasts.

${weatherData ? `Current weather context:\n${JSON.stringify(weatherData, null, 2)}\n` : ""}

User question: ${question}

Answer clearly and professionally. Keep your answer concise and helpful.`;

    const answer = await groqRequest(prompt, 800);
    res.json({ answer });

  } catch (err) {
    console.error("Ask AI Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "AI assistant failed",
      details: err.response?.data || err.message
    });
  }
};
