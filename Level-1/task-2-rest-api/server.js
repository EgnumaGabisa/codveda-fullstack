const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let campaigns = [
  { id: 1, title: "Product Launch Promo", channel: "Email & Social", status: "active" },
  { id: 2, title: "Q4 Lead Gen Campaign", channel: "Landing Page", status: "planned" }
];
let nextId = 3;

app.get("/api/campaigns", (req, res) => {
  res.status(200).json({ count: campaigns.length, data: campaigns });
});

app.get("/api/campaigns/:id", (req, res) => {
  const id = Number(req.params.id);
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  res.status(200).json({ data: campaign });
});

app.post("/api/campaigns", (req, res) => {
  const { title, channel = "General", status = "planned" } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const newCampaign = {
    id: nextId++,
    title: title.trim(),
    channel: String(channel).trim(),
    status
  };
  campaigns.push(newCampaign);
  res.status(201).json({ data: newCampaign });
});

app.put("/api/campaigns/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  const { title, channel, status } = req.body || {};
  if (title !== undefined && (!title || !String(title).trim())) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }
  campaigns[idx] = {
    ...campaigns[idx],
    ...(title !== undefined ? { title: String(title).trim() } : {}),
    ...(channel !== undefined ? { channel: String(channel).trim() } : {}),
    ...(status !== undefined ? { status } : {})
  };
  res.status(200).json({ data: campaigns[idx] });
});

app.delete("/api/campaigns/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = campaigns.some((c) => c.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  campaigns = campaigns.filter((c) => c.id !== id);
  res.status(200).json({ message: "Campaign deleted", id });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log("API running on http://localhost:" + PORT);
});
