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

  // Functie om afbeelding voor te bewerken voor betere OCR
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Teken originele afbeelding
        ctx.drawImage(img, 0, 0);

        // Verhoog contrast en helderheid
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Verhoog contrast (factor 1.2) en helderheid (+10)
          data[i] = Math.min(
            255,
            Math.max(0, (data[i] - 128) * 1.2 + 128 + 10)
          ); // R
          data[i + 1] = Math.min(
            255,
            Math.max(0, (data[i + 1] - 128) * 1.2 + 128 + 10)
          ); // G
          data[i + 2] = Math.min(
            255,
            Math.max(0, (data[i + 2] - 128) * 1.2 + 128 + 10)
          ); // B
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };

      img.src = URL.createObjectURL(file);
    });
  };

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
      // Voorbewerking van de afbeelding
      const preprocessedImage = await preprocessImage(selectedImage);

      // Tesseract.js OCR processing met verbeterde instellingen
      const result = await Tesseract.recognize(
        preprocessedImage,
        "nld+eng", // Nederlandse en Engelse taalherkenning
        {
          logger: (m) => {
            console.log(m);
            if (m.status === "recognizing text") {
              setProcessingProgress(Math.round(m.progress * 100));
            }
          },
          // Verbeterde OCR instellingen
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽž -_|/\\()[]{}.,;:!?'\"",
          preserve_interword_spaces: "1",
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
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const questions: QuestionAnswer[] = [];

    console.log("Parsing text:", text);
    console.log("Lines:", lines);

    // Eerst proberen we tabel-formaat te detecteren (zoals in je voorbeelden)
    const tableFormat = detectTableFormat(lines);
    if (tableFormat.length > 0) {
      return tableFormat;
    }

    // Detecteer verschillende formaten
    const hasVraagAntwoord =
      text.toLowerCase().includes("vraag") &&
      text.toLowerCase().includes("antwoord");
    const hasNumberedQuestions = /^\d+\./.test(
      lines.find((line) => line.trim()) || ""
    );

    // Verbeterde detectie voor twee-kolommen format
    const hasTwoColumns = lines.some((line) => {
      const separators = [
        /\s{2,}/,
        /\t+/,
        /\s*[-–—]\s*/,
        /\s*[:|]\s*/,
        /\s*[/\\]\s*/,
      ];
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

        // Probeer verschillende scheidingstekens in volgorde van waarschijnlijkheid
        let parts: string[] = [];
        const separators = [
          /\s{3,}/,
          /\t+/,
          /\s*[-–—]\s*/,
          /\s*[:|]\s*/,
          /\s*[/\\]\s*/,
        ];

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
        const lowerLine = trimmedLine.toLowerCase();

        if (lowerLine.includes("vraag") || trimmedLine.includes("?")) {
          if (currentQuestion && currentAnswer) {
            questions.push({
              question: currentQuestion,
              answer: currentAnswer,
            });
          }
          currentQuestion = trimmedLine.replace(/vraag\s*\d*:?\s*/i, "").trim();
          currentAnswer = "";
        } else if (
          lowerLine.includes("antwoord") ||
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
      // Fallback: alternerende regels of intelligente scheiding
      for (let i = 0; i < lines.length - 1; i += 2) {
        const question = lines[i].trim();
        const answer = lines[i + 1]?.trim() || "";
        if (question && answer && question !== answer) {
          questions.push({ question, answer });
        }
      }
    }

    console.log("Parsed questions:", questions);
    return questions.filter((q) => q.question && q.answer); // Filter lege entries
  };

  // Nieuwe functie om tabel-formaat te detecteren
  const detectTableFormat = (lines: string[]): QuestionAnswer[] => {
    const questions: QuestionAnswer[] = [];

    // Zoek naar tabel-structuur zoals in je voorbeelden
    const leftColumn: string[] = [];
    const rightColumn: string[] = [];

    for (const line of lines) {
      // Skip horizontale lijnen
      if (line.match(/^[-_|=\s]+$/)) continue;

      // Probeer verticale scheiding te vinden
      const verticalSeparators = ["|", "│", "┃", "╎", "╏"];
      let foundSeparator = false;

      for (const sep of verticalSeparators) {
        if (line.includes(sep)) {
          const parts = line
            .split(sep)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
          if (parts.length >= 2) {
            leftColumn.push(parts[0]);
            rightColumn.push(parts[1]);
            foundSeparator = true;
            break;
          }
        }
      }

      // Als geen verticale separator, probeer spatie-gebaseerde scheiding
      if (!foundSeparator) {
        const parts = line.split(/\s{3,}/).filter((p) => p.trim().length > 0);
        if (parts.length >= 2) {
          leftColumn.push(parts[0].trim());
          rightColumn.push(parts[1].trim());
        }
      }
    }

    // Combineer kolommen tot vraag-antwoord paren
    const maxLength = Math.min(leftColumn.length, rightColumn.length);
    for (let i = 0; i < maxLength; i++) {
      if (leftColumn[i] && rightColumn[i]) {
        questions.push({
          question: leftColumn[i],
          answer: rightColumn[i],
        });
      }
    }

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
            woordenlijsten of aantekeningen. Zorg voor goede belichting en
            scherpe tekst.
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

                  {/* Tips voor betere OCR */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Tips voor beste resultaten:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Zorg voor goede belichting zonder schaduwen</li>
                      <li>• Houd de camera recht boven het papier</li>
                      <li>• Tekst moet scherp en duidelijk leesbaar zijn</li>
                      <li>• Gebruik een donkere pen op wit papier</li>
                      <li>• Vermijd reflecties van licht</li>
                    </ul>
                  </div>

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
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-4 px-8 rounded-lg transition-colors duration-200"
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
                Herkende vragen en antwoorden ({parsedQuestions.length} paren)
              </h3>

              {/* Debug info - alleen tonen in development */}
              {process.env.NODE_ENV === "development" && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Debug informatie (klik om te tonen)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-sm">
                    <strong>OCR Tekst:</strong>
                    <pre className="mt-2 whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">
                      {ocrText}
                    </pre>
                  </div>
                </details>
              )}

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
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Geen vragen gevonden. Dit kan komen door:
                  </p>
                  <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2">
                    <li>• Onduidelijke of te kleine tekst</li>
                    <li>• Slechte belichting of schaduwen</li>
                    <li>• Handschrift dat moeilijk te herkennen is</li>
                    <li>• Ongewoon formaat van de vragen</li>
                  </ul>
                </div>
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
