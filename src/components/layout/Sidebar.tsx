import React from 'react';
import {
  LayoutDashboard,
  Globe,
  AlertTriangle,
  Wrench,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers
} from 'lucide-react';
import { PageId } from '../../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  openIssuesCount?: number;
  pendingFixesCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  openIssuesCount = 7,
  pendingFixesCount = 4,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const navItems: { id: PageId; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'websites', label: 'My Websites', icon: Globe },
    {
      id: 'results',
      label: 'Scan Results',
      icon: AlertTriangle,
      badge: openIssuesCount > 0 ? openIssuesCount : undefined
    },
    {
      id: 'fixes',
      label: 'AI Fixes',
      icon: Wrench,
      badge: pendingFixesCount > 0 ? `${pendingFixesCount} new` : undefined
    },
    { id: 'widget', label: 'Accessibility Widget', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#292A27]/30 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#EAEAE4] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#EAEAE4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED] flex items-center justify-center text-[#C96F82] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold tracking-tight text-[#292A27]">
                  Access<span className="text-[#C96F82]">AI</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] text-[#70716B] font-mono tracking-wide">
                Detect • Repair • Verify
              </p>
            </div>
          </div>
        </div>

        {/* Engine Status Strip */}
        <div className="px-5 py-2.5 bg-[#FAFAF8] border-b border-[#EAEAE4] flex items-center justify-between text-[11px] text-[#70716B]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#648568]"></span>
            <span className="font-semibold text-[#292A27]">WCAG 2.1 AA Engine</span>
          </span>
          <span className="text-[#A84F65] text-[10px] font-bold bg-[#FFF5F6] px-2 py-0.5 rounded-full border border-[#F8E9ED]">
            Active
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#999A92]">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#FFF5F6] text-[#A84F65] font-semibold border border-[#F8E9ED] shadow-sm'
                    : 'text-[#70716B] hover:text-[#292A27] hover:bg-[#FAFAF8]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#C96F82]' : 'text-[#70716B] group-hover:text-[#292A27]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#F8E9ED] text-[#A84F65]'
                        : 'bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[#EAEAE4] space-y-2 bg-[#FAFAF8]">
          {/* Help & Support */}
          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#70716B] hover:text-[#292A27] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#EAEAE4]"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#7B8053]" />
              <span>Help & Documentation</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#999A92]" />
          </button>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EAEAE4] shadow-card">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#F8E9ED] border border-[#C96F82] flex items-center justify-center text-xs font-bold text-[#A84F65] flex-shrink-0">
                AV
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#292A27] truncate">Alex Vance</p>
                <p className="text-[11px] text-[#70716B] truncate">Lead Accessibility</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-[#999A92] hover:text-[#C96F82] p-1 rounded transition-colors"
              title="Open Settings"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
