import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

dotenv.config();

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: "gen-lang-client-0281170305"
  });
}
const dbAdmin = getFirestore("ai-studio-remixgenzhub-9c13ad20-70de-487e-95d7-f2c6dbd12151");

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
const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID;

// Helper: Get Pesapal Auth Token
async function getPesapalAuthToken() {
  try {
    const response = await axios.post(`${PESAPAL_URL}/api/Auth/RequestToken`, {
      consumer_key: PESAPAL_KEY,
      consumer_secret: PESAPAL_SECRET
    });
    return response.data.token;
  } catch (error: any) {
    console.error("Pesapal Auth Error:", error.response?.data || error.message);
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
      "https://www.capitalfm.co.ke/news/feed/",
      "https://nation.africa/kenya/news/-/1056/1056/-/rss/feed/index.xml"
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
        model: "gemini-3.5-flash",
        input: prompt,
      });
      
      let fullOutput = "";
      for (const step of interaction.steps) {
        if (step.type === 'model_output' && step.content) {
          const textContent = step.content.find((c: any) => c.type === 'text') as any;
          if (textContent && textContent.text) {
            fullOutput += textContent.text;
          }
        }
      }
      
      const jsonMatch = fullOutput.match(/```json\s*([\s\S]*?)\s*```/) || fullOutput.match(/([\{\[][\s\S]*[\}\]])/);
      if (!jsonMatch) throw new Error("No JSON found in model output");
      
      const cleanedText = jsonMatch[1] || jsonMatch[0];
      const geminiNews = JSON.parse(cleanedText.trim());
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

// API: Checkout (User requested alias)
app.post("/api/checkout", async (req, res) => {
  const { userId, amount, orderType, email, firstName, lastName, postId, postType } = req.body;
  const token = await getPesapalAuthToken();
  
  if (!token) {
    return res.status(401).json({ error: "Failed to authenticate with Pesapal system" });
  }

  if (!PESAPAL_IPN_ID) {
    return res.status(500).json({ error: "Pesapal IPN ID missing" });
  }

  const merchantReference = `GH_${Date.now()}_${userId.slice(-4)}`;
  const orderRequest = {
    id: merchantReference,
    currency: "KES",
    amount: parseFloat(amount),
    description: orderType === 'upgrade' ? 'GenZHub Premium Upgrade' : `Hustle Escrow Payment`,
    callback_url: process.env.PESAPAL_CALLBACK_URL || "https://ais-dev-nf6xh47x5bofeqvo46n3uw-560318932730.europe-west2.run.app/payments/callback",
    notification_id: PESAPAL_IPN_ID,
    billing_address: {
      email_address: email || "customer@genzhub.co.ke",
      first_name: firstName || "User",
      last_name: lastName || "Customer"
    }
  };

  try {
    const response = await axios.post(`${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`, orderRequest, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.order_tracking_id) {
      await dbAdmin.collection("pending_payments").doc(response.data.order_tracking_id).set({
        userId,
        type: orderType || 'escrow',
        amount,
        merchantReference,
        postId: postId || null,
        postType: postType || null,
        status: "pending",
        createdAt: FieldValue.serverTimestamp()
      });

      return res.status(200).json({ 
        redirect_url: response.data.redirect_url,
        order_tracking_id: response.data.order_tracking_id 
      });
    } else {
      throw new Error("Invalid response from Pesapal");
    }
  } catch (error: any) {
    console.error("Checkout Error:", error.response?.data || error.message);
    res.status(500).json({ error: "🔒 GenZHub Safe-Gate: Could not initialize secure portal. Try again." });
  }
});

// API: Pesapal Submit Order (legacy/internal)
app.post("/api/payments/order", async (req, res) => {
  const { userId, type, amount, email, firstName, lastName, postId, postType } = req.body;
  const token = await getPesapalAuthToken();
  
  if (!token || !PESAPAL_IPN_ID) {
    return res.status(500).json({ 
      error: "Pesapal configuration error", 
      details: !token ? "Token failed" : "IPN ID missing" 
    });
  }

  const merchantReference = `GH_${Date.now()}_${userId.slice(-4)}`;

  const orderRequest = {
    id: merchantReference,
    currency: "KES",
    amount: parseFloat(amount),
    description: type === 'upgrade' ? 'GenZHub Premium Upgrade' : `Hustle Escrow Payment`,
    callback_url: process.env.PESAPAL_CALLBACK_URL || "https://ais-dev-nf6xh47x5bofeqvo46n3uw-560318932730.europe-west2.run.app/payments/callback",
    notification_id: PESAPAL_IPN_ID,
    billing_address: {
      email_address: email,
      first_name: firstName || "User",
      last_name: lastName || "Customer"
    }
  };

  try {
    const response = await axios.post(`${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`, orderRequest, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.order_tracking_id) {
      // Record pending transaction
      await dbAdmin.collection("pending_payments").doc(response.data.order_tracking_id).set({
        userId,
        type,
        amount,
        merchantReference,
        postId: postId || null,
        postType: postType || null, // 'drip' or 'hustle'
        status: "pending",
        createdAt: FieldValue.serverTimestamp()
      });

      res.json({
        redirect_url: response.data.redirect_url,
        order_tracking_id: response.data.order_tracking_id
      });
    } else {
      throw new Error("Invalid response from Pesapal");
    }
  } catch (error: any) {
    console.error("Submit Order Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

// API: Pesapal Webhook (IPN)
app.get("/api/payments/webhook", async (req, res) => {
  const { OrderTrackingId, OrderNotificationType } = req.query;

  if (!OrderTrackingId) return res.sendStatus(400);

  console.log(`IPN Received: ${OrderTrackingId} (${OrderNotificationType})`);

  try {
    const token = await getPesapalAuthToken();
    if (!token) throw new Error("Auth failed in webhook");

    const statusResponse = await axios.get(`${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const status = statusResponse.data.payment_status_description; // "COMPLETED", "FAILED", etc.
    
    if (status === "COMPLETED") {
      const paymentRef = dbAdmin.collection("pending_payments").doc(OrderTrackingId as string);
      const paymentDoc = await paymentRef.get();

      if (paymentDoc.exists) {
        const data = paymentDoc.data();
        if (data?.status === "completed") {
          return res.json({ status: "already_processed" });
        }

        // Atomic update using batch
        const batch = dbAdmin.batch();

        if (data?.type === 'upgrade') {
          // Upgrade user to Premium
          batch.update(dbAdmin.collection("users").doc(data.userId), {
            isPremium: true,
            premiumSince: FieldValue.serverTimestamp()
          });
        } else if (data?.type === 'escrow' && data.postId) {
          const collectionName = data.postType === 'drip' ? 'posts_drip' : 'posts_hustle';
          
          // Mark Post as Escrowed
          batch.update(dbAdmin.collection(collectionName).doc(data.postId), {
            status: 'escrow',
            buyerId: data.userId,
            escrowDate: FieldValue.serverTimestamp()
          });

          // Create transaction record
          const transRef = dbAdmin.collection("transactions").doc();
          batch.set(transRef, {
            userId: data.userId,
            type: data.postType === 'drip' ? 'drip_escrow' : 'hustle_escrow',
            amount: -Math.abs(data.amount), // Record as debit
            postId: data.postId,
            trackingId: OrderTrackingId,
            timestamp: Date.now()
          });
        }

        batch.update(paymentRef, { status: "completed", updatedAt: FieldValue.serverTimestamp() });
        await batch.commit();
        
        console.log(`Payment SUCCESS: ${OrderTrackingId} for user ${data?.userId}`);
      }
    }

    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook Processing Error:", error.message);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Utility API: Register IPN (One-time use)
app.post("/api/payments/register-ipn", async (req, res) => {
  const { url } = req.body;
  const token = await getPesapalAuthToken();
  if (!token) return res.status(500).json({ error: "Auth failed" });

  try {
    const response = await axios.post(`${PESAPAL_URL}/api/URLSetup/RegisterIPN`, {
      url: url,
      ipn_notification_type: "GET"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json(error.response?.data || error.message);
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
