import Link from 'next/link';
import Image from 'next/image';
import { LOGO_URL, isValidLogoUrl } from '@/lib/utils/constants';

export const Footer = () => {
  return (
    <footer className="relative bg-black text-white/60 mt-20 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                {isValidLogoUrl(LOGO_URL) && LOGO_URL !== '/logo-placeholder.png' ? (
                  <Image
                    src={LOGO_URL}
                    alt="Petit Camp Logo"
                    width={48}
                    height={48}
                    className="object-contain"

                  />
                ) : (
                  <div className="w-12 h-12 bg-white text-black flex items-center justify-center">
                    <span className="font-black text-xl">PC</span>
                  </div>
                )}
              </div>
              <span className="font-black text-2xl text-white">PETIT CAMP</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed font-light">
              La plateforme de référence pour réserver votre terrain de football à Petit Camp. Réservez votre créneau, rassemblez votre équipe, jouez.
            </p>
            <div className="flex space-x-3 pt-2">
              <a 
                href="https://www.facebook.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 hover:border-white/40 flex items-center justify-center transition-colors group"
                aria-label="Facebook"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">📘</span>
              </a>
              <a 
                href="https://www.instagram.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 hover:border-white/40 flex items-center justify-center transition-colors group"
                aria-label="Instagram"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">📷</span>
              </a>
              <a 
                href="https://wa.me/221789251834" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center transition-colors group"
                aria-label="WhatsApp"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">📱</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-black mb-6 text-sm tracking-tight uppercase">Liens Rapides</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/fields" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  Parcourir les Terrains
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  Connexion
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black mb-6 text-sm tracking-tight uppercase">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  Nous Contacter
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/conditions-generales" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link href="/politique-de-confidentialite" className="text-white/60 hover:text-white transition-colors font-light text-sm">
                  Politique de Confidentialité
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black mb-6 text-sm tracking-tight uppercase">Contact</h4>
            <ul className="space-y-4 text-sm font-light">
              <li className="text-white/60">
                <a href="mailto:info@sportbook.sn" className="hover:text-white transition-colors">
                  info@sportbook.sn
                </a>
              </li>
              <li className="text-white/60">
                <a href="https://wa.me/221789251834" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <span>📱</span>
                  <span>+221 78 925 18 34</span>
                </a>
              </li>
              <li className="text-white/60">
                Thiés, Sénégal
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-white/40 font-light">
              &copy; {new Date().getFullYear()} Petit Camp. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-2 text-sm text-white/40 font-light">
              <a href='http://g-tech.dev'>By G-Tech</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
