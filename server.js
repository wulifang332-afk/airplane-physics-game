/**
 * 简易代理服务器 — 将前端请求转发到 Anthropic API
 * 用法：
 *   1. 设置环境变量 ANTHROPIC_API_KEY
 *   2. node server.js
 *   3. 前端 .env 中设置 VITE_API_URL=http://localhost:3001/api/messages
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("❌ 请设置环境变量 ANTHROPIC_API_KEY");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.post("/api/messages", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 代理服务器运行在 http://localhost:${PORT}`);
});
