import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const I_SEE_PHRASES = [
  'I see Idea',
  'I see Imagination',
  'I see Inspiration',
  'I see Infinite',
  'I see Insight',
  'I see Identity',
  'I see Innovation',
  'I see Image',
  'I see Intent',
  'I see Impact',
  'I see everything'
];

export const GeneratingOverlay: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % I_SEE_PHRASES.length);
    }, 1000); // 每1秒切换一个短语

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20">
      {/* 眼睛动画 - 增大尺寸并添加脉动效果 */}
      <motion.div 
        className="relative w-[100px] h-[48px] flex justify-between items-center mb-8"
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="generating-eye"></div>
        <div className="generating-eye"></div>
        <style dangerouslySetInnerHTML={{__html: `
          .generating-eye {
            width: 48px;
            height: 48px;
            background-color: #fff;
            background-image: radial-gradient(circle 14px, #000 100%, transparent 0);
            background-repeat: no-repeat;
            background-position: center;
            border-radius: 50%;
            animation: genEyeMove 3s infinite ease-in-out, genBlink 5s infinite;
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1);
          }
          
          @keyframes genEyeMove {
            0%, 100% { 
              background-position: center; 
            }
            20% { 
              background-position: 58% center; 
            }
            40% { 
              background-position: 42% center; 
            }
            60% { 
              background-position: center 58%; 
            }
            80% { 
              background-position: center 42%; 
            }
          }
          
          @keyframes genBlink {
            0%, 48%, 52%, 100% { 
              transform: scaleY(1); 
            }
            50% { 
              transform: scaleY(0.05); 
            }
          }
        `}} />
      </motion.div>

      {/* "I see" 短语循环 - 更大的文字和淡入淡出效果 */}
      <div className="relative h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute text-white text-base font-medium tracking-wider"
          >
            {I_SEE_PHRASES[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 添加微妙的扫描线效果 */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
        }}
        animate={{
          y: ['-100%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};