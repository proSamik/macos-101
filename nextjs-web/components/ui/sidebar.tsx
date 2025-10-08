'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOut, useSession } from '@/lib/auth-client';
import { 
  LayoutDashboard, 
  CheckSquare, 
  User, 
  LogOut, 
  Menu, 
  X,
  Crown,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/sign-in';
        },
      },
    });
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/premium/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/premium/dashboard',
    },
    {
      name: 'Todo List',
      href: '/premium/todos',
      icon: CheckSquare,
      current: pathname === '/premium/todos',
    },
    {
      name: 'AI Chatbot',
      href: '/premium/chatbot',
      icon: MessageCircle,
      current: pathname === '/premium/chatbot',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: pathname === '/profile',
    },
  ];

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Premium</h2>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-100"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && session && (
        <Card className="m-4 p-3 bg-slate-50 border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-500 to-slate-700 flex items-center justify-center text-white font-semibold text-sm">
              {session.user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                item.current
                  ? "bg-slate-100 text-slate-900 border border-slate-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "mr-3")} />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className={cn(
            "w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className={cn("w-5 h-5", isCollapsed ? "" : "mr-3")} />
          {!isCollapsed && "Sign Out"}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;