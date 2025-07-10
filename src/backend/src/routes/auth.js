// backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { supabaseAdmin } from "../config/database.js";

const router = express.Router();

// Rate limiting specifiek voor auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 10, // max 10 auth attempts per IP per 15 minuten
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Voornaam moet tussen 2 en 100 tekens zijn")
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage(
      "Voornaam mag alleen letters, spaties, apostrofes en koppeltekens bevatten"
    ),

  body("email").isEmail().normalizeEmail().withMessage("Ongeldig emailadres"),

  body("password")
    .isLength({ min: 10 })
    .withMessage("Wachtwoord moet minimaal 10 tekens lang zijn")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Wachtwoord moet minimaal 1 hoofdletter, 1 kleine letter, 1 cijfer en 1 speciaal teken bevatten"
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Wachtwoorden komen niet overeen");
    }
    return true;
  }),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Ongeldig emailadres"),

  body("password").notEmpty().withMessage("Wachtwoord is verplicht"),
];

// ========================================
// HELPER FUNCTIES
// ========================================

const generateJWT = (userId, email) => {
  return jwt.sign(
    {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "6h",
      issuer: "studdybuddy-api",
      audience: "studdybuddy-app",
    }
  );
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// ========================================
// ROUTES
// ========================================

// @route   POST /api/auth/register
// @desc    Registreer nieuwe gebruiker
// @access  Public
router.post("/register", authLimiter, registerValidation, async (req, res) => {
  try {
    // Validatie errors checken
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validatie fouten",
        errors: errors.array(),
      });
    }

    const { firstName, email, password } = req.body;

    // Check of email al bestaat
    const { data: existingUser } = await supabaseAdmin
      .from("user_profiles")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Een account met dit emailadres bestaat al",
      });
    }

    // Hash wachtwoord
    const hashedPassword = await hashPassword(password);

    // Maak nieuwe gebruiker aan in Supabase Auth
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Supabase Auth error:", authError);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het aanmaken van het account",
      });
    }

    // Voeg gebruiker toe aan user_profiles tabel
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert([
        {
          id: authUser.user.id,
          first_name: firstName,
          email: email,
          password: hashedPassword,
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Cleanup: verwijder auth user als profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);

      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het aanmaken van het profiel",
      });
    }

    // Genereer JWT token
    const token = generateJWT(profile.id, profile.email);

    res.status(201).json({
      success: true,
      message: "Account succesvol aangemaakt",
      data: {
        user: {
          id: profile.id,
          firstName: profile.first_name,
          email: profile.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het registreren",
    });
  }
});

// @route   POST /api/auth/login
// @desc    Log gebruiker in
// @access  Public
router.post("/login", authLimiter, loginValidation, async (req, res) => {
  try {
    // Validatie errors checken
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validatie fouten",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Zoek gebruiker
    const { data: user, error: userError } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: "Ongeldige inloggegevens",
      });
    }

    // Check wachtwoord
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Ongeldige inloggegevens",
      });
    }

    // Genereer JWT token
    const token = generateJWT(user.id, user.email);

    res.json({
      success: true,
      message: "Succesvol ingelogd",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het inloggen",
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Log gebruiker uit (client-side token removal)
// @access  Private
router.post("/logout", (req, res) => {
  // JWT logout is stateless - client moet token verwijderen
  res.json({
    success: true,
    message: "Succesvol uitgelogd",
  });
});

// @route   GET /api/auth/me
// @desc    Haal huidige gebruiker op
// @access  Private
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Geen geldig authenticatie token gevonden",
      });
    }

    const token = authHeader.substring(7);

    // Verifieer JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Haal gebruiker op
    const { data: user, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, first_name, email, created_at")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Gebruiker niet gevonden",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          email: user.email,
          memberSince: user.created_at,
        },
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Ongeldig authenticatie token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authenticatie token is verlopen",
      });
    }

    console.error("Auth verification error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het verifiëren van de authenticatie",
    });
  }
});

export default router;
