import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});
const PORT = 3000;

app.use(express.json());

// Broadcast news updates to all connected clients
io.on("connection", (socket) => {
  console.log("Client connected to Rada Stream:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected"));
});

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

import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
  }
});

// API: Rada News Scraper (Real RSS + Gemini)
app.get("/api/rada/fetch", async (req, res) => {
  try {
    const rssFeeds = [
      "https://www.standardmedia.co.ke/rss/kenya.php",
      "https://tuko.co.ke/rss/all.xml",
      "https://www.the-star.co.ke/rss/"
    ];

    let allNews: any[] = [];

    // 1. Fetch from RSS
    for (const url of rssFeeds) {
      try {
        const feed = await parser.parseURL(url);
        const items = feed.items.slice(0, 3).map(item => ({
          title: item.title,
          source: feed.title || "News Source",
          content: item.contentSnippet || item.content || "",
          category: "General",
          imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80", // Placeholder for RSS
          timestamp: new Date(item.pubDate || Date.now()).getTime(),
          link: item.link
        }));
        allNews = [...allNews, ...items];
      } catch (e) {
        console.error(`Error fetching RSS from ${url}:`, e);
      }
    }

    // 2. Fetch from Gemini (for Gen Z specific topics)
    try {
      const prompt = `Search for the 3 most trending and verified news stories in Kenya today specifically relevant to Gen Z (entertainment, gossip, tech startups, or sports).
      For each story, provide:
      1. A catchy title.
      2. The original source.
      3. A 2-3 sentence summary.
      4. A category (Gossip, Sports, Tech, Lifestyle).
      5. A high-quality Unsplash image URL.
      
      IMPORTANT: Respond ONLY with a JSON array of objects.`;
      
      const interaction = await ai.interactions.create({
        model: "gemini-2.0-flash-exp",
        input: prompt,
        tools: [{ type: 'google_search' }],
      });
      
      let geminiText = "";
      for (const step of interaction.steps) {
        if (step.type === 'model_output' && step.content) {
          const textContent = step.content.find((c: any) => c.type === 'text') as any;
          if (textContent && textContent.text) {
            geminiText += textContent.text;
          }
        }
      }
      
      const cleanedText = geminiText.replace(/```json|```/g, "").trim();
      const geminiNews = JSON.parse(cleanedText);
      allNews = [...allNews, ...geminiNews.map((n: any) => ({ ...n, timestamp: Date.now() }))];
    } catch (geminiError) {
      console.error("Gemini News Fetch failed:", geminiError);
    }
    
    res.json(allNews);
    
    // Broadcast news to all clients for real-time "broadcast" effect
    io.emit("rada:news_update", allNews);
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`GenZHub server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
