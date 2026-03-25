import React from 'react';
import { motion } from 'motion/react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'PRODUCT', href: '#' },
    { name: 'SOLUTIONS', href: '#' },
    { name: 'DEVELOPER', href: '#' },
    { name: 'COMPANY', href: '#' },
    { name: 'PRICING', href: '#' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent',
        scrolled ? 'bg-black/80 backdrop-blur-md border-white/10 py-3' : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center overflow-hidden">
               <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold text-xl">T</div>
            </div>
            <span className="font-display font-bold text-xl tracking-tighter">TapNow</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-medium text-white/60 hover:text-white transition-colors tracking-widest"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="text-xs font-medium text-white/60 hover:text-white transition-colors tracking-widest px-4 py-2">
            LOG IN
          </button>
          <button className="bg-white text-black text-xs font-bold px-6 py-2.5 rounded-full hover:bg-white/90 transition-all tracking-widest">
            GET STARTED
          </button>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="md:hidden overflow-hidden bg-black border-b border-white/10"
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-lg font-medium text-white/60 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
            <button className="text-left text-lg font-medium text-white/60">LOG IN</button>
            <button className="bg-white text-black font-bold py-4 rounded-xl">GET STARTED</button>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};
