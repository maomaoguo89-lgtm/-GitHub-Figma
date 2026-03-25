import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { Target, Gift, CreditCard, ChevronDown, Coins, User, Settings, LogOut, LayoutDashboard, Crown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import avatarImg from "figma:asset/ea24a6556c9b973c5d942401c25d581ba7bb389b.png";
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '../i18n';

export const MainLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0a0a] shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 cursor-pointer group">
            {/* Animated Eyes Logo */}
            <div className="relative w-[50px] h-[24px] flex justify-between items-center transition-transform duration-300 group-hover:scale-105">
              <div className="iooi-eye"></div>
              <div className="iooi-eye"></div>
              <style dangerouslySetInnerHTML={{__html: `
                .iooi-eye {
                  width: 24px;
                  height: 24px;
                  background-color: #fff;
                  background-image: radial-gradient(circle 7px, #050505 100%, transparent 0);
                  background-repeat: no-repeat;
                  border-radius: 50%;
                  animation: eyeMove 10s infinite, blink 10s infinite;
                }
                @keyframes eyeMove {
                  0%, 10% { background-position: center; }
                  13%, 40% { background-position: calc(50% - 7px) 50%; }
                  43%, 70% { background-position: calc(50% + 7px) 50%; }
                  73%, 90% { background-position: 50% calc(50% + 7px); }
                  93%, 100% { background-position: center; }
                }
                @keyframes blink {
                  0%, 10%, 12%, 20%, 22%, 40%, 42%, 60%, 62%, 70%, 72%, 90%, 92%, 98%, 100% { height: 24px; }
                  11%, 21%, 41%, 61%, 71%, 91%, 99% { height: 8px; }
                }
              `}} />
            </div>
            <span className="font-semibold text-[15px] tracking-wide text-white/95 group-hover:text-white transition-colors">I'm iooi</span>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex items-center gap-8 text-[14px] font-medium">
            <NavLink 
              to="/iooitv" 
              className={({ isActive }) => 
                isActive ? "text-white" : "text-white/60 hover:text-white transition-colors"
              }
            >
              {t.nav.iooiSpace}
            </NavLink>
            <NavLink 
              to="/workspace" 
              className={({ isActive }) => 
                isActive ? "text-white" : "text-white/60 hover:text-white transition-colors"
              }
            >
              {t.nav.workspace}
            </NavLink>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-5 text-[13px] font-medium text-white/70">
          <button className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Target size={14} />
            {t.nav.challenges}
          </button>
          <button className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Gift size={14} />
            {t.nav.earnIoos}
          </button>
          <button className="flex items-center gap-1.5 hover:text-white transition-colors">
            <CreditCard size={14} />
            {t.nav.pricing}
          </button>
          
          <div className="h-4 w-px bg-white/10 mx-1"></div>
          
          <LanguageSwitcher />
          
          <button 
            onClick={() => navigate('/canvas')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-full transition-all shadow-lg shadow-purple-500/20"
          >
            <span className="text-xs font-bold">{t.nav.enterCanvas}</span>
          </button>

          <Popover.Root>
            <Popover.Trigger asChild>
              <div className="flex items-center gap-2 cursor-pointer group ml-2">
                <div className="flex items-center gap-2 bg-white/5 group-hover:bg-white/10 transition-colors rounded-full pl-1.5 pr-3 py-1 border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Coins size={12} className="text-amber-400" />
                  </div>
                  <span className="text-xs text-white/90">33238713...</span>
                  <ChevronDown size={14} className="opacity-50 ml-1" />
                </div>
                
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                  <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content 
                className="z-[100] w-64 mt-3 p-0 rounded-2xl bg-[#111111]/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95" 
                align="end"
                sideOffset={8}
              >
                {/* Profile Header */}
                <div className="p-4 bg-gradient-to-br from-white/[0.08] to-transparent border-b border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 overflow-hidden border border-white/20 shadow-inner">
                      <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-white leading-tight">AI 创作者</h4>
                      <p className="text-[11px] text-white/50 mt-1">user@aicreative.app</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Crown size={12} className="text-amber-400" />
                      </div>
                      <span className="text-xs font-semibold text-white/90">Pro 会员</span>
                    </div>
                    <span className="text-[11px] font-medium text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">剩余 29 天</span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 flex flex-col gap-1">
                  <Popover.Close asChild>
                    <button 
                      onClick={() => navigate('/workspace')}
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors text-[13px] font-medium"
                    >
                      <LayoutDashboard size={16} />
                      {t.nav.workspace}
                    </button>
                  </Popover.Close>
                  <button className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors text-[13px] font-medium">
                    <User size={16} />
                    {t.user.profile}
                  </button>
                  <button className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors text-[13px] font-medium">
                    <Settings size={16} />
                    {t.user.settings}
                  </button>
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-white/5 bg-black/20">
                  <button className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors text-[13px] font-medium">
                    <LogOut size={16} />
                    {t.user.logout}
                  </button>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black">
        <Outlet />
      </main>
    </div>
  );
};