import express from "express";

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Placeholder: Firebase fetch, feature reduction, and OpenAI calls will go here

app.listen(PORT, () => {
  console.log(`Backend service running on port ${PORT}`);
});