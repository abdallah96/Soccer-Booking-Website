'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LOGO_URL, isValidLogoUrl } from '@/lib/utils/constants';

export const Header = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    router.push('/');
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b-2 border-black/10' 
          : 'bg-white/90 backdrop-blur-lg'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <Link 
            href="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="relative w-12 h-12 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
              {isValidLogoUrl(LOGO_URL) && LOGO_URL !== '/logo-placeholder.png' ? (
                <Image
                  src={LOGO_URL}
                  alt="Petit Camp Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="w-12 h-12 bg-black flex items-center justify-center">
                  <span className="text-white font-black text-xl">PC</span>
                </div>
              )}
            </div>
            <span className="font-black text-2xl md:text-3xl text-black tracking-tight">
              PETIT CAMP
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-6">
            {user?.role === 'admin' ? (
              <>
                <Link 
                  href="/admin" 
                  className="px-4 py-2 bg-black text-white font-black text-sm tracking-tight hover:bg-black/80 transition-colors"
                >
                  ADMIN
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : user ? (
              <>
                <Link 
                  href="/" 
                  className="text-black hover:text-emerald-500 font-bold text-sm tracking-tight transition-colors"
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields" 
                  className="text-black hover:text-emerald-500 font-bold text-sm tracking-tight transition-colors"
                >
                  TERRAINS
                </Link>
                <Link 
                  href="/my-bookings" 
                  className="text-black hover:text-emerald-500 font-bold text-sm tracking-tight transition-colors"
                >
                  RÉSERVATIONS
                </Link>
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 text-black hover:text-emerald-500 font-bold text-sm tracking-tight transition-colors"
                >
                  <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.toUpperCase()}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/" 
                  className="text-black hover:text-emerald-500 font-bold text-sm tracking-tight transition-colors"
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields" 
                  className="text-black hover:text-emerald-500 font-bold text-sm tracking-tight transition-colors"
                >
                  TERRAINS
                </Link>
                <Link 
                  href="/auth/login" 
                  className="text-black hover:text-emerald-500 font-bold text-sm tracking-tight transition-colors"
                >
                  CONNEXION
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-6 py-2 bg-black text-white font-black text-sm tracking-tight hover:bg-black/80 transition-colors"
                >
                  INSCRIPTION
                </Link>
              </>
            )}
          </nav>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="lg:hidden flex flex-col justify-center items-center w-12 h-12 space-y-1.5 group"
            aria-label="Toggle menu"
          >
            <span 
              className={`block w-6 h-1 bg-black transition-all duration-300 ${
                showMenu ? 'rotate-45 translate-y-2' : ''
              }`}
            ></span>
            <span 
              className={`block w-6 h-1 bg-black transition-all duration-300 ${
                showMenu ? 'opacity-0' : ''
              }`}
            ></span>
            <span 
              className={`block w-6 h-1 bg-black transition-all duration-300 ${
                showMenu ? '-rotate-45 -translate-y-2' : ''
              }`}
            ></span>
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="lg:hidden border-t-2 border-black/10 bg-white/95 backdrop-blur-xl">
          <nav className="px-6 py-6 space-y-3">
            {user?.role === 'admin' ? (
              <>
                <Link 
                  href="/admin" 
                  className="block py-3 px-4 bg-black text-white font-black text-sm tracking-tight text-center"
                  onClick={() => setShowMenu(false)}
                >
                  ADMIN
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left py-3 text-red-600 hover:text-red-700 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : user ? (
              <>
                <Link 
                  href="/" 
                  className="block py-3 text-black font-bold text-sm tracking-tight hover:text-emerald-500 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields" 
                  className="block py-3 text-black font-bold text-sm tracking-tight hover:text-emerald-500 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  TERRAINS
                </Link>
                <Link 
                  href="/my-bookings" 
                  className="block py-3 text-black font-bold text-sm tracking-tight hover:text-emerald-500 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  RÉSERVATIONS
                </Link>
                <Link 
                  href="/profile" 
                  className="block py-3 text-black font-bold text-sm tracking-tight hover:text-emerald-500 transition-colors flex items-center gap-3"
                  onClick={() => setShowMenu(false)}
                >
                  <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.toUpperCase()}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left py-3 text-red-600 hover:text-red-700 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/" 
                  className="block py-3 text-black font-bold text-sm tracking-tight hover:text-emerald-500 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields" 
                  className="block py-3 text-black font-bold text-sm tracking-tight hover:text-emerald-500 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  TERRAINS
                </Link>
                <Link 
                  href="/auth/login" 
                  className="block py-3 text-black font-bold text-sm tracking-tight hover:text-emerald-500 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  CONNEXION
                </Link>
                <Link 
                  href="/auth/register" 
                  className="block py-3 px-4 bg-black text-white font-black text-sm tracking-tight text-center"
                  onClick={() => setShowMenu(false)}
                >
                  INSCRIPTION
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
