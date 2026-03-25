import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  angle: number;
}

const CREATIVE_WORDS = [
  'Idea', 'Imagination', 'Inspiration', 'Infinite', 'Insight',
  'Identity', 'Innovation', 'Image', 'Intent', 'Impact'
];

export const LoadingScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [words, setWords] = useState<FloatingWord[]>([]);

  useEffect(() => {
    // 生成随机位置的单词
    const generatedWords = CREATIVE_WORDS.map((word, index) => {
      const angle = (Math.random() * 360 * Math.PI) / 180;
      const distance = 100 + Math.random() * 200;
      
      return {
        id: index,
        text: word,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        angle
      };
    });
    
    setWords(generatedWords);

    // 模拟加载完成
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-[9999] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 飘浮的单词 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {words.map((word) => (
            <motion.div
              key={word.id}
              className="absolute text-white/30 font-medium text-lg select-none"
              initial={{ 
                opacity: 0, 
                x: 0, 
                y: 0,
                scale: 0.5 
              }}
              animate={{ 
                opacity: [0, 0.6, 0],
                x: word.x,
                y: word.y,
                scale: [0.5, 1, 0.8],
              }}
              transition={{
                duration: word.duration,
                delay: word.delay,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              {word.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 中心眼睛 Logo */}
      <div className="relative z-10">
        <div className="relative w-[140px] h-[64px] flex justify-between items-center">
          <div className="loading-eye"></div>
          <div className="loading-eye"></div>
          <style dangerouslySetInnerHTML={{__html: `
            .loading-eye {
              width: 64px;
              height: 64px;
              background-color: #fff;
              background-image: radial-gradient(circle 18px, #0a0a0a 100%, transparent 0);
              background-repeat: no-repeat;
              border-radius: 50%;
              animation: loadingEyeMove 4s infinite, loadingBlink 4s infinite;
              box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
            }
            
            @keyframes loadingEyeMove {
              0%, 10% { 
                background-position: center; 
              }
              15%, 25% { 
                background-position: 55% center; 
              }
              30%, 40% { 
                background-position: 45% center; 
              }
              45%, 55% { 
                background-position: center 55%; 
              }
              60%, 70% { 
                background-position: center 45%; 
              }
              75%, 85% { 
                background-position: 45% 45%; 
              }
              90%, 100% { 
                background-position: center; 
              }
            }
            
            @keyframes loadingBlink {
              0%, 39%, 41%, 100% { 
                transform: scaleY(1); 
              }
              40% { 
                transform: scaleY(0.1); 
              }
            }
          `}} />
        </div>
        
        {/* Loading 文本 */}
        <motion.div 
          className="text-center mt-8 text-white/50 text-sm font-medium tracking-wider"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Loading...
        </motion.div>
      </div>
    </motion.div>
  );
};