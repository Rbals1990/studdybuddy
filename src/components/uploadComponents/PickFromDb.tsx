import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Play,
  Trash2,
  Calendar,
  Target,
  ArrowLeft,
} from "lucide-react";

// Interface voor de vragenset structuur
interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  questions: {
    id?: string;
    question: string;
    answer: string;
    created_at?: string;
  }[];
  question_count: number;
  last_score?: number;
}

// Interface voor de API response
interface DatabaseResponse {
  success: boolean;
  data: {
    sets: QuestionSet[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasMore: boolean;
    };
  };
  message?: string;
}

export default function PickFromDb() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    setIsLoading(true);
    setError("");

    const token = localStorage.getItem("studdybuddy_token");

    if (!token) {
      setError("Je bent niet ingelogd. Log opnieuw in.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/questions", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data: DatabaseResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Er ging iets mis bij het ophalen van je vragensets"
        );
      }

      if (data.data && Array.isArray(data.data.sets)) {
        setQuestionSets(data.data.sets);
      } else {
        console.warn("Unexpected API response structure:", data);
        setQuestionSets([]);
        setError("Onverwachte data structuur van de server");
      }
    } catch (error) {
      console.error("Load question sets error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Er ging iets mis bij het ophalen van je vragensets"
      );
      setQuestionSets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSet = (questionSet: QuestionSet) => {
    setSelectedSet(questionSet);
  };

  const handleStartTest = () => {
    if (
      !selectedSet ||
      !selectedSet.questions ||
      selectedSet.questions.length === 0
    ) {
      setError("Deze vragenset heeft geen vragen om mee te oefenen");
      return;
    }

    // Converteer de vragen naar het formaat dat Test.tsx verwacht
    const pairs = selectedSet.questions.map((q) => ({
      question: q.question,
      answer: q.answer,
    }));

    console.log("Starting test with pairs:", pairs);

    navigate("/toets", {
      state: {
        pairs: pairs,
        setName: selectedSet.name,
        setId: selectedSet.id,
      },
    });
  };

  const handleEditSet = () => {
    if (!selectedSet || !selectedSet.questions) {
      setError("Kan deze vragenset niet bewerken - geen vragen gevonden");
      return;
    }

    // Converteer de vragen naar het formaat dat Manual.tsx verwacht
    const pairs = selectedSet.questions.map((q) => ({
      question: q.question,
      answer: q.answer,
    }));

    console.log("Editing set with pairs:", pairs);
    console.log("Selected set:", selectedSet);

    navigate("/upload/manual", {
      state: {
        editMode: true,
        setId: selectedSet.id,
        setName: selectedSet.name,
        pairs: pairs,
      },
    });
  };

  const handleDeleteSet = async (setId: string) => {
    setDeleteLoading(setId);
    const token = localStorage.getItem("studdybuddy_token");

    if (!token) {
      setError("Je bent niet ingelogd. Log opnieuw in.");
      setDeleteLoading(null);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/questions/${setId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Er ging iets mis bij het verwijderen");
      }

      setQuestionSets((prev) => prev.filter((set) => set.id !== setId));
      setShowDeleteConfirm(null);

      if (selectedSet?.id === setId) {
        setSelectedSet(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Er ging iets mis bij het verwijderen"
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFAEF] flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg font-mono">Laden van je vragensets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAEF] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar home
          </button>

          <h2
            className="text-3xl font-semibold mb-4 text-gray-800"
            style={{ fontFamily: "Roboto Condensed" }}
          >
            Kies uit je Opgeslagen Vragensets
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-2xl mx-auto">
              {error}
            </div>
          )}
        </div>

        {/* Content */}
        {!questionSets || questionSets.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Geen vragensets gevonden
            </h3>
            <p className="text-gray-500 mb-6">
              Je hebt nog geen vragensets opgeslagen. Maak je eerste set aan!
            </p>
            <button
              onClick={() => navigate("/upload/manual")}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg"
            >
              Eerste set maken
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lijst van vragensets */}
            <div className="space-y-4">
              <h3
                className="text-xl font-semibold mb-4"
                style={{ fontFamily: "Roboto Condensed" }}
              >
                Jouw Vragensets ({questionSets.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {questionSets.map((set) => (
                  <div
                    key={set.id}
                    className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all ${
                      selectedSet?.id === set.id
                        ? "border-purple-500 shadow-lg"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                    }`}
                    onClick={() => handleSelectSet(set)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-gray-800 truncate pr-2">
                        {set.name}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(set.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={deleteLoading === set.id}
                      >
                        {deleteLoading === set.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Target className="w-4 h-4 mr-1" />
                      <span>{set.question_count} vragen</span>
                      {set.last_score !== undefined && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Laatste score: {set.last_score}%</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Aangemaakt: {formatDate(set.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview en acties */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              {selectedSet ? (
                <>
                  <h3
                    className="text-xl font-semibold mb-4"
                    style={{ fontFamily: "Roboto Condensed" }}
                  >
                    Voorvertoning: {selectedSet.name}
                  </h3>

                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>{selectedSet.question_count}</strong>{" "}
                      vraag-antwoord paren
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Aangemaakt op {formatDate(selectedSet.created_at)}
                    </p>

                    {/* Preview van eerste paar vragen */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Voorbeeld vragen:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedSet.questions &&
                        selectedSet.questions.length > 0 ? (
                          <>
                            {selectedSet.questions
                              .slice(0, 3)
                              .map((q, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">
                                    {q.question}
                                  </span>
                                  <span className="text-gray-600">
                                    {" "}
                                    → {q.answer}
                                  </span>
                                </div>
                              ))}
                            {selectedSet.questions.length > 3 && (
                              <p className="text-xs text-gray-500">
                                ...en nog {selectedSet.questions.length - 3}{" "}
                                meer
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Geen vragen beschikbaar voor preview
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actie buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleStartTest}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      disabled={
                        !selectedSet.questions ||
                        selectedSet.questions.length === 0
                      }
                    >
                      <Play className="w-5 h-5" />
                      <span>Start Oefening</span>
                    </button>

                    <button
                      onClick={handleEditSet}
                      className="w-full bg-yellow-300 hover:bg-yellow-400 text-gray-800 py-3 px-4 rounded-lg transition-colors"
                      disabled={
                        !selectedSet.questions ||
                        selectedSet.questions.length === 0
                      }
                    >
                      Bewerken
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Selecteer een vragenset om een voorvertoning te zien
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Vragenset verwijderen?
              </h3>
              <p className="text-gray-600 mb-6">
                Weet je zeker dat je deze vragenset wilt verwijderen? Deze actie
                kan niet ongedaan worden gemaakt.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleDeleteSet(showDeleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                  disabled={deleteLoading === showDeleteConfirm}
                >
                  {deleteLoading === showDeleteConfirm
                    ? "Verwijderen..."
                    : "Verwijderen"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
