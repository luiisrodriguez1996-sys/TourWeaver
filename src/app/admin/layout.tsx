import React from 'react';
import { Globe, LayoutDashboard, Map, Image as ImageIcon, Settings, LogOut, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed inset-y-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-headline tracking-tight text-primary">Tour Weaver</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <LayoutDashboard className="w-4 h-4" />
              Tours
            </Button>
          </Link>
          <Link href="/admin/tours/new">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <PlusCircle className="w-4 h-4" />
              New Tour
            </Button>
          </Link>
          <Separator className="my-4" />
          <Link href="#">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-primary">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@tourweaver.com</p>
            </div>
            <Link href="/">
              <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive cursor-pointer" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-lg font-semibold text-muted-foreground">Admin Dashboard</h2>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="hidden sm:flex">Documentation</Button>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}