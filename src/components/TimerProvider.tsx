import { createContext, useContext, useState, useEffect } from "react";

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [timerState, setTimerState] = useState({
    selectedTime: null, // 10, 20, or 30 minutes
    timeLeft: 0, // in seconds
    isActive: false,
    isPaused: false,
    showBreakMessage: false,
    breakStartTime: null,
    canContinue: false,
    buttonPosition: { x: 50, y: 50 },
  });

  // Timer countdown logic
  useEffect(() => {
    let interval = null;

    if (
      timerState.isActive &&
      !timerState.isPaused &&
      timerState.timeLeft > 0
    ) {
      interval = setInterval(() => {
        setTimerState((prev) => {
          if (prev.timeLeft <= 1) {
            // Timer finished
            return {
              ...prev,
              timeLeft: 0,
              isActive: false,
              showBreakMessage: true,
              breakStartTime: Date.now(),
            };
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1,
          };
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [timerState.isActive, timerState.isPaused, timerState.timeLeft]);

  // Break timer logic
  useEffect(() => {
    let breakInterval = null;

    if (timerState.showBreakMessage && timerState.breakStartTime) {
      breakInterval = setInterval(() => {
        const elapsed = Date.now() - timerState.breakStartTime;
        if (elapsed >= 60000) {
          // 1 minute = 60000ms
          setTimerState((prev) => ({
            ...prev,
            canContinue: true,
          }));
        }
      }, 1000);
    }

    return () => clearInterval(breakInterval);
  }, [timerState.showBreakMessage, timerState.breakStartTime]);

  // Moving button logic during break
  useEffect(() => {
    let moveInterval = null;

    if (timerState.showBreakMessage && !timerState.canContinue) {
      moveInterval = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          buttonPosition: {
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10,
          },
        }));
      }, 500);
    }

    return () => clearInterval(moveInterval);
  }, [timerState.showBreakMessage, timerState.canContinue]);

  const startTimer = (minutes) => {
    setTimerState((prev) => ({
      ...prev,
      selectedTime: minutes,
      timeLeft: minutes * 60,
      isActive: true,
      isPaused: false,
      showBreakMessage: false,
      canContinue: false,
    }));
  };

  const pauseTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const resetTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      timeLeft: 0,
      selectedTime: null,
      showBreakMessage: false,
      canContinue: false,
      breakStartTime: null,
    }));
  };

  const continueAfterBreak = () => {
    if (timerState.canContinue) {
      setTimerState((prev) => ({
        ...prev,
        showBreakMessage: false,
        canContinue: false,
        breakStartTime: null,
        isActive: false,
        timeLeft: 0,
        selectedTime: null,
      }));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getBreakTimeLeft = () => {
    if (!timerState.breakStartTime) return 60;
    const elapsed = Math.floor((Date.now() - timerState.breakStartTime) / 1000);
    return Math.max(0, 60 - elapsed);
  };

  const contextValue = {
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    continueAfterBreak,
    formatTime,
    getBreakTimeLeft,
  };

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
