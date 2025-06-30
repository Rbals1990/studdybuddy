import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Camera, Edit, Play, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";

interface QuestionAnswer {
  question: string;
  answer: string;
}

export default function Picture() {
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [ocrText, setOcrText] = useState<string>("");
  const [parsedQuestions, setParsedQuestions] = useState<QuestionAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Reset previous results
      setOcrText("");
      setParsedQuestions([]);
      setShowResults(false);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Tesseract.js OCR processing met Nederlandse en Engelse taalondersteuning
      const result = await Tesseract.recognize(
        selectedImage,
        "nld+eng", // Nederlandse en Engelse taalherkenning
        {
          logger: (m) => {
            console.log(m);
            // Update progress bar
            if (m.status === "recognizing text") {
              setProcessingProgress(Math.round(m.progress * 100));
            }
          },
        }
      );

      const extractedText = result.data.text;
      setOcrText(extractedText);

      const questions = parseQuestionsFromText(extractedText);
      setParsedQuestions(questions);
      setShowResults(true);
    } catch (error) {
      console.error("OCR Error:", error);
      alert(
        "Er is een fout opgetreden bij het verwerken van de afbeelding. Controleer of de afbeelding duidelijk leesbaar is."
      );
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const parseQuestionsFromText = (text: string): QuestionAnswer[] => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const questions: QuestionAnswer[] = [];

    console.log("Parsing text:", text);
    console.log("Lines:", lines);

    // Detecteer het format van de tekst
    const hasVraagAntwoord =
      text.toLowerCase().includes("vraag") &&
      text.toLowerCase().includes("antwoord");
    const hasNumberedQuestions = /^\d+\./.test(
      lines.find((line) => line.trim()) || ""
    );

    // Verbeterde detectie voor twee-kolommen format
    const hasTwoColumns = lines.some((line) => {
      // Probeer verschillende scheidingstekens
      const separators = [/\s{3,}/, /\t+/, /\s*-\s*/, /\s*:\s*/];
      return separators.some((sep) => {
        const parts = line.split(sep).filter((part) => part.trim().length > 0);
        return (
          parts.length >= 2 &&
          parts[0].trim().length > 0 &&
          parts[1].trim().length > 0
        );
      });
    });

    console.log("Format detection:", {
      hasVraagAntwoord,
      hasNumberedQuestions,
      hasTwoColumns,
    });

    if (hasTwoColumns) {
      // Format: woord1    woord2 (zoals Nederlands-Engels)
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) continue;

        // Probeer verschillende scheidingstekens
        let parts: string[] = [];
        const separators = [/\s{3,}/, /\t+/, /\s*-\s*/, /\s*:\s*/];

        for (const separator of separators) {
          parts = trimmedLine
            .split(separator)
            .filter((part) => part.trim().length > 0);
          if (parts.length >= 2) break;
        }

        if (parts.length >= 2) {
          questions.push({
            question: parts[0].trim(),
            answer: parts.slice(1).join(" ").trim(),
          });
        }
      }
    } else if (hasVraagAntwoord) {
      // Format: Vraag X: ... Antwoord X: ...
      let currentQuestion = "";
      let currentAnswer = "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (
          trimmedLine.toLowerCase().includes("vraag") ||
          trimmedLine.includes("?")
        ) {
          if (currentQuestion && currentAnswer) {
            questions.push({
              question: currentQuestion,
              answer: currentAnswer,
            });
          }
          currentQuestion = trimmedLine.replace(/vraag\s*\d*:?\s*/i, "").trim();
          currentAnswer = "";
        } else if (
          trimmedLine.toLowerCase().includes("antwoord") ||
          (currentQuestion && !currentAnswer)
        ) {
          currentAnswer = trimmedLine
            .replace(/antwoord\s*\d*:?\s*/i, "")
            .trim();
          if (currentQuestion && currentAnswer) {
            questions.push({
              question: currentQuestion,
              answer: currentAnswer,
            });
            currentQuestion = "";
            currentAnswer = "";
          }
        }
      }

      // Voeg laatste paar toe als het nog niet is toegevoegd
      if (currentQuestion && currentAnswer) {
        questions.push({ question: currentQuestion, answer: currentAnswer });
      }
    } else if (hasNumberedQuestions) {
      // Format: 1. Vraag ... Antwoord op volgende regel
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^\d+\./.test(line)) {
          const question = line.replace(/^\d+\.\s*/, "").trim();
          const answer = i + 1 < lines.length ? lines[i + 1].trim() : "";
          if (question && answer && !answer.match(/^\d+\./)) {
            questions.push({ question, answer });
            i++; // Skip next line as it's the answer
          }
        }
      }
    } else {
      // Fallback: probeer elke regel als vraag-antwoord paar te interpreteren
      // of als alternerende vraag-antwoord regels
      for (let i = 0; i < lines.length - 1; i += 2) {
        const question = lines[i].trim();
        const answer = lines[i + 1]?.trim() || "";
        if (question && answer) {
          questions.push({ question, answer });
        }
      }
    }

    console.log("Parsed questions:", questions);
    return questions;
  };

  const handleEdit = () => {
    navigate("/upload/manual", { state: { parsedQuestions } });
  };
  const handleStartTest = () => {
    navigate("/toets", { state: { parsedQuestions } });
  };

  const resetUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrText("");
    setParsedQuestions([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAEF]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2
            className="text-2xl font-semibold text-gray-800 mb-2"
            style={{ fontFamily: "Roboto Condensed, sans-serif" }}
          >
            Upload een foto van je vragen
          </h2>
          <p
            className="text-gray-600"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            Maak een foto of upload een afbeelding met vraag-antwoord paren,
            woordenlijsten of aantekeningen
          </p>
        </div>

        {!showResults ? (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="text-center">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecteer een afbeelding
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Kies een foto van je werkblad, woordenlijst of aantekeningen
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Bestand kiezen</span>
                    </button>

                    <button
                      onClick={handleCameraCapture}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Foto maken</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-md mb-6"
                  />

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={processImage}
                      disabled={isProcessing}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      {isProcessing ? (
                        <div className="flex flex-col items-center space-y-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verwerken... {processingProgress}%</span>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${processingProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Tekst herkennen</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetUpload}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      Andere foto
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        ) : (
          <>
            {/* Results Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h3
                className="text-xl font-semibold text-gray-800 mb-4"
                style={{ fontFamily: "Roboto Condensed, sans-serif" }}
              >
                Herkende vragen en antwoorden
              </h3>

              {/* Debug info */}
              <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
                <strong>OCR Tekst:</strong>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {ocrText}
                </pre>
              </div>

              {parsedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {parsedQuestions.map((qa, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-purple-500 pl-4 py-2 bg-gray-50 rounded-r"
                    >
                      <p className="font-medium text-gray-800 mb-1">
                        <strong>Vraag/Term {index + 1}:</strong> {qa.question}
                      </p>
                      <p className="text-gray-600">
                        <strong>Antwoord/Vertaling:</strong> {qa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Geen vragen gevonden. Probeer een andere afbeelding of bewerk
                  handmatig.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleEdit}
                className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-4 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>Bewerken</span>
              </button>

              <button
                onClick={handleStartTest}
                disabled={parsedQuestions.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Start oefening</span>
              </button>

              <button
                onClick={resetUpload}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-4 px-8 rounded-lg transition-colors duration-200"
              >
                Nieuwe foto
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
