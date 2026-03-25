import React from 'react';
import { Twitter, Github, Linkedin, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-black font-bold text-xl">T</div>
              <span className="font-display font-bold text-xl tracking-tighter">TapNow</span>
            </a>
            <p className="text-white/40 max-w-xs mb-8 text-sm leading-relaxed">
              The next-generation AI visual creation engine for businesses and creators. Orchestrate the future of creativity.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                  <Icon size={18} className="text-white/60" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TapFlow</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TapTV</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Manifesto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© 2026 TapNow AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Built with AI</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">San Francisco</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
