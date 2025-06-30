// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/database.js";

// Middleware om JWT token te verifiëren
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Geen geldig authenticatie token gevonden",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists in database
    const { data: user, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, first_name, email")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Gebruiker niet gevonden",
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      firstName: user.first_name,
      email: user.email,
    };

    next();
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

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het verifiëren van de authenticatie",
    });
  }
};

// Optional middleware - niet vereist maar voegt user info toe als token aanwezig is
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue zonder user info
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, first_name, email")
      .eq("id", decoded.userId)
      .single();

    if (!error && user) {
      req.user = {
        id: user.id,
        firstName: user.first_name,
        email: user.email,
      };
    }

    next();
  } catch (error) {
    // In optional auth, we don't return errors, just continue
    next();
  }
};
