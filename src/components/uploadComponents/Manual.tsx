import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Interface voor de vraag structuur
interface Question {
  question: string;
  answer: string;
}

// Interface voor de API response
interface SaveResponse {
  data: {
    id: string;
    name: string;
    questions: Question[];
  };
}

// Interface voor location state (edit mode)
interface LocationState {
  editMode?: boolean;
  setId?: string;
  setName?: string;
  pairs?: Question[];
}

export default function Manual() {
  const [pairs, setPairs] = useState([{ question: "", answer: "" }]);
  const [setName, setSetName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Check voor edit mode bij component mount
  useEffect(() => {
    const state = location.state as LocationState;
    console.log("Received state in Manual:", state);

    if (state?.editMode && state?.setId && state?.setName && state?.pairs) {
      // EDIT MODE
      setIsEditMode(true);
      setEditingSetId(state.setId);
      setSetName(state.setName);
      setPairs(
        state.pairs.length > 0 ? state.pairs : [{ question: "", answer: "" }]
      );
    } else if (state?.pairs) {
      // NIEUWE SET, GEKOMEN VANUIT Picture.tsx
      console.log("Received new pairs from Picture.tsx:", state.pairs);
      setIsEditMode(false);
      setPairs(
        state.pairs.length > 0 ? state.pairs : [{ question: "", answer: "" }]
      );
    }
  }, [location.state]);

  const handleChange = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    const updated = [...pairs];
    updated[index][field] = value.toLowerCase();
    setPairs(updated);
  };

  const addPair = () => {
    setPairs([...pairs, { question: "", answer: "" }]);
  };

  const addFivePairs = () => {
    setPairs([
      ...pairs,
      ...Array.from({ length: 5 }, () => ({ question: "", answer: "" })),
    ]);
  };

  const removePair = (index: number) => {
    const updated = pairs.filter((_, i) => i !== index);
    setPairs(updated);
  };

  // Validatie functie
  const validateForm = () => {
    if (!setName.trim()) {
      setError("Vul een naam in voor je vragenset");
      return false;
    }

    const validPairs = pairs.filter(
      (pair) => pair.question.trim() && pair.answer.trim()
    );

    if (validPairs.length === 0) {
      setError("Voeg minstens één vraag-antwoord paar toe");
      return false;
    }

    return true;
  };

  // API call functie voor nieuwe sets
  const saveToDatabase = async (): Promise<SaveResponse | false> => {
    const token = localStorage.getItem("studdybuddy_token");

    if (!token) {
      setError("Je bent niet ingelogd. Log opnieuw in.");
      return false;
    }

    try {
      // Filter lege paren eruit
      const validPairs = pairs.filter(
        (pair) => pair.question.trim() && pair.answer.trim()
      );

      const requestBody = {
        name: setName.trim(),
        description: "", // Optioneel, kan toegevoegd worden
        questions: validPairs.map((pair) => ({
          question: pair.question.trim(),
          answer: pair.answer.trim(),
        })),
      };

      const response = await fetch(`http://localhost:5000/api/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Er ging iets mis bij het opslaan");
      }

      return data as SaveResponse;
    } catch (error) {
      console.error("Save error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Er ging iets mis bij het opslaan"
      );
      return false;
    }
  };

  // API call functie voor het updaten van bestaande sets
  const updateInDatabase = async (): Promise<SaveResponse | false> => {
    if (!editingSetId) return false;

    const token = localStorage.getItem("studdybuddy_token");

    if (!token) {
      setError("Je bent niet ingelogd. Log opnieuw in.");
      return false;
    }

    try {
      // Filter lege paren eruit
      const validPairs = pairs.filter(
        (pair) => pair.question.trim() && pair.answer.trim()
      );

      const requestBody = {
        name: setName.trim(),
        description: "", // Optioneel, kan toegevoegd worden
        questions: validPairs.map((pair) => ({
          question: pair.question.trim(),
          answer: pair.answer.trim(),
        })),
      };

      const response = await fetch(
        `http://localhost:5000/api/questions/${editingSetId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Er ging iets mis bij het bijwerken");
      }

      return data as SaveResponse;
    } catch (error) {
      console.error("Update error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Er ging iets mis bij het bijwerken"
      );
      return false;
    }
  };

  const handleSave = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let result: SaveResponse | false;

      if (isEditMode) {
        result = await updateInDatabase();
      } else {
        result = await saveToDatabase();
      }

      if (result) {
        console.log("Succesvol opgeslagen:", result);
        const message = isEditMode
          ? "Vragenset succesvol bijgewerkt!"
          : "Vragenset succesvol opgeslagen!";
        alert(message);
        navigate("/");
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let result: SaveResponse | false;

      if (isEditMode) {
        result = await updateInDatabase();
      } else {
        result = await saveToDatabase();
      }

      if (result) {
        // Dan naar toets navigeren met de opgeslagen data
        navigate("/toets", {
          state: {
            pairs: result.data.questions.map((q: Question) => ({
              question: q.question,
              answer: q.answer,
            })),
            setName: result.data.name,
            setId: result.data.id,
          },
        });
      }
    } catch (error) {
      console.error("Start test failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate("/upload/pick-from-db");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAEF] py-10 px-4">
      <div className="max-w-4xl mx-auto text-center mb-6">
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ fontFamily: "Roboto Condensed" }}
        >
          {isEditMode ? "Vragenset Bewerken" : "Handmatig Woorden Toevoegen"}
        </h2>

        {isEditMode && (
          <p className="text-sm text-purple-600 mb-4">
            Je bewerkt nu een bestaande vragenset. Wijzigingen worden opgeslagen
            wanneer je op "Opslaan" klikt.
          </p>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Welke naam wil je gebruiken?"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          className="bg-white w-full p-3 border rounded mb-6 font-mono"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-center"
          >
            <input
              type="text"
              placeholder={`Vraag ${index + 1}`}
              value={pair.question}
              onChange={(e) => handleChange(index, "question", e.target.value)}
              className="bg-white p-2 border rounded font-mono"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder={`Antwoord ${index + 1}`}
              value={pair.answer}
              onChange={(e) => handleChange(index, "answer", e.target.value)}
              className="bg-white p-2 border rounded font-mono"
              disabled={isLoading}
            />
            <button
              onClick={() => removePair(index)}
              className="text-red-600 text-sm border border-red-400 rounded px-2 py-1 hover:bg-red-100"
              disabled={isLoading}
            >
              Verwijderen
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-6 flex flex-wrap justify-center gap-4">
        <button
          onClick={addPair}
          className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 py-2 px-4 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          Voeg een paar toe
        </button>
        <button
          onClick={addFivePairs}
          className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 py-2 px-4 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          Voeg 5 paren toe
        </button>
        <button
          onClick={handleStartTest}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Bezig..." : "Start test"}
        </button>
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading
            ? isEditMode
              ? "Bijwerken..."
              : "Opslaan..."
            : isEditMode
            ? "Bijwerken"
            : "Opslaan"}
        </button>
        {isEditMode && (
          <button
            onClick={handleCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-6 rounded disabled:opacity-50"
            disabled={isLoading}
          >
            Annuleren
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-6 text-center">
        <p
          className="text-sm text-purple-700 underline cursor-pointer"
          onClick={() => !isLoading && handleCancel()}
        >
          {isEditMode ? "Terug naar vragensets" : "Terug naar de homepagina"}
        </p>
      </div>
    </div>
  );
}
