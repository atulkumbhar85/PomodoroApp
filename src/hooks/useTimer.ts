import { useState, useEffect } from 'react';

const useTimer = (initialFocusTime = 1500, initialBreakTime = 300) => {
  const [seconds, setSeconds] = useState(initialFocusTime);
  const [isFocusTime, setIsFocusTime] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null; // Explicitly type the interval
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval); // Ensure interval is cleared properly
    };
  }, [isRunning]);

  useEffect(() => {
    if (seconds === 0) {
      if (isFocusTime) {
        setSeconds(initialBreakTime);
      } else {
        setSeconds(initialFocusTime);
      }
      setIsFocusTime(!isFocusTime);
      setIsRunning(false);
    }
  }, [seconds, isFocusTime, initialFocusTime, initialBreakTime]);

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(isFocusTime ? initialFocusTime : initialBreakTime);
  };

  return { seconds, isFocusTime, isRunning, setIsRunning, resetTimer, setSeconds, setIsFocusTime };
};

export default useTimer;