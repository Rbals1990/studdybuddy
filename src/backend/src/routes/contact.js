// backend/src/routes/mail.js

import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Contactformulier endpoint
router.post("/", async (req, res) => {
  const { name, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ message: "Naam en bericht zijn verplicht." });
  }

  try {
    // Transporter instellen (voorbeeld met Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "StuddyBuddyContact",
      to: "devtestrens@gmail.com",
      subject: "Nieuw bericht via contactformulier",
      text: `Naam: ${name}\n\nBericht:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Bericht succesvol verzonden." });
  } catch (error) {
    console.error("Fout bij verzenden mail:", error);
    res
      .status(500)
      .json({ message: "Er is iets misgegaan bij het verzenden." });
  }
});

export default router;
