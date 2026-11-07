'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoading = status === 'loading';
  
  const userRole = (session?.user as any)?.role || 'STUDENT';
  const isActive = (path: string) => pathname === path;

  const dashboardLink = userRole === 'STUDENT' ? '/' : '/admin';
  
  let dashboardText = 'Student Dashboard';
  if (userRole === 'TEACHER') dashboardText = 'Teacher Admin';
  if (userRole === 'ADMIN') dashboardText = 'Admin Dashboard';

  return (
    <header className="bg-virtue-cream border-b-2 border-virtue-orange sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* NEW: Real Logo and Motto */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="The Virtue College Logo" className="h-16 w-auto drop-shadow-sm" />
            <div className="flex flex-col">
              <span className="font-bold text-xl text-virtue-brown leading-tight tracking-tight">The Virtue College</span>
              <span className="text-[10px] text-virtue-orange font-bold uppercase tracking-wider">Knowledge Towards Allah's Bliss</span>
            </div>
          </Link>

          {session && (
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href={dashboardLink} 
                className={`text-sm font-semibold transition-colors ${isActive(dashboardLink) ? 'text-virtue-orange border-b-2 border-virtue-orange' : 'text-virtue-brown hover:text-virtue-orange'}`}
              >
                {dashboardText}
              </Link>
              
              <Link 
                href="/progress" 
                className={`text-sm font-semibold transition-colors ${isActive('/progress') ? 'text-virtue-orange border-b-2 border-virtue-orange' : 'text-virtue-brown hover:text-virtue-orange'}`}
              >
                My Progress
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-24 h-8 bg-virtue-cream-dark rounded animate-pulse"></div>
            ) : session ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-virtue-brown leading-tight">{session.user?.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">{userRole} • {session.user?.email}</p>
                </div>
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="px-4 py-2 bg-virtue-cream-dark text-virtue-brown border border-virtue-brown rounded-lg text-sm font-semibold hover:bg-virtue-brown hover:text-virtue-cream transition-colors">Log Out</button>
              </div>
            ) : (
              <Link href="/login" className="px-5 py-2 bg-virtue-orange text-white rounded-lg text-sm font-semibold hover:bg-virtue-orange-light transition-colors shadow-sm">Log In</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}