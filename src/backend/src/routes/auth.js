// src/routes/auth.js
import express from "express";
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working" });
});

export default router;
