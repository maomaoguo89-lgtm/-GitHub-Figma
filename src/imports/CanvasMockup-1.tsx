import React from 'react';
import { motion } from 'motion/react';
import { Plus, MousePointer2, Share2, Download, Settings, Layers, Image as ImageIcon, Video, Type, Music, Play } from 'lucide-react';

export const CanvasMockup = () => {
  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/3">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
              Your Creation Board <br />
              <span className="text-accent">Tapflow</span>
            </h2>
            <p className="text-white/60 mb-10 leading-relaxed">
              Tell your story in this infinite space. Arrange nodes, connect ideas, and orchestrate multiple AI models simultaneously.
            </p>
            
            <ul className="space-y-6">
              {[
                { icon: Layers, text: 'Node-based workflow' },
                { icon: Share2, text: 'Real-time collaboration' },
                { icon: Download, text: 'One-click export' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <item.icon size={18} className="text-accent" />
                  </div>
                  <span className="font-medium text-white/80">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-2/3 relative">
            {/* Canvas Interface Mockup */}
            <div className="relative aspect-[16/10] bg-[#050505] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Toolbar */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
                {[MousePointer2, Plus, ImageIcon, Video, Type, Music].map((Icon, i) => (
                  <button key={i} className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Icon size={18} className={i === 0 ? 'text-accent' : 'text-white/60'} />
                  </button>
                ))}
              </div>

              {/* Top Bar */}
              <div className="absolute top-4 right-4 flex items-center gap-3 z-30">
                <button className="px-4 py-2 rounded-lg glass text-[10px] font-bold tracking-widest uppercase">Share</button>
                <button className="px-4 py-2 rounded-lg bg-accent text-black text-[10px] font-bold tracking-widest uppercase">Export</button>
                <button className="w-10 h-10 rounded-lg glass flex items-center justify-center"><Settings size={18} /></button>
              </div>

              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-20" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
                  backgroundSize: '40px 40px' 
                }} 
              />

              {/* Nodes and Connections */}
              <div className="absolute inset-0 p-12 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.path
                    d="M 200 300 C 350 300, 350 200, 500 200"
                    stroke="rgba(0, 255, 204, 0.3)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 500 200 C 650 200, 650 400, 800 400"
                    stroke="rgba(0, 255, 204, 0.3)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </svg>

                {/* Node 1: Script */}
                <motion.div 
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  className="absolute left-[15%] top-[40%] w-48 glass p-4 rounded-xl cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Type size={14} className="text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Script</span>
                  </div>
                  <p className="text-[11px] text-white/80 line-clamp-3">
                    A woman draped in flowing golden fabric, eyes closed, serene expression. Ethereal lighting from above...
                  </p>
                </motion.div>

                {/* Node 2: Image Gen */}
                <motion.div 
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  className="absolute left-[45%] top-[20%] w-56 glass p-2 rounded-xl cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 p-2 mb-1">
                    <ImageIcon size={14} className="text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Image Generation</span>
                  </div>
                  <img src="https://picsum.photos/seed/ai1/300/200" className="w-full rounded-lg" alt="AI Generated" referrerPolicy="no-referrer" />
                </motion.div>

                {/* Node 3: Video Gen */}
                <motion.div 
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  className="absolute left-[70%] top-[50%] w-64 glass p-2 rounded-xl cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 p-2 mb-1">
                    <Video size={14} className="text-purple-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Video Generation</span>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                    <Play size={24} className="text-white/40" />
                    <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 blur-[80px] -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-[80px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};
