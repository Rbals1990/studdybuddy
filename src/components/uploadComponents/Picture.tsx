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

      // Reset eerdere resultaten
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

    console.log("Original text:", text);
    console.log("Lines after splitting:", lines);

    const questions: QuestionAnswer[] = [];

    // Probeer elke regel als één vraag-antwoord paar te interpreteren
    for (const line of lines) {
      // Skip decoratieve lijnen of te korte regels
      if (/^[-_|=\s]*$/.test(line) || line.length < 3) continue;

      // Split de regel op verschillende scheidingstekens
      let parts: string[] = [];

      // Probeer verschillende separators in volgorde van waarschijnlijkheid
      const separators = [
        /\s{4,}/, // 4 of meer spaties (meest waarschijnlijk voor kolommen)
        /\t+/, // tabs
        /\s{3}/, // 3 spaties
        /\s{2}/, // 2 spaties (let op, kan ook binnen woorden voorkomen)
      ];

      for (const separator of separators) {
        const testParts = line
          .split(separator)
          .filter((part) => part.trim().length > 0);
        if (testParts.length === 2) {
          parts = testParts;
          break;
        }
      }

      // Als geen duidelijke scheiding gevonden, probeer op basis van woordtelling
      if (parts.length !== 2) {
        const words = line.split(/\s+/).filter((word) => word.length > 0);

        if (words.length === 2) {
          // Precies 2 woorden - perfect
          parts = words;
        } else if (words.length > 2) {
          // Meer dan 2 woorden - probeer te bepalen waar de scheiding is
          // Heuristiek: zoek naar de meest logische verdeling

          // Methode 1: Verdeel ongeveer in het midden
          const midPoint = Math.floor(words.length / 2);
          const leftPart = words.slice(0, midPoint).join(" ");
          const rightPart = words.slice(midPoint).join(" ");

          // Controleer of deze verdeling logisch is (beide delen hebben redelijke lengte)
          if (leftPart.length >= 2 && rightPart.length >= 2) {
            parts = [leftPart, rightPart];
          }

          // Methode 2: Als methode 1 niet werkt, probeer andere verdelingen
          if (parts.length !== 2) {
            // Probeer 1 woord links, rest rechts
            if (words[0].length >= 2) {
              const leftWord = words[0];
              const rightWords = words.slice(1).join(" ");
              if (rightWords.length >= 2) {
                parts = [leftWord, rightWords];
              }
            }
          }
        }
      }

      // Valideer en voeg toe
      if (parts.length === 2) {
        const question = parts[0].trim();
        const answer = parts[1].trim();

        // Extra validatie
        if (
          question.length >= 2 &&
          answer.length >= 2 &&
          question !== answer &&
          // Vermijd duplicate content (soms leest OCR hetzelfde woord dubbel)
          !question.toLowerCase().includes(answer.toLowerCase()) &&
          !answer.toLowerCase().includes(question.toLowerCase())
        ) {
          questions.push({ question, answer });
        }
      }
    }

    console.log("Parsed questions:", questions);
    return questions;
  };

  // Extra functie om specifiek voor kolom-layout te optimaliseren
  const parseColumnBasedText = (text: string): QuestionAnswer[] => {
    // Alternatieve benadering specifiek voor kolommen
    const words = text.split(/\s+/).filter((word) => word.length > 1);
    const questions: QuestionAnswer[] = [];

    // Probeer paren te vormen door woorden te koppelen
    for (let i = 0; i < words.length - 1; i += 2) {
      const question = words[i];
      const answer = words[i + 1];

      if (question && answer && question !== answer) {
        // Eenvoudige validatie: beide woorden moeten letters bevatten
        if (/[a-zA-Z]/.test(question) && /[a-zA-Z]/.test(answer)) {
          questions.push({
            question: question.trim(),
            answer: answer.trim(),
          });
        }
      }
    }

    return questions;
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
    navigate("/upload/manual", {
      state: {
        pairs: parsedQuestions,
      },
    });
  };

  const handleStartTest = () => {
    navigate("/toets", {
      state: {
        pairs: parsedQuestions,
      },
    });
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
                Herkende vragen en antwoorden ({parsedQuestions.length} paren).
              </h3>
              <h3
                className="text-l font-light text-red-400 mb-4"
                style={{ fontFamily: "Roboto Condensed, sans-serif" }}
              >
                Let op! Controleer de paren goed en bewerk indien nodig!
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
