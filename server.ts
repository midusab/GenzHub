import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Pesapal Config (Sandbox)
const PESAPAL_URL = "https://cybqa.pesapal.com/pesapalv3";
const PESAPAL_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

// Helper: Get Pesapal Auth Token
async function getPesapalAuthToken() {
  try {
    const response = await axios.post(`${PESAPAL_URL}/api/Auth/RequestToken`, {
      consumer_key: PESAPAL_KEY,
      consumer_secret: PESAPAL_SECRET
    });
    return response.data.token;
  } catch (error) {
    console.error("Pesapal Auth Error:", error);
    return null;
  }
}

// API: Rada News Scraper Simulation (using Gemini)
app.get("/api/rada/fetch", async (req, res) => {
  try {
    const prompt = `Generate 5 trending news items for Kenyan Gen Z. 
    Sources to simulate: Nairobi Gossip Club, Mpasho, ESPN (EPL/UEFA), Citizen Digital.
    Format as JSON array of objects with fields: title, source, content, category, imageUrl (placeholder).
    Categories: Gossip, Sports, Politics, Tech.`;
    
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: prompt,
    });
    
    let text = "";
    for (const step of interaction.steps) {
      if (step.type === 'model_output') {
        const textContent = step.content?.find(c => c.type === 'text');
        if (textContent && textContent.text) {
          text += textContent.text;
        }
      }
    }
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const news = JSON.parse(cleanedText);
    
    res.json(news);
  } catch (error) {
    console.error("Rada Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// API: Pesapal STK Push
app.post("/api/payments/stk-push", async (req, res) => {
  const { amount, phoneNumber, description, accountReference } = req.body;
  const token = await getPesapalAuthToken();
  
  if (!token) {
    return res.status(500).json({ error: "Pesapal authentication failed" });
  }

  try {
    // In a real sandbox, this would call the Pesapal Order request
    // For this applet, we simulate the handshake
    res.json({
      status: "pending",
      message: "STK Push initiated",
      trackingId: `PESA_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GenZHub server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
