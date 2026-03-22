import React, { useState, useEffect, useMemo } from "react";
import { isCustomEvent } from "../gameContext";

const DURATION = 1600;
const STREAK_COUNT = 18;

function Embuscade() {
  const [visible, setVisible] = useState(false);

  // Pre-generate random streak positions so they're stable per render
  const streaks = useMemo(() => {
    return Array.from({ length: STREAK_COUNT }, (_, i) => ({
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 400,
      width: 40 + Math.random() * 60,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, []);

  useEffect(() => {
    const handleEmbuscade = (e: Event) => {
      if (!isCustomEvent(e)) return;
      setVisible(true);
    };

    document.addEventListener("embuscade", handleEmbuscade);
    return () => document.removeEventListener("embuscade", handleEmbuscade);
  }, []);

  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(() => setVisible(false), DURATION);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="embuscade-overlay">
      <div className="embuscade-rain">
        {streaks.map((s, i) => (
          <div
            key={i}
            className="embuscade-streak"
            style={{
              top: s.top,
              width: s.width,
              opacity: s.opacity,
              animationDelay: `${s.delay}ms`,
            }}
          />
        ))}
      </div>
      <span className="embuscade-text">EMBUSCADE!</span>
    </div>
  );
}

export default Embuscade;
