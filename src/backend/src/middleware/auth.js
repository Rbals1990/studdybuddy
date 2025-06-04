// backend/src/middleware/auth.js
import { supabase } from "../config/database.js";

// Middleware om JWT token te verifiëren
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access token required",
      });
    }

    // Verifieer token met Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({
        error: "Invalid or expired token",
      });
    }

    // Voeg user info toe aan request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Middleware om te checken of user profile bestaat
export const ensureUserProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", req.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    if (!profile) {
      return res.status(404).json({
        error: "User profile not found. Please complete registration.",
      });
    }

    req.userProfile = profile;
    next();
  } catch (error) {
    console.error("User profile check error:", error);
    res.status(500).json({
      error: "Failed to verify user profile",
    });
  }
};

// Optional middleware: alleen voor development/debugging
export const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.user) {
    console.log(`User: ${req.user.email} (${req.userId})`);
  }
  next();
};
