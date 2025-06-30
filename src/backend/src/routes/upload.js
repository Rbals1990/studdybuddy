// backend/src/routes/upload.js
import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { body, validationResult } from "express-validator";
import { supabaseAdmin, supabase } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Alle upload routes zijn protected
router.use(authenticateToken);

// ========================================
// MULTER CONFIGURATION
// ========================================

// Ensure uploads directory exists
const uploadsDir = "uploads/temp";
try {
  await fs.mkdir(uploadsDir, { recursive: true });
} catch (error) {
  console.log("Uploads directory already exists or created");
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Alleen afbeeldingsbestanden zijn toegestaan (JPEG, PNG, GIF, BMP, WebP)"
      )
    );
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

const ocrValidation = [
  body("language")
    .optional()
    .isIn(["nld", "eng", "deu", "fra", "spa", "ita"])
    .withMessage(
      "Ongeldige taal. Ondersteunde talen: Nederlands (nld), Engels (eng), Duits (deu), Frans (fra), Spaans (spa), Italiaans (ita)"
    ),
];

// ========================================
// HELPER FUNCTIONS
// ========================================

const cleanupTempFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Error cleaning up temp file:", error);
  }
};

const uploadToSupabaseStorage = async (filePath, fileName, userId) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const storagePath = `${userId}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from("question-images")
      .upload(storagePath, fileBuffer, {
        contentType: "image/*",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return null;
    }

    return {
      path: data.path,
      fullPath: data.fullPath,
      publicUrl: supabase.storage
        .from("question-images")
        .getPublicUrl(data.path).data.publicUrl,
    };
  } catch (error) {
    console.error("Error uploading to Supabase storage:", error);
    return null;
  }
};

const parseQuestionsFromText = (text) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const questions = [];

  // Try different parsing strategies

  // Strategy 1: Look for patterns like "word - translation" or "word: translation"
  const separatorRegex = /^(.+?)\s*[-:=→]\s*(.+)$/;

  // Strategy 2: Look for alternating lines (question, answer, question, answer)
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try separator pattern first
    const separatorMatch = line.match(separatorRegex);
    if (separatorMatch) {
      const [, question, answer] = separatorMatch;
      if (question.trim() && answer.trim()) {
        questions.push({
          question: question.trim(),
          answer: answer.trim(),
        });
        continue;
      }
    }

    // Try alternating pattern
    if (currentQuestion === null) {
      // This line should be a question
      currentQuestion = line;
    } else {
      // This line should be an answer
      questions.push({
        question: currentQuestion,
        answer: line,
      });
      currentQuestion = null;
    }
  }

  // Filter out very short or very long entries
  return questions.filter(
    (q) =>
      q.question.length >= 1 &&
      q.question.length <= 500 &&
      q.answer.length >= 1 &&
      q.answer.length <= 500
  );
};

const performOCR = async (imagePath, language = "nld") => {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, language, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return {
      success: true,
      text: text.trim(),
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ========================================
// ROUTES
// ========================================

// @route   POST /api/upload/image
// @desc    Upload afbeelding en voer OCR uit
// @access  Private
router.post(
  "/image",
  upload.single("image"),
  ocrValidation,
  async (req, res) => {
    let tempFilePath = null;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validatie fouten",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Geen bestand geüpload",
        });
      }

      tempFilePath = req.file.path;
      const { language = "nld" } = req.body;

      // Perform OCR
      console.log("Starting OCR process...");
      const ocrResult = await performOCR(tempFilePath, language);

      if (!ocrResult.success) {
        await cleanupTempFile(tempFilePath);
        return res.status(500).json({
          success: false,
          message: "Er ging iets mis bij het lezen van de afbeelding",
          error: ocrResult.error,
        });
      }

      // Parse questions from OCR text
      const questions = parseQuestionsFromText(ocrResult.text);

      if (questions.length === 0) {
        await cleanupTempFile(tempFilePath);
        return res.status(400).json({
          success: false,
          message:
            "Geen vragen gevonden in de afbeelding. Zorg ervoor dat vragen en antwoorden duidelijk gescheiden zijn (bijv. met een streepje of dubbele punt).",
          extractedText: ocrResult.text,
        });
      }

      // Upload to Supabase Storage (optional - for keeping records)
      const storageResult = await uploadToSupabaseStorage(
        tempFilePath,
        req.file.originalname,
        req.user.id
      );

      // Save to database
      const { data: uploadRecord, error: dbError } = await supabaseAdmin
        .from("uploaded_images")
        .insert([
          {
            user_id: req.user.id,
            file_name: req.file.originalname,
            file_path: storageResult?.path || tempFilePath,
            file_size: req.file.size,
            processed: true,
            extracted_text: ocrResult.text,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error("Error saving upload record:", dbError);
        // Continue anyway - the main functionality works
      }

      // Cleanup temp file
      await cleanupTempFile(tempFilePath);

      res.json({
        success: true,
        message: `${questions.length} vraag${
          questions.length !== 1 ? "en" : ""
        } succesvol geëxtraheerd uit de afbeelding`,
        data: {
          questions,
          extractedText: ocrResult.text,
          uploadId: uploadRecord?.id,
          imageUrl: storageResult?.publicUrl,
          totalFound: questions.length,
        },
      });
    } catch (error) {
      console.error("Upload and OCR error:", error);

      // Cleanup temp file in case of error
      if (tempFilePath) {
        await cleanupTempFile(tempFilePath);
      }

      res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het verwerken van de afbeelding",
      });
    }
  }
);

// @route   GET /api/upload/history
// @desc    Haal upload geschiedenis op
// @access  Private
router.get("/history", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data: uploads, error } = await supabaseAdmin
      .from("uploaded_images")
      .select("id, file_name, file_size, processed, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error("Error fetching upload history:", error);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het ophalen van de upload geschiedenis",
      });
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("uploaded_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id);

    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasMore: offset + uploads.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Get upload history error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het ophalen van de upload geschiedenis",
    });
  }
});

// @route   GET /api/upload/:id
// @desc    Haal specifieke upload details op
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: upload, error } = await supabaseAdmin
      .from("uploaded_images")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !upload) {
      return res.status(404).json({
        success: false,
        message: "Upload niet gevonden",
      });
    }

    // Parse questions from stored text if available
    let questions = [];
    if (upload.extracted_text) {
      questions = parseQuestionsFromText(upload.extracted_text);
    }

    res.json({
      success: true,
      data: {
        upload,
        questions,
      },
    });
  } catch (error) {
    console.error("Get upload details error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het ophalen van de upload details",
    });
  }
});

// @route   DELETE /api/upload/:id
// @desc    Verwijder upload record
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get upload details first
    const { data: upload, error: getError } = await supabaseAdmin
      .from("uploaded_images")
      .select("file_path, user_id")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (getError || !upload) {
      return res.status(404).json({
        success: false,
        message: "Upload niet gevonden",
      });
    }

    // Delete from Supabase Storage if it exists
    if (upload.file_path && upload.file_path.includes(req.user.id)) {
      const { error: storageError } = await supabase.storage
        .from("question-images")
        .remove([upload.file_path]);

      if (storageError) {
        console.error("Error deleting from storage:", storageError);
        // Continue anyway
      }
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from("uploaded_images")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (deleteError) {
      console.error("Error deleting upload record:", deleteError);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het verwijderen van de upload",
      });
    }

    res.json({
      success: true,
      message: "Upload succesvol verwijderd",
    });
  } catch (error) {
    console.error("Delete upload error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het verwijderen van de upload",
    });
  }
});

// Error handling middleware voor multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Bestand is te groot. Maximale bestandsgrootte is 10MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Er ging iets mis bij het uploaden van het bestand",
    });
  }

  if (error.message.includes("toegestaan")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

export default router;
