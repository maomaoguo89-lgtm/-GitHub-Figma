import React from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useLanguageStore } from '../store/languageStore';
import { useTranslation } from '../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const languages = [
    { code: 'zh' as const, label: t.language.chinese, flag: '🇨🇳' },
    { code: 'en' as const, label: t.language.english, flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button 
          className="flex items-center gap-1.5 hover:text-white transition-colors group"
          aria-label="Switch Language"
        >
          <span className="text-[13px] font-medium">
            {language === 'zh' ? 'CN' : 'EN'}
          </span>
          <ChevronDown 
            size={14} 
            className={`opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-[100] min-w-[180px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
          sideOffset={8}
          align="end"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-white/90">
              <Globe size={16} />
              <span className="text-sm font-medium">Select Language</span>
            </div>
          </div>

          {/* Language Options */}
          <div className="py-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 flex items-center justify-between gap-3
                  transition-colors text-left group
                  ${language === lang.code 
                    ? 'bg-white/5 text-white' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                </div>
                
                {language === lang.code && (
                  <Check size={16} className="text-white" />
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.02]">
            <p className="text-xs text-white/40 text-center">
              {language === 'zh' ? '语言偏好将被保存' : 'Language preference will be saved'}
            </p>
          </div>

          <Popover.Arrow className="fill-[#1a1a1a]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
