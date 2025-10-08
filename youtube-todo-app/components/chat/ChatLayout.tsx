'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  sidebar: ReactNode;
  threadsList: ReactNode;
  chatInterface: ReactNode;
  className?: string;
}

export function ChatLayout({
  sidebar,
  threadsList,
  chatInterface,
  className,
}: ChatLayoutProps) {
  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Projects Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex-shrink-0">
        {sidebar}
      </div>
      
      {/* Threads List */}
      <div className="w-80 border-r bg-background flex-shrink-0">
        {threadsList}
      </div>
      
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {chatInterface}
      </div>
    </div>
  );
}

interface ChatLayoutMobileProps {
  children: ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function ChatLayoutMobile({
  children,
  sidebarOpen,
  setSidebarOpen,
}: ChatLayoutMobileProps) {
  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-background border-r transform transition-transform duration-200 ease-in-out md:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full overflow-y-auto">
          {/* Sidebar content would go here */}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}