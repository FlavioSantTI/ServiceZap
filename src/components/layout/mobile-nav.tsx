'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Receipt,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { title: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
  { title: 'OS', href: '/dashboard/work-orders', icon: ClipboardList },
  { title: 'Cobranças', href: '/dashboard/invoices', icon: Receipt },
  { title: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 shadow-lg shadow-black/5">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-[#E8622C] font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-xl transition-all',
                  isActive && 'bg-orange-500/15'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-[#E8622C]' : 'text-neutral-500 dark:text-neutral-400')} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
