import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';

type AppLayoutProps = {
  userName?: string;
  onLogout?: () => void;
  children: ReactNode;
};

export const AppLayout = ({ userName, onLogout,  children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <AppHeader userName={userName} onLogout={onLogout ?? (() => undefined)} />

      <div className="mx-auto flex max-w-[1600px]">
        <AppSidebar />

        <main className="flex-1 space-y-6 p-4 md:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
};
