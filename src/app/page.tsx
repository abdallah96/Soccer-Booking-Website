'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/stores/authStore';
import { trackPageView, trackAction } from '@/lib/utils/analytics';

export default function Home() {
  const { user } = useAuthStore();

  useEffect(() => {
    trackPageView('home');
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white">
      <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.15),transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        </div>
        
        <div className="absolute top-1/4 right-1/4 w-96 h-96 border-2 border-emerald-500/20 rotate-45"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 border-2 border-blue-500/20 -rotate-12"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-emerald-400/10 rounded-full"></div>
        
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-8 lg:space-y-12">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="text-emerald-400 text-sm font-mono tracking-[0.3em] uppercase">Thiés</span>
                  <span className="text-white/40 text-sm font-mono mx-3">/</span>
                  <span className="text-blue-400 text-sm font-mono tracking-[0.3em] uppercase">FOOTBALL</span>
                </div>

                <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.85] tracking-tight">
                  <span className="block text-white">PETIT</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-400" style={{ WebkitTextStroke: '1px rgba(34,197,94,0.3)' }}>
                    CAMP
                  </span>
                  <span className="block text-white/80 text-5xl sm:text-6xl lg:text-7xl mt-2">RÉSERVATION</span>
                </h1>
              </div>
              
              <p className="text-xl sm:text-2xl text-white/70 max-w-2xl leading-relaxed font-light">
                Pas de chaos WhatsApp. Pas d'annulations de dernière minute. Juste du football pur. Réservez votre terrain, rassemblez votre équipe, jouez.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  href="/fields" 
                  className="group"
                  onClick={() => trackAction('link_clicked', 'book_now_home')}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <button className="relative px-10 py-5 bg-emerald-500 text-black font-black text-lg tracking-tight hover:bg-emerald-400 transition-colors transform group-hover:scale-105">
                      RÉSERVER MAINTENANT
                    </button>
                  </div>
                </Link>

                {!user && (
                  <Link 
                    href="/auth/register" 
                    className="group"
                    onClick={() => trackAction('link_clicked', 'register_home')}
                  >
                    <button className="px-10 py-5 border-2 border-white/30 text-white font-bold text-lg tracking-tight hover:border-white/50 hover:bg-white/5 transition-all backdrop-blur-sm">
                      REJOINDRE GRATUITEMENT
                    </button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 max-w-xl">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-emerald-400 mb-1">1</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-mono">Terrain</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-blue-400 mb-1">4.8</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-mono">Note</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-emerald-400 mb-1">8h-2h</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-mono">Ouvert</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative">
                <div className="absolute -top-8 -right-8 w-full h-full border-2 border-emerald-500/30"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-white/40 font-mono mb-2">PROCHAIN MATCH</div>
                        <div className="text-2xl font-black text-white">CE SOIR 20:00</div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500 text-black text-xs font-black">EN DIRECT</div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-xs text-white/40 font-mono mb-1">NOTRE TERRAIN</div>
                      <div className="text-3xl font-black text-white mb-2">PETIT CAMP</div>
                      <div className="text-sm text-white/60 mb-4">Thiés · Sénégal</div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-white/40 mb-1">Joueurs</div>
                          <div className="text-xl font-black text-white">22</div>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-white/40 mb-1">Surface</div>
                          <div className="text-lg font-black text-white">Synthétique</div>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-white/40 mb-1">Note</div>
                          <div className="text-lg font-black text-white">4.8★</div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white/60 font-mono">Jour (8h-18h)</div>
                          <div className="text-xl font-black text-emerald-400">20 000</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white/60 font-mono">Nuit (19h-2h)</div>
                          <div className="text-xl font-black text-blue-400">25 000</div>
                        </div>
                        <div className="text-xs text-white/40 font-mono pt-2">FCFA / heure</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-900 via-black to-gray-900 overflow-hidden">
        {/* Animated background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large gradient orbs with more intensity */}
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/15 via-blue-500/15 to-emerald-500/15 rounded-full blur-3xl"></div>
          
          {/* Grid pattern overlay - lighter for dark background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
          
          {/* Floating geometric shapes - more visible */}
          <div className="absolute top-20 right-20 w-32 h-32 border-2 border-emerald-500/20 rounded-full rotate-45 animate-pulse delay-500"></div>
          <div className="absolute bottom-32 left-32 w-24 h-24 border-2 border-blue-500/20 rounded-full -rotate-12 animate-pulse delay-700"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-emerald-500/25 rounded-full"></div>
          <div className="absolute bottom-1/3 left-1/4 w-20 h-20 border-2 border-blue-500/25 rounded-full"></div>
          
          {/* Diagonal lines accent - more visible */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
            <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          </div>
          
          {/* Corner accents - more visible */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-500/15 to-transparent rounded-br-full"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-500/15 to-transparent rounded-tl-full"></div>
        </div>

        <div className="relative max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-20 text-center">
            <div className="inline-block mb-6">
              <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">COMMENT ÇA MARCHE</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="text-white">TROIS</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 ml-4">ÉTAPES</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
              De l'idée au coup d'envoi. Simple, rapide, fiable.
            </p>
          </div>

          {/* Steps - Creative Timeline Design */}
          <div className="relative">
            {/* Vertical timeline line (hidden on mobile) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-emerald-500 transform -translate-x-1/2"></div>

            <div className="space-y-32 md:space-y-40">
              {/* Step 1 */}
              <div className="relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left side - Content */}
                  <div className="lg:order-1 relative group">
                    <div className="relative z-10">
                      {/* Step number badge */}
                      <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform group-hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl font-black text-white">01</span>
                      </div>
                      
                      {/* Content card */}
                      <div className="relative bg-gradient-to-br from-black via-black to-gray-900 text-white p-10 md:p-12 rounded-3xl shadow-2xl transform group-hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                          <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">CHOISISSEZ PETIT CAMP</h3>
                          <p className="text-lg text-white/70 leading-relaxed mb-6 font-light">
                            Un seul terrain, une seule mission : vous offrir la meilleure expérience de football. Terrain professionnel, installations modernes.
                          </p>
                          <div className="pt-6 border-t border-white/10">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm font-mono text-emerald-300">Éclairage</span>
                              <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm font-mono text-emerald-300">Vestiaires</span>
                              <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm font-mono text-emerald-300">Parking</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Decorative border */}
                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
                  </div>

                  {/* Right side - Visual */}
                  <div className="lg:order-2 relative">
                    <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-blue-500/20"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-9xl font-black text-emerald-500/30 transform group-hover:scale-110 transition-transform duration-500">⚽</div>
                      </div>
                      {/* Animated circles */}
                      <div className="absolute top-8 left-8 w-24 h-24 border-2 border-emerald-500/30 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-8 right-8 w-16 h-16 border-2 border-blue-500/30 rounded-full animate-pulse delay-300"></div>
                      <div className="absolute top-1/2 right-12 w-12 h-12 border-2 border-emerald-500/20 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left side - Visual */}
                  <div className="lg:order-1 relative">
                    <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-emerald-500/20"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-9xl font-black text-blue-500/30 transform group-hover:scale-110 transition-transform duration-500">📅</div>
                      </div>
                      {/* Animated elements */}
                      <div className="absolute top-12 right-12 w-20 h-20 border-2 border-blue-500/30 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-12 left-12 w-28 h-28 border-2 border-emerald-500/30 rounded-full animate-pulse delay-300"></div>
                      <div className="absolute top-1/2 left-8 w-14 h-14 border-2 border-blue-500/20 rounded-full"></div>
                    </div>
                  </div>

                  {/* Right side - Content */}
                  <div className="lg:order-2 relative group">
                    <div className="relative z-10">
                      {/* Step number badge */}
                      <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-300 z-20">
                        <span className="text-3xl font-black text-white">02</span>
                      </div>
                      
                      {/* Content card */}
                      <div className="relative bg-gray-800 border-2 border-gray-700 text-white p-10 md:p-12 rounded-3xl shadow-2xl transform group-hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                          <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">RÉSERVEZ VOTRE CRÉNEAU</h3>
                          <p className="text-lg text-white/70 leading-relaxed mb-6 font-light">
                            Choisissez votre date, heure et durée. Paiement instantané. Confirmation immédiate. C'est aussi simple que ça.
                          </p>
                          <div className="pt-6 border-t border-white/10">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm font-mono text-blue-300">Wave</span>
                              <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm font-mono text-emerald-300">Orange Money</span>
                              <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-mono text-white/80">Espèces</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Decorative border */}
                    <div className="absolute inset-0 border-2 border-blue-500/30 rounded-3xl transform -translate-x-4 translate-y-4 -z-10"></div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left side - Content */}
                  <div className="lg:order-1 relative group">
                    <div className="relative z-10">
                      {/* Step number badge */}
                      <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-emerald-500 via-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform group-hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl font-black text-white">03</span>
                      </div>
                      
                      {/* Content card */}
                      <div className="relative bg-gradient-to-br from-emerald-500 via-blue-500 to-emerald-500 text-white p-10 md:p-12 rounded-3xl shadow-2xl transform group-hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                          <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">PRÉSENTEZ-VOUS & JOUEZ</h3>
                          <p className="text-lg text-white/90 leading-relaxed mb-6 font-light">
                            Terrain prêt. Équipe notifiée. Tout est prêt. Il ne reste plus qu'à jouer et gagner.
                          </p>
                          <div className="pt-6 border-t border-white/20">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="px-4 py-2 bg-white/20 border border-white/30 rounded-full text-sm font-mono text-white">Confirmation instantanée</span>
                              <span className="px-4 py-2 bg-white/20 border border-white/30 rounded-full text-sm font-mono text-white">Annulation facile</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Decorative border */}
                    <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
                  </div>

                  {/* Right side - Visual */}
                  <div className="lg:order-2 relative">
                    <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-emerald-500/20"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-9xl font-black text-white/40 transform group-hover:scale-110 transition-transform duration-500">🏆</div>
                      </div>
                      {/* Animated elements */}
                      <div className="absolute top-8 right-8 w-20 h-20 border-2 border-white/30 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-8 left-8 w-24 h-24 border-2 border-white/20 rounded-full animate-pulse delay-300"></div>
                      <div className="absolute top-1/2 right-1/4 w-16 h-16 border-2 border-white/25 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-32 px-6 sm:px-8 lg:px-12 bg-black">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_50%,rgba(34,197,94,0.1),transparent_70%)]"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        </div>
        
        <div className="relative z-10 max-w-[1600px] mx-auto">
          <div className="mb-16">
            <div className="inline-block mb-6">
              <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">NOTRE TERRAIN</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-white">
              PETIT <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">CAMP</span>
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-xl text-white/60 font-light">Terrain professionnel. Installations modernes. Disponible maintenant.</p>
              <Link 
                href="/fields" 
                className="text-white/80 hover:text-white font-bold text-sm font-mono tracking-wider border-b-2 border-white/30 hover:border-white transition-colors"
                onClick={() => trackAction('link_clicked', 'book_from_field_section')}
              >
                RÉSERVER →
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-1 gap-6 max-w-2xl mx-auto">
            <Link href="/fields/petit-camp-1" className="group cursor-pointer">
              <div className="relative mb-4">
                <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8 min-h-[300px] flex flex-col justify-between group-hover:bg-white/10 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-white/40 font-mono uppercase">Thiés</span>
                      <span className="text-sm font-black text-emerald-400">4.8★</span>
                    </div>
                    <h3 className="text-4xl font-black text-white mb-3">PETIT CAMP</h3>
                    <p className="text-sm text-white/60 mb-6 font-light">Terrain synthétique · Éclairage · Vestiaires · Parking</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-xs text-white/40 font-mono mb-1">Jour (8h-18h)</div>
                      <div className="text-2xl font-black text-emerald-400">20 000</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 font-mono mb-1">Nuit (19h-2h)</div>
                      <div className="text-2xl font-black text-blue-400">25 000</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-emerald-500 to-blue-500 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 border-2 border-white/20 rotate-45"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 border-2 border-white/20 -rotate-12"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="mb-12">
            <span className="text-white/80 text-sm font-mono tracking-[0.3em] uppercase">PRÊT À JOUER ?</span>
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 text-white leading-tight">
            {user ? 'VOTRE PROCHAIN MATCH VOUS ATTEND' : 'COMMENCEZ VOTRE PARCOURS FOOTBALL'}
          </h2>
          
              <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
                {user
                  ? 'Réservez votre créneau, rassemblez votre équipe, jouez.'
                  : 'Réservez votre terrain à Petit Camp. Simple, rapide et fiable.'}
              </p>
          
          <Link 
            href={user ? '/fields' : '/auth/register'} 
            className="inline-block group"
            onClick={() => trackAction('link_clicked', user ? 'browse_fields_cta' : 'start_free_cta')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-black blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <button className="relative px-12 py-6 bg-black text-white font-black text-xl tracking-tight hover:bg-black/90 transition-colors transform group-hover:scale-105">
                {user ? 'PARCOURIR LES TERRAINS' : 'COMMENCER GRATUITEMENT'}
              </button>
            </div>
          </Link>
          
          <p className="mt-8 text-sm text-white/70 font-mono">Aucune carte bancaire · Gratuit à vie</p>
        </div>
      </section>
    </div>
  );
}
