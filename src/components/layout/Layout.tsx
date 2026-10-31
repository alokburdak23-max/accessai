import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageId, NotificationItem } from '../../types';

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  openIssuesCount?: number;
  pendingFixesCount?: number;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onOpenAiAssistant?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  openIssuesCount,
  pendingFixesCount,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onOpenAiAssistant,
  children
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#292A27] flex">
      {/* Persistent / Responsive Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        openIssuesCount={openIssuesCount}
        pendingFixesCount={pendingFixesCount}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Persistent Top Navigation */}
        <Topbar
          currentPage={currentPage}
          onNavigate={onNavigate}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          notifications={notifications}
          onMarkNotificationRead={onMarkNotificationRead}
          onClearAllNotifications={onClearAllNotifications}
          onOpenAiAssistant={onOpenAiAssistant}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-[#EAEAE4] bg-white px-6 py-4 text-center text-xs text-[#70716B]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              <strong className="text-[#A84F65]">NETRA</strong> • Making the Digital World Accessible to Everyone. <span className="text-[#999A92] font-normal">(Powered by AccessAI)</span>
            </span>
            <span className="text-[#999A92]">
              Team AccessAI • SPHINX'26 Hackathon • WCAG 2.1 AA Compliant
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
