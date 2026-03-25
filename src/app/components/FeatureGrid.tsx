import React from 'react';
import { motion } from 'motion/react';
import { Camera, Maximize, Sun, Layers, Zap, Users } from 'lucide-react';

const features = [
  {
    title: 'Lens Combo',
    description: 'Professional cinematic control. Simulate physical camera parameters and custom lens textures.',
    icon: Camera,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    title: 'Multi-Angle',
    description: 'Camera control from any perspective. Drag the cube to set rotation, tilt, and scale.',
    icon: Maximize,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    title: 'Relight',
    description: 'Studio lighting control. Adjust global brightness, temperature, and move key lights.',
    icon: Sun,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    title: 'Pre-production',
    description: 'Turn loose ideas into visual references. Generate storyboards from your script.',
    icon: Layers,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    title: 'Video Replacement',
    description: 'Replace objects in video while preserving lighting, motion, and continuity.',
    icon: Zap,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    title: 'Community',
    description: 'Join a vibrant community of creators. Share, remix, and evolve together.',
    icon: Users,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
];

export const FeatureGrid = () => {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Creators</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            A comprehensive suite of AI-powered tools designed to streamline your creative workflow from concept to final cut.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={feature.color} size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};