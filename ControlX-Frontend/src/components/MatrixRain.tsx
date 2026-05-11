import React, { useEffect, useRef } from 'react';

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      // רקע שחור שקוף מאוד כדי להשאיר "זנב" ארוך ויפה
      ctx.fillStyle = "rgba(1, 8, 6, 0.08)"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#059669"; // ירוק אמרלד
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // אם האות הגיעה לתחתית, נחזיר אותה למעלה בהסתברות נמוכה
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.985) {
          drops[i] = 0;
        }
        
        // כאן השליטה במהירות: במקום 1, נשתמש ב-0.5 כדי שזה ירד חצי מהמהירות
        drops[i] += 0.5; 
      }
    };

    // שינינו מ-33 ל-50 מילי-שניות (פחות פריימים בשנייה = תנועה איטית יותר)
    const interval = setInterval(draw, 50); 
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20" />;
};

export default MatrixRain;