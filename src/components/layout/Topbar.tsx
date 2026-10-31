import React, { useState } from 'react';
import {
  Bell,
  Menu,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
  Sliders
} from 'lucide-react';
import { PageId, NotificationItem } from '../../types';

interface TopbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenMobileMenu: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onOpenAiAssistant?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentPage,
  onNavigate,
  onOpenMobileMenu,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onOpenAiAssistant
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const pageTitles: Record<PageId, { title: string; subtitle: string; label: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Understand your website accessibility and discover what needs improvement.',
      label: 'Dashboard'
    },
    websites: {
      title: 'My Websites',
      subtitle: 'Scan target web properties, run diagnostics, and monitor compliance status.',
      label: 'My Websites'
    },
    results: {
      title: 'Scan Results',
      subtitle: 'Understand accessibility barriers with progressive disclosure and technical inspection.',
      label: 'Scan Results'
    },
    fixes: {
      title: 'AI Fixes',
      subtitle: 'Review, test, approve, and verify AI-generated accessible code snippets.',
      label: 'AI Fixes'
    },
    widget: {
      title: 'Accessibility Widget',
      subtitle: 'Deploy a drop-in accessibility overlay on any website with a single script tag.',
      label: 'Accessibility Widget'
    },
    analytics: {
      title: 'Analytics & Trends',
      subtitle: 'Longitudinal audit score progress, root causes, and assistive human impact.',
      label: 'Analytics'
    },
    reports: {
      title: 'Compliance Reports',
      subtitle: 'Structured executive documentation, WCAG breakdowns, and exportable reports.',
      label: 'Reports'
    },
    settings: {
      title: 'Platform Settings',
      subtitle: 'Manage AI provider configurations, audit standards, and notification alerts.',
      label: 'Settings'
    }
  };

  const currentMeta = pageTitles[currentPage] || pageTitles.dashboard;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAEAE4] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs / Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#70716B] hover:text-[#292A27] rounded-lg hover:bg-[#FAFAF8] transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#70716B]">
            <span className="hover:text-[#A84F65] cursor-pointer" onClick={() => onNavigate('dashboard')}>
              NETRA
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#999A92]" />
            <span className="text-[#A84F65] font-semibold">
              {currentMeta.label}
            </span>
          </nav>

          <h2 className="text-lg sm:text-xl font-bold text-[#292A27] tracking-tight truncate">
            {currentMeta.title}
          </h2>
        </div>
      </div>

      {/* Right Actions: Quick Scan, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Quick Scan Primary CTA */}
        {currentPage !== 'websites' && (
          <button
            onClick={() => onNavigate('websites')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-semibold shadow-rose-sm transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Scan Website</span>
          </button>
        )}

        {/* AI Assisted Button (Functional Trigger for AI Assistance Panel) */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6F7F0] hover:bg-[#EEF0E3] border border-[#EEF0E3] hover:border-[#7B8053]/40 text-[#62683F] hover:text-[#292A27] text-xs font-semibold transition-all transform active:scale-95 shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
          aria-label="Open AI-Assisted accessibility consultant"
          title="Open AI-Assisted Accessibility Consultant"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C96F82] group-hover:rotate-12 transition-transform" />
          <span>AI Assisted</span>
          <span className="w-2 h-2 rounded-full bg-[#7B8053] animate-pulse"></span>
        </button>

        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-[#70716B] hover:text-[#292A27] rounded-xl hover:bg-[#FAFAF8] border border-transparent hover:border-[#EAEAE4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
            aria-label={`View notifications (${unreadCount} unread)`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#C96F82] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#EAEAE4] shadow-dropdown z-50 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE4]">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#292A27]">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FFF5F6] text-[#A84F65] border border-[#F8E9ED] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onClearAllNotifications}
                      className="text-xs text-[#C96F82] hover:text-[#A84F65] font-semibold transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#70716B] py-4 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((notif) => {
                      const icons = {
                        alert: <AlertTriangle className="w-4 h-4 text-[#D88A4C]" />,
                        success: <CheckCircle2 className="w-4 h-4 text-[#648568]" />,
                        info: <Info className="w-4 h-4 text-[#7B8053]" />
                      };

                      return (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            notif.read
                              ? 'bg-[#FAFAF8] border-[#EAEAE4] text-[#70716B]'
                              : 'bg-[#FFF5F6] border-[#F8E9ED] text-[#292A27]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5">{icons[notif.type]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#292A27] truncate">{notif.title}</p>
                              <p className="text-[11px] text-[#70716B] mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-[#999A92] mt-1 block">{notif.timestamp}</span>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-[#C96F82] flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Settings trigger */}
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 text-[#70716B] hover:text-[#292A27] rounded-xl hover:bg-[#FAFAF8] border border-transparent hover:border-[#EAEAE4] transition-colors"
          title="Open Preferences"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <button
          onClick={() => onNavigate('settings')}
          className="w-8 h-8 rounded-full bg-[#F8E9ED] border border-[#C96F82] p-0.5 focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
          title="Team AccessAI (Settings)"
        >
          <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-[#A84F65]">
            TA
          </div>
        </button>
      </div>
    </header>
  );
};
