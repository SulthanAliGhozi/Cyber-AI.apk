import React, { useState, useEffect } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ 
  text, 
  className = "", 
  speed = 40 
}) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "!@#$%^&*()_+{}:<>?|[]\\,./~`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, speed);

    // Periodic glitch effect
    const glitchInterval = setInterval(() => {
      let glitchCount = 0;
      const maxGlitch = 3;
      
      const subInterval = setInterval(() => {
        setDisplayText((prev) =>
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (Math.random() > 0.85) {
                return chars[Math.floor(Math.random() * chars.length)];
              }
              return text[index];
            })
            .join("")
        );
        
        glitchCount++;
        if (glitchCount >= maxGlitch) {
          clearInterval(subInterval);
          setDisplayText(text);
        }
      }, 80);

    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(glitchInterval);
    };
  }, [text, speed]);

  return (
    <span className={`glitch-text font-sans ${className}`}>
      {displayText}
    </span>
  );
};
