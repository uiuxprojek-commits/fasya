'use client';

import * as React from 'react';
import { MobileBottomNav, MobileDrawer } from './mobile-nav';

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  userRole?: string;
  planCode?: 'starter' | 'pro';
  userName?: string;
  userEmail?: string;
}

export function DashboardClientWrapper({
  children,
  userRole = 'user',
  planCode = 'starter',
  userName,
  userEmail,
}: DashboardClientWrapperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const handleToggle = () => setIsDrawerOpen((prev) => !prev);
    const handleOpen = () => setIsDrawerOpen(true);
    const handleClose = () => setIsDrawerOpen(false);

    window.addEventListener('tatadana:toggle-drawer', handleToggle);
    window.addEventListener('tatadana:open-drawer', handleOpen);
    window.addEventListener('tatadana:close-drawer', handleClose);

    return () => {
      window.removeEventListener('tatadana:toggle-drawer', handleToggle);
      window.removeEventListener('tatadana:open-drawer', handleOpen);
      window.removeEventListener('tatadana:close-drawer', handleClose);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userRole={userRole}
        planCode={planCode}
        userName={userName}
        userEmail={userEmail}
      />
      {children}
      <MobileBottomNav />
    </div>
  );
}
