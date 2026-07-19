import React, { useEffect, useRef } from "react";

interface TerminalBackgroundProps {
  isDark: boolean;
}

export const TerminalBackground: React.FC<TerminalBackgroundProps> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Grid details
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);

    // Tracks falling drops y position
    const yPositions = Array(columns).fill(0).map(() => Math.floor(Math.random() * -100));
    
    // Custom chars (Matrix/Cyber Theme: Japanese Katakana, numbers, hex, symbols)
    const chars = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1023456789ABCDEF$#@&*+-%".split("");

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Interactive drops spawned by clicks
    interface InteractiveRipple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      speed: number;
      opacity: number;
    }
    let ripples: InteractiveRipple[] = [];

    const handleClick = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 2,
        maxRadius: 150 + Math.random() * 100,
        speed: 4,
        opacity: 1.0,
      });
    };
    window.addEventListener("click", handleClick);

    // Drawing loop
    const draw = () => {
      // Create trailing alpha fade
      ctx.fillStyle = isDark ? "rgba(5, 5, 5, 0.12)" : "rgba(244, 246, 249, 0.12)";
      ctx.fillRect(0, 0, width, height);

      // Text colors
      // Dark mode: glowing matrix emerald, light mode: glowing cyber cyan
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < yPositions.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = yPositions[i] * fontSize;

        // Check if cursor is close to make them brighter (optional interaction)
        const isBright = Math.random() > 0.98;
        
        if (isDark) {
          ctx.fillStyle = isBright ? "#c084fc" : "rgba(167, 139, 250, 0.35)"; // Bright purple and violet
        } else {
          ctx.fillStyle = isBright ? "#6366f1" : "rgba(129, 140, 248, 0.35)"; // Indigo colors
        }

        ctx.fillText(char, x, y);

        // Reset drops
        if (y > height && Math.random() > 0.975) {
          yPositions[i] = 0;
        }

        // Increment drop position with random speeds
        yPositions[i] += Math.random() > 0.3 ? 1 : 0;
      }

      // Draw active click ripples
      ripples = ripples.filter((ripple) => ripple.opacity > 0.01);
      ripples.forEach((ripple) => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark 
          ? `rgba(167, 139, 250, ${ripple.opacity * 0.4})` 
          : `rgba(99, 102, 241, ${ripple.opacity * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw binary digits in the ripple boundary
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          const charX = ripple.x + Math.cos(angle) * ripple.radius;
          const charY = ripple.y + Math.sin(angle) * ripple.radius;
          if (charX >= 0 && charX <= width && charY >= 0 && charY <= height) {
            ctx.fillStyle = isDark 
              ? `rgba(167, 139, 250, ${ripple.opacity * 0.8})` 
              : `rgba(99, 102, 241, ${ripple.opacity * 0.8})`;
            ctx.fillText(Math.random() > 0.5 ? "1" : "0", charX, charY);
          }
        }

        ripple.radius += ripple.speed;
        ripple.opacity -= 0.02;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
