// backend/src/routes/questions.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import { supabaseAdmin } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Alle question routes zijn protected
router.use(authenticateToken);

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

const questionSetValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Naam is verplicht en mag maximaal 255 tekens lang zijn"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Beschrijving mag maximaal 1000 tekens lang zijn"),

  body("questions")
    .isArray({ min: 1, max: 100 })
    .withMessage("Er moeten minimaal 1 en maximaal 100 vragen zijn"),

  body("questions.*.question")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Vraag is verplicht en mag maximaal 500 tekens lang zijn"),

  body("questions.*.answer")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Antwoord is verplicht en mag maximaal 500 tekens lang zijn"),
];

const uuidValidation = [
  param("id").isUUID().withMessage("Ongeldige ID format"),
];

const practiceSessionValidation = [
  body("score")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Score moet tussen 0 en 100 zijn"),

  body("totalQuestions")
    .isInt({ min: 1 })
    .withMessage("Totaal aantal vragen moet minimaal 1 zijn"),

  body("correctAnswers")
    .isInt({ min: 0 })
    .withMessage("Aantal juiste antwoorden moet 0 of hoger zijn"),

  body("timeSpent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Besteedde tijd moet 0 of hoger zijn"),

  body("results").isArray().withMessage("Resultaten moeten een array zijn"),
];

// ========================================
// HELPER FUNCTIONS
// ========================================

const checkQuestionSetOwnership = async (setId, userId) => {
  const { data, error } = await supabaseAdmin
    .from("question_sets")
    .select("user_id")
    .eq("id", setId)
    .single();

  return !error && data && data.user_id === userId;
};

// ========================================
// ROUTES
// ========================================

// @route   GET /api/questions
// @desc    Haal alle question sets van de gebruiker op
// @access  Private
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sort = "updated_at",
      order = "desc",
    } = req.query;
    const offset = (page - 1) * limit;

    // Valideer sort en order parameters
    const validSortFields = ["created_at", "updated_at", "name"];
    const validOrderValues = ["asc", "desc"];

    const sortField = validSortFields.includes(sort) ? sort : "updated_at";
    const sortOrder = validOrderValues.includes(order) ? order : "desc";

    // Haal vragensets op met hun vragen
    const { data: questionSets, error: setsError } = await supabaseAdmin
      .from("question_sets")
      .select(
        `
        id,
        name,
        description,
        created_at,
        updated_at,
        questions (
          id,
          question,
          answer,
          created_at
        )
      `
      )
      .eq("user_id", req.user.id)
      .order(sortField, { ascending: sortOrder === "asc" })
      .range(offset, offset + parseInt(limit) - 1);

    if (setsError) {
      console.error("Error fetching question sets:", setsError);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het ophalen van je vragensets",
        error: setsError.message,
      });
    }

    // Haal totaal aantal sets op voor paginering
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("question_sets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id);

    if (countError) {
      console.error("Error getting count:", countError);
      // Continue zonder count - niet kritiek
    }

    // Formatteer de data voor frontend
    const formattedSets = questionSets.map((set) => ({
      id: set.id,
      name: set.name,
      description: set.description,
      created_at: set.created_at,
      updated_at: set.updated_at,
      questions: set.questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        created_at: q.created_at,
      })),
      question_count: set.questions.length,
      last_score: null, // TODO: Implementeer als je practice sessions hebt
    }));

    res.json({
      success: true,
      data: {
        sets: formattedSets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalCount ? Math.ceil(totalCount / limit) : 1,
          totalCount: totalCount || 0,
          hasMore: totalCount
            ? offset + formattedSets.length < totalCount
            : false,
        },
      },
    });
  } catch (error) {
    console.error("Get question sets error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het ophalen van je vragensets",
    });
  }
});

// @route   GET /api/questions/:id
// @desc    Haal specifieke question set met vragen op
// @access  Private
router.get("/:id", uuidValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validatie fouten",
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    // Check ownership
    const hasAccess = await checkQuestionSetOwnership(id, req.user.id);
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: "Vragenset niet gevonden",
      });
    }

    // Get question set with questions
    const { data: questionSet, error: setError } = await supabaseAdmin
      .from("question_sets")
      .select(
        `
        id,
        name,
        description,
        created_at,
        updated_at,
        last_practiced_at,
        total_questions,
        times_practiced,
        best_score,
        last_score
      `
      )
      .eq("id", id)
      .single();

    if (setError) {
      console.error("Error fetching question set:", setError);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het ophalen van de vragenset",
      });
    }

    // Get questions for this set
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select("id, question, answer, question_order")
      .eq("set_id", id)
      .order("question_order", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het ophalen van de vragen",
      });
    }

    // Format response to match frontend expectations
    const formattedSet = {
      id: questionSet.id,
      name: questionSet.name,
      description: questionSet.description,
      created_at: questionSet.created_at,
      updated_at: questionSet.updated_at,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        created_at: null, // Not needed for individual fetch
      })),
      question_count: questions.length,
      last_score: questionSet.last_score,
    };

    res.json({
      success: true,
      data: formattedSet,
    });
  } catch (error) {
    console.error("Get question set error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het ophalen van de vragenset",
    });
  }
});

// @route   POST /api/questions
// @desc    Maak nieuwe question set aan
// @access  Private
router.post("/", questionSetValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validatie fouten",
        errors: errors.array(),
      });
    }

    const { name, description = "", questions } = req.body;

    // Start database transaction
    const { data: questionSet, error: setError } = await supabaseAdmin
      .from("question_sets")
      .insert([
        {
          user_id: req.user.id,
          name: name.trim(),
          description: description.trim(),
          total_questions: questions.length,
        },
      ])
      .select()
      .single();

    if (setError) {
      console.error("Error creating question set:", setError);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het aanmaken van de vragenset",
      });
    }

    // Insert questions
    const questionsToInsert = questions.map((q, index) => ({
      set_id: questionSet.id,
      question: q.question.trim(),
      answer: q.answer.trim(),
      question_order: index + 1,
    }));

    const { data: insertedQuestions, error: questionsError } =
      await supabaseAdmin.from("questions").insert(questionsToInsert).select();

    if (questionsError) {
      console.error("Error inserting questions:", questionsError);
      // Cleanup: delete the question set if questions failed
      await supabaseAdmin
        .from("question_sets")
        .delete()
        .eq("id", questionSet.id);

      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het aanmaken van de vragen",
      });
    }

    res.status(201).json({
      success: true,
      message: "Vragenset succesvol aangemaakt",
      data: {
        ...questionSet,
        questions: insertedQuestions,
      },
    });
  } catch (error) {
    console.error("Create question set error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het aanmaken van de vragenset",
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question set
// @access  Private
router.put(
  "/:id",
  [...uuidValidation, ...questionSetValidation],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validatie fouten",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { name, description = "", questions } = req.body;

      // Check ownership
      const hasAccess = await checkQuestionSetOwnership(id, req.user.id);
      if (!hasAccess) {
        return res.status(404).json({
          success: false,
          message: "Vragenset niet gevonden",
        });
      }

      // Update question set
      const { data: updatedSet, error: setError } = await supabaseAdmin
        .from("question_sets")
        .update({
          name: name.trim(),
          description: description.trim(),
          total_questions: questions.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (setError) {
        console.error("Error updating question set:", setError);
        return res.status(500).json({
          success: false,
          message: "Er ging iets mis bij het bijwerken van de vragenset",
        });
      }

      // Delete existing questions
      const { error: deleteError } = await supabaseAdmin
        .from("questions")
        .delete()
        .eq("set_id", id);

      if (deleteError) {
        console.error("Error deleting old questions:", deleteError);
        return res.status(500).json({
          success: false,
          message: "Er ging iets mis bij het bijwerken van de vragen",
        });
      }

      // Insert new questions
      const questionsToInsert = questions.map((q, index) => ({
        set_id: id,
        question: q.question.trim(),
        answer: q.answer.trim(),
        question_order: index + 1,
      }));

      const { data: insertedQuestions, error: questionsError } =
        await supabaseAdmin
          .from("questions")
          .insert(questionsToInsert)
          .select();

      if (questionsError) {
        console.error("Error inserting new questions:", questionsError);
        return res.status(500).json({
          success: false,
          message: "Er ging iets mis bij het bijwerken van de vragen",
        });
      }

      res.json({
        success: true,
        message: "Vragenset succesvol bijgewerkt",
        data: {
          ...updatedSet,
          questions: insertedQuestions,
        },
      });
    } catch (error) {
      console.error("Update question set error:", error);
      res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het bijwerken van de vragenset",
      });
    }
  }
);

// @route   DELETE /api/questions/:id
// @desc    Verwijder question set
// @access  Private
router.delete("/:id", uuidValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validatie fouten",
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    // Check ownership
    const hasAccess = await checkQuestionSetOwnership(id, req.user.id);
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: "Vragenset niet gevonden",
      });
    }

    // Get the name before deleting for confirmation message
    const { data: setToDelete, error: getError } = await supabaseAdmin
      .from("question_sets")
      .select("name")
      .eq("id", id)
      .single();

    if (getError) {
      console.error("Error getting set name:", getError);
    }

    // Delete question set (cascade will delete questions and related data)
    const { error } = await supabaseAdmin
      .from("question_sets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting question set:", error);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het verwijderen van de vragenset",
      });
    }

    res.json({
      success: true,
      message: setToDelete
        ? `Vragenset "${setToDelete.name}" succesvol verwijderd`
        : "Vragenset succesvol verwijderd",
    });
  } catch (error) {
    console.error("Delete question set error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het verwijderen van de vragenset",
    });
  }
});

// @route   POST /api/questions/:id/practice
// @desc    Sla practice session resultaten op
// @access  Private
router.post(
  "/:id/practice",
  [...uuidValidation, ...practiceSessionValidation],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validatie fouten",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { score, totalQuestions, correctAnswers, timeSpent, results } =
        req.body;

      // Check ownership
      const hasAccess = await checkQuestionSetOwnership(id, req.user.id);
      if (!hasAccess) {
        return res.status(404).json({
          success: false,
          message: "Vragenset niet gevonden",
        });
      }

      // Create practice session
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("practice_sessions")
        .insert([
          {
            user_id: req.user.id,
            set_id: id,
            score,
            total_questions: totalQuestions,
            correct_answers: correctAnswers,
            time_spent: timeSpent || null,
          },
        ])
        .select()
        .single();

      if (sessionError) {
        console.error("Error creating practice session:", sessionError);
        return res.status(500).json({
          success: false,
          message: "Er ging iets mis bij het opslaan van de oefensessie",
        });
      }

      // Insert question results if provided
      if (results && results.length > 0) {
        const resultsToInsert = results.map((result) => ({
          session_id: session.id,
          question_id: result.questionId,
          user_answer: result.userAnswer,
          is_correct: result.isCorrect,
          time_taken: result.timeTaken || null,
        }));

        const { error: resultsError } = await supabaseAdmin
          .from("question_results")
          .insert(resultsToInsert);

        if (resultsError) {
          console.error("Error inserting question results:", resultsError);
          // Continue anyway - session is more important than detailed results
        }
      }

      // Update question set statistics
      const { data: currentSet, error: getSetError } = await supabaseAdmin
        .from("question_sets")
        .select("times_practiced, best_score")
        .eq("id", id)
        .single();

      if (!getSetError && currentSet) {
        const newBestScore = Math.max(currentSet.best_score || 0, score);

        const { error: updateSetError } = await supabaseAdmin
          .from("question_sets")
          .update({
            times_practiced: (currentSet.times_practiced || 0) + 1,
            best_score: newBestScore,
            last_score: score,
            last_practiced_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (updateSetError) {
          console.error("Error updating set statistics:", updateSetError);
          // Continue anyway
        }
      }

      res.status(201).json({
        success: true,
        message: "Oefensessie succesvol opgeslagen",
        data: {
          sessionId: session.id,
          score,
          improvement: currentSet && score > (currentSet.best_score || 0),
        },
      });
    } catch (error) {
      console.error("Save practice session error:", error);
      res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het opslaan van de oefensessie",
      });
    }
  }
);

// @route   GET /api/questions/:id/stats
// @desc    Haal statistieken op voor een vragenset
// @access  Private
router.get("/:id/stats", uuidValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validatie fouten",
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    // Check ownership
    const hasAccess = await checkQuestionSetOwnership(id, req.user.id);
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: "Vragenset niet gevonden",
      });
    }

    // Get basic stats
    const { data: questionSet, error: setError } = await supabaseAdmin
      .from("question_sets")
      .select(
        `
        name,
        times_practiced,
        best_score,
        last_score,
        last_practiced_at,
        total_questions
      `
      )
      .eq("id", id)
      .single();

    if (setError) {
      console.error("Error fetching question set stats:", setError);
      return res.status(500).json({
        success: false,
        message: "Er ging iets mis bij het ophalen van de statistieken",
      });
    }

    // Get recent practice sessions (last 10)
    const { data: recentSessions, error: sessionsError } = await supabaseAdmin
      .from("practice_sessions")
      .select("score, completed_at, time_spent")
      .eq("set_id", id)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error("Error fetching recent sessions:", sessionsError);
      // Continue without recent sessions
    }

    // Calculate average score
    const averageScore =
      recentSessions?.length > 0
        ? recentSessions.reduce((sum, session) => sum + session.score, 0) /
          recentSessions.length
        : 0;

    res.json({
      success: true,
      data: {
        questionSet: {
          name: questionSet.name,
          totalQuestions: questionSet.total_questions,
          timesPracticed: questionSet.times_practiced || 0,
          bestScore: questionSet.best_score || 0,
          lastScore: questionSet.last_score || 0,
          lastPracticedAt: questionSet.last_practiced_at,
          averageScore: Math.round(averageScore * 100) / 100,
        },
        recentSessions: recentSessions || [],
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Er ging iets mis bij het ophalen van de statistieken",
    });
  }
});

export default router;
