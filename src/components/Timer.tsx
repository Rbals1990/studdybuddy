import { useState, useEffect } from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";

export default function StuddyBuddyTimer() {
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showBreakMessage, setShowBreakMessage] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 50, y: 50 });

  // Function to bring tab to focus and show notification
  const alertUser = () => {
    // Focus the window/tab
    window.focus();

    // Change the document title to attract attention
    document.title = "⏰ PAUZE TIJD! - StuddyBuddy Timer";

    // Optional: Show browser notification (requires permission)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("StuddyBuddy Timer", {
        body: "Tijd voor een pauze! 🎉",
        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzk0NTVkNCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0xMiA2IDAgNiA0IDQiIHN0cm9rZT0iIzk0NTVkNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+",
      });
    }

    // Flash the page background to attract attention
    document.body.style.backgroundColor = "#fbbf24";
    setTimeout(() => {
      document.body.style.backgroundColor = "";
    }, 500);
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Reset document title when timer is active or reset
  useEffect(() => {
    if (isActive || (!showBreakMessage && timeLeft === 0)) {
      document.title = "StuddyBuddy Timer";
    }
  }, [isActive, showBreakMessage, timeLeft]);

  // Timer logic with more accurate timing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let startTime: number | null = null;
    let initialTimeLeft: number | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      startTime = Date.now();
      initialTimeLeft = timeLeft;

      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime!) / 1000);
        const newTimeLeft = Math.max(0, initialTimeLeft! - elapsed);

        setTimeLeft(newTimeLeft);

        if (newTimeLeft <= 0) {
          setIsActive(false);
          setShowBreakMessage(true);
          setBreakStartTime(Date.now());
          // Alert the user when timer finishes
          alertUser();
          if (interval) clearInterval(interval);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused]); // Removed timeLeft from dependencies to prevent restarts

  // Break timer logic
  useEffect(() => {
    let breakInterval: NodeJS.Timeout | null = null;

    if (showBreakMessage && breakStartTime) {
      breakInterval = setInterval(() => {
        const elapsed = Date.now() - breakStartTime;
        if (elapsed >= 60000) {
          setCanContinue(true);
        }
      }, 1000);
    }

    return () => {
      if (breakInterval) clearInterval(breakInterval);
    };
  }, [showBreakMessage, breakStartTime]);

  // Moving button logic during break
  useEffect(() => {
    let moveInterval: NodeJS.Timeout | null = null;

    if (showBreakMessage && !canContinue) {
      moveInterval = setInterval(() => {
        setButtonPosition({
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
        });
      }, 500);
    }

    return () => {
      if (moveInterval) clearInterval(moveInterval);
    };
  }, [showBreakMessage, canContinue]);

  const startTimer = (minutes: number) => {
    setSelectedTime(minutes);
    setTimeLeft(minutes * 60);
    setIsActive(true);
    setIsPaused(false);
    setShowBreakMessage(false);
    setCanContinue(false);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
    setSelectedTime(null);
    setShowBreakMessage(false);
    setCanContinue(false);
    setBreakStartTime(null);
    // Reset document title
    document.title = "StuddyBuddy Timer";
  };

  const continueAfterBreak = () => {
    if (canContinue) {
      setShowBreakMessage(false);
      setCanContinue(false);
      setBreakStartTime(null);
      // Reset document title
      document.title = "StuddyBuddy Timer";
      // Ready for next round - reset to selection
      resetTimer();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getBreakTimeLeft = () => {
    if (!breakStartTime) return 60;
    const elapsed = Math.floor((Date.now() - breakStartTime) / 1000);
    return Math.max(0, 60 - elapsed);
  };

  return (
    <div className="min-h-screen bg-[#FFFAEF]">
      {/* Notification permission prompt */}
      {"Notification" in window && Notification.permission === "default" && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          <p className="text-sm">
            💡 <strong>Tip:</strong> Sta meldingen toe om een notificatie te
            ontvangen wanneer je timer afloopt!
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showBreakMessage ? (
          <div className="text-center">
            <h2
              className="text-3xl font-semibold text-gray-800 mb-8"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Studietimer
            </h2>

            {!isActive && timeLeft === 0 ? (
              // Timer Selection
              <div className="space-y-6">
                <p
                  className="text-lg text-gray-600 mb-8"
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  Kies je studietijd:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  {[10, 20, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => startTimer(minutes)}
                      className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-300 group"
                    >
                      <Clock className="w-12 h-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {minutes} min
                      </h3>
                      <p
                        className="text-gray-600"
                        style={{ fontFamily: "Roboto Mono, monospace" }}
                      >
                        {minutes === 10
                          ? "Korte sessie"
                          : minutes === 20
                          ? "Gemiddelde sessie"
                          : "Lange sessie"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Active Timer Display
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md mx-auto">
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-purple-600 mx-auto mb-6" />
                    <div className="text-6xl font-bold text-gray-800 mb-4 font-mono">
                      {formatTime(timeLeft)}
                    </div>
                    <p
                      className="text-lg text-gray-600 mb-6"
                      style={{ fontFamily: "Roboto Mono, monospace" }}
                    >
                      {selectedTime} minuten sessie
                    </p>

                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={pauseTimer}
                        className="flex items-center space-x-2 bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        {isPaused ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Pause className="w-5 h-5" />
                        )}
                        <span>{isPaused ? "Hervatten" : "Pauzeren"}</span>
                      </button>

                      <button
                        onClick={resetTimer}
                        className="flex items-center space-x-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        <RotateCcw className="w-5 h-5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </div>

                {isPaused && (
                  <div className="text-center">
                    <p
                      className="text-lg text-orange-600 font-semibold"
                      style={{ fontFamily: "Roboto Mono, monospace" }}
                    >
                      Timer gepauzeerd
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Break Message - now with pulsing animation to attract attention
          <div className="text-center relative h-96">
            <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md mx-auto animate-pulse">
              <h2
                className="text-3xl font-bold text-purple-600 mb-4"
                style={{ fontFamily: "Roboto Condensed, sans-serif" }}
              >
                🎉 Tijd voor pauze! 🎉
              </h2>
              <p
                className="text-lg text-gray-600 mb-6"
                style={{ fontFamily: "Roboto Mono, monospace" }}
              >
                Neem even rust voordat je verder gaat
              </p>

              {!canContinue && (
                <p
                  className="text-sm text-orange-600 mb-4"
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  Nog {getBreakTimeLeft()} seconden tot je verder kunt...
                </p>
              )}
            </div>

            <button
              onClick={continueAfterBreak}
              disabled={!canContinue}
              className={`absolute bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 ${
                canContinue
                  ? "hover:from-purple-700 hover:to-blue-600 cursor-pointer animate-bounce"
                  : "opacity-50 cursor-not-allowed"
              }`}
              style={{
                left: `${buttonPosition.x}%`,
                top: `${buttonPosition.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              Klaar voor de volgende ronde!
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
