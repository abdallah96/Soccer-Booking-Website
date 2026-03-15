'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LOGO_URL, isValidLogoUrl } from '@/lib/utils/constants';
import { trackAuth, trackAction } from '@/lib/utils/analytics';

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
    trackAuth('user_logged_out', { user_id: user?.id });
    logout();
    setShowMenu(false);
    router.push('/');
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b-2 border-gray-200' 
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
                <div className="w-12 h-12 bg-red-600 flex items-center justify-center">
                  <span className="text-white font-black text-xl">PC</span>
                </div>
              )}
            </div>
            <span className="font-black text-2xl md:text-3xl text-gray-900 tracking-tight">
              PETIT CAMP
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-6">
            {(user?.role === 'admin' || user?.role === 'super_admin') ? (
              <>
                <Link 
                  href="/admin" 
                  className="px-4 py-2 bg-red-600 text-white font-black text-sm tracking-tight hover:bg-red-700 transition-colors"
                >
                  ADMIN
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : user ? (
              <>
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields/info" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  TERRAIN
                </Link>
                <Link 
                  href="/fields" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  RÉSERVER
                </Link>
                <Link 
                  href="/my-bookings" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  MES RÉSERVATIONS
                </Link>
                <Link 
                  href="/contact" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  CONTACT
                </Link>
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.toUpperCase()}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields/info" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  TERRAIN
                </Link>
                <Link 
                  href="/fields" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  RÉSERVER
                </Link>
                <Link 
                  href="/contact" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  CONTACT
                </Link>
                <Link 
                  href="/auth/login" 
                  className="text-gray-700 hover:text-red-600 font-bold text-sm tracking-tight transition-colors"
                >
                  CONNEXION
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-6 py-2 bg-red-600 text-white font-black text-sm tracking-tight hover:bg-red-700 transition-colors"
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
              className={`block w-6 h-1 bg-gray-900 transition-all duration-300 ${
                showMenu ? 'rotate-45 translate-y-2' : ''
              }`}
            ></span>
            <span 
              className={`block w-6 h-1 bg-gray-900 transition-all duration-300 ${
                showMenu ? 'opacity-0' : ''
              }`}
            ></span>
            <span 
              className={`block w-6 h-1 bg-gray-900 transition-all duration-300 ${
                showMenu ? '-rotate-45 -translate-y-2' : ''
              }`}
            ></span>
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="lg:hidden border-t-2 border-gray-200 bg-white/95 backdrop-blur-xl">
          <nav className="px-6 py-6 space-y-3">
            {(user?.role === 'admin' || user?.role === 'super_admin') ? (
              <>
                <Link 
                  href="/admin" 
                  className="block py-3 px-4 bg-red-600 text-white font-black text-sm tracking-tight text-center"
                  onClick={() => setShowMenu(false)}
                >
                  ADMIN
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left py-3 text-gray-600 hover:text-gray-900 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : user ? (
              <>
                <Link 
                  href="/" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields/info" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  TERRAIN
                </Link>
                <Link 
                  href="/fields" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  RÉSERVER
                </Link>
                <Link 
                  href="/my-bookings" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  MES RÉSERVATIONS
                </Link>
                <Link 
                  href="/contact" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  CONTACT
                </Link>
                <Link 
                  href="/profile" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors flex items-center gap-3"
                  onClick={() => setShowMenu(false)}
                >
                  <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.toUpperCase()}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left py-3 text-gray-600 hover:text-gray-900 font-bold text-sm tracking-tight transition-colors"
                >
                  DÉCONNEXION
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  ACCUEIL
                </Link>
                <Link 
                  href="/fields/info" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  TERRAIN
                </Link>
                <Link 
                  href="/fields" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  RÉSERVER
                </Link>
                <Link 
                  href="/contact" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  CONTACT
                </Link>
                <Link 
                  href="/auth/login" 
                  className="block py-3 text-gray-700 font-bold text-sm tracking-tight hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  CONNEXION
                </Link>
                <Link 
                  href="/auth/register" 
                  className="block py-3 px-4 bg-red-600 text-white font-black text-sm tracking-tight text-center"
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
