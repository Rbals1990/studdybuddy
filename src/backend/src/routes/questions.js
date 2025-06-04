// src/routes/questions.js
import express from "express";
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Questions routes working" });
});

export default router;
