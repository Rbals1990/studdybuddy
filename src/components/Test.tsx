import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

interface Pair {
  question: string;
  answer: string;
}

interface LocationState {
  pairs?: Pair[];
}

export default function Test() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<
    { question: string; correct: string; given: string }[]
  >([]);

  // 👇 Extract and validate location state
  const state = location.state as LocationState;
  const incomingPairs = state?.pairs;

  useEffect(() => {
    if (!incomingPairs || incomingPairs.length === 0) {
      navigate("/", { replace: true });
      return;
    }

    const shuffled = [...incomingPairs].sort(() => Math.random() - 0.5);
    setPairs(shuffled);
  }, [incomingPairs, navigate]);

  const checkAnswer = () => {
    const correct = isFlipped
      ? pairs[currentIndex].question
      : pairs[currentIndex].answer;
    const isCorrect =
      input.trim().toLowerCase() === correct.trim().toLowerCase();

    setScore((prev) => [...prev, isCorrect ? 1 : 0]);
    setResults((prev) => [
      ...prev,
      {
        question: isFlipped
          ? pairs[currentIndex].answer
          : pairs[currentIndex].question,
        correct,
        given: input,
      },
    ]);
    setInput("");

    if (currentIndex + 1 < pairs.length) {
      setCurrentIndex(currentIndex + 1);
    } else if (!isFlipped) {
      setCurrentIndex(0);
      setIsFlipped(true);
    } else {
      setShowResult(true);
    }
  };

  const correctCount = score.reduce((acc, val) => acc + val, 0);
  const total = score.length;
  const percentage = (correctCount / total) * 100;
  const color =
    percentage > 90
      ? "text-green-600"
      : percentage >= 50
      ? "text-yellow-600"
      : "text-red-600";

  const getEindCijfer = () => {
    const cijfer = Math.round((percentage / 10) * 10) / 10;
    return cijfer.toFixed(1);
  };

  const renderStars = (value: number) => {
    const fullStars = Math.floor(value / 2);
    const halfStar = value % 2 >= 1 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return (
      <div className="flex justify-center items-center gap-1 my-2">
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <Star
              key={`full-${i}`}
              className="text-yellow-400 fill-yellow-400 w-6 h-6"
            />
          ))}
        {halfStar === 1 && (
          <Star className="text-yellow-400 w-6 h-6" style={{ opacity: 0.5 }} />
        )}
        {Array(emptyStars)
          .fill(0)
          .map((_, i) => (
            <Star key={`empty-${i}`} className="text-gray-300 w-6 h-6" />
          ))}
      </div>
    );
  };

  const retry = () => {
    const reshuffled = [...pairs].sort(() => Math.random() - 0.5);
    setPairs(reshuffled);
    setCurrentIndex(0);
    setInput("");
    setScore([]);
    setShowResult(false);
    setIsFlipped(false);
    setResults([]);
  };

  if (!pairs.length)
    return <p className="text-center mt-20">Geen gegevens gevonden...</p>;

  if (showResult) {
    const eindCijfer = Number(getEindCijfer());
    return (
      <div className="max-w-xl mx-auto mt-10 px-4 text-center">
        <h2
          className={`text-2xl font-semibold mb-2 ${color}`}
          style={{ fontFamily: "Roboto Condensed" }}
        >
          Resultaat: {correctCount}/{total} goed
        </h2>
        <p className="mb-1 text-gray-700" style={{ fontFamily: "Roboto Mono" }}>
          Score: {percentage.toFixed(1)}%
        </p>
        <p
          className="text-lg font-semibold"
          style={{ fontFamily: "Roboto Condensed" }}
        >
          Eindcijfer: {eindCijfer}/10
        </p>
        {renderStars(eindCijfer)}
        <div className="mb-6 text-left">
          {results.map((res, i) => (
            <div
              key={i}
              className={`mb-2 p-3 rounded-lg shadow-sm ${
                res.correct.toLowerCase() === res.given.toLowerCase()
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              <p className="font-semibold">
                Vraag: <span className="font-normal">{res.question}</span>
              </p>
              <p className="text-sm">Jouw antwoord: {res.given}</p>
              <p className="text-sm">Correct antwoord: {res.correct}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={retry}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full shadow-md"
          >
            Opnieuw oefenen
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow-md"
          >
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  const currentPair = isFlipped
    ? pairs[currentIndex].answer
    : pairs[currentIndex].question;

  return (
    <div className="max-w-xl mx-auto mt-20 px-4 text-center">
      <h2
        className="text-xl font-semibold mb-4"
        style={{ fontFamily: "Roboto Condensed" }}
      >
        Vraag {currentIndex + 1} van {pairs.length}
      </h2>
      <p className="text-lg mb-2" style={{ fontFamily: "Roboto Mono" }}>
        {currentPair}
      </p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
        className="w-full p-3 border border-gray-300 rounded mb-4 font-mono"
        placeholder="Typ je antwoord..."
        autoFocus
      />
      <button
        onClick={checkAnswer}
        className="bg-yellow-300 hover:bg-yellow-400 px-6 py-2 rounded text-gray-800 font-medium shadow"
      >
        Antwoord controleren
      </button>
    </div>
  );
}
