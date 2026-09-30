import React from 'react';
import { Compass, BookOpen, MessageSquare, BarChart2 } from 'lucide-react';
import { useI18n } from '../features/i18n';

export type TabType = 'chat' | 'characters' | 'vocab' | 'progress';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  dueCount = 0
}) => {
  const { t } = useI18n();

  const tabs: {
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare
    },
    {
      id: 'characters',
      label: 'Characters',
      icon: Compass
    },
    {
      id: 'vocab',
      label: 'Vocabulary',
      icon: BookOpen
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: BarChart2,
      badge: dueCount > 0 ? dueCount : undefined
    }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border-subtle bg-surface/95 backdrop-blur-md md:hidden shadow-lg transition-colors pb-safe"
    >
      <div className="grid grid-cols-4 items-center px-1.5 py-1 max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-1 transition-all active:scale-95 ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted hover:text-heading'
              }`}
            >
              <div
                className={`relative flex items-center justify-center rounded-lg px-2.5 py-1 transition-colors ${
                  isActive
                    ? 'bg-card-warm text-primary'
                    : 'text-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] tracking-tight leading-none truncate max-w-[65px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
