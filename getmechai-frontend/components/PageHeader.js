"use client";

import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "@/contexts/SidebarContext";

export default function PageHeader() {
  const { isOpen } = useSidebar();

  // Only show when sidebar is closed
  if (isOpen) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 backdrop-blur-md border-b" style={{ 
      background: 'var(--bg-card)', 
      borderColor: 'var(--border-color)' 
    }}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center tea-gif-container" style={{
            background: 'var(--accent-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Image src="/tea.gif" alt="Tea" width={24} height={24} />
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            GetMeChai
          </span>
        </Link>
      </div>
    </header>
  );
}
