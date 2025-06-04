// src/routes/upload.js
import express from "express";
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Upload routes working" });
});

export default router;
