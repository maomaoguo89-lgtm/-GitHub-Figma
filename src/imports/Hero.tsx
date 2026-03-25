import React from 'react';
import { motion } from 'motion/react';
import { Play, ArrowRight, Sparkles } from 'lucide-react';

export const Hero = ({ onStart }: { onStart?: () => void }) => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8"
        >
          <Sparkles size={14} className="text-accent" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">
            The Next Generation AI Creative Engine
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-8xl font-bold mb-8 leading-[0.9] tracking-tighter"
        >
          Your AI-Native <br />
          <span className="text-gradient">Creative Canvas</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-white/60 mb-12 font-light leading-relaxed"
        >
          TapNow is the best way to create with AI. Orchestrate text, image, audio, and video models in one infinite space. Zero friction, infinite possibilities.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
        >
          <button 
            onClick={onStart}
            className="group relative bg-white text-black font-bold px-10 py-4 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              GET STARTED FOR FREE <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </span>
          </button>
          <button className="flex items-center gap-3 text-white/80 hover:text-white transition-colors group">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors">
              <Play size={16} fill="white" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase">Watch Demo</span>
          </button>
        </motion.div>

        {/* Canvas Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative max-w-6xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-accent/5">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <img
              src="https://picsum.photos/seed/canvas/1200/800"
              alt="TapNow Canvas Interface"
              className="w-full aspect-[16/10] object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            
            {/* Floating UI Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-20 pointer-events-none">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[20%] left-[15%] glass p-4 rounded-xl w-48 text-left"
              >
                <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center mb-3">
                  <Sparkles size={16} className="text-accent" />
                </div>
                <div className="h-2 w-24 bg-white/20 rounded mb-2" />
                <div className="h-2 w-16 bg-white/10 rounded" />
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[25%] right-[10%] glass p-4 rounded-xl w-56 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20" />
                  <div>
                    <div className="h-2 w-20 bg-white/20 rounded mb-1" />
                    <div className="h-2 w-12 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="h-24 w-full bg-white/5 rounded-lg" />
              </motion.div>
            </div>
          </div>
          
          {/* Decorative Glow */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-accent/20 blur-[60px] -z-10" />
        </motion.div>
      </div>
    </section>
  );
};
