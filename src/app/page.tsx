'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/stores/authStore';

export default function Home() {
  const { user } = useAuthStore();

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
                  <span className="text-emerald-400 text-sm font-mono tracking-[0.3em] uppercase">DAKAR</span>
                  <span className="text-white/40 text-sm font-mono mx-3">/</span>
                  <span className="text-blue-400 text-sm font-mono tracking-[0.3em] uppercase">FOOTBALL</span>
                </div>

                <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.85] tracking-tight">
                  <span className="block text-white">RÉSERVATION</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-400" style={{ WebkitTextStroke: '1px rgba(34,197,94,0.3)' }}>
                    TERRAIN
                  </span>
                  <span className="block text-white/80 text-5xl sm:text-6xl lg:text-7xl mt-2">RÉINVENTÉE</span>
                </h1>
              </div>
              
              <p className="text-xl sm:text-2xl text-white/70 max-w-2xl leading-relaxed font-light">
                Pas de chaos WhatsApp. Pas d'annulations de dernière minute. Juste du football pur. Réservez votre terrain, rassemblez votre équipe, jouez.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/fields" className="group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <button className="relative px-10 py-5 bg-emerald-500 text-black font-black text-lg tracking-tight hover:bg-emerald-400 transition-colors transform group-hover:scale-105">
                      RÉSERVER MAINTENANT
                    </button>
                  </div>
                </Link>

                {!user && (
                  <Link href="/auth/register" className="group">
                    <button className="px-10 py-5 border-2 border-white/30 text-white font-bold text-lg tracking-tight hover:border-white/50 hover:bg-white/5 transition-all backdrop-blur-sm">
                      REJOINDRE GRATUITEMENT
                    </button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4 pt-8 max-w-xl">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-emerald-400 mb-1">32</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-mono">Terrains</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-blue-400 mb-1">1.2k</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-mono">Mensuel</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-emerald-400 mb-1">4.8</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-mono">Note</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-blue-400 mb-1">24/7</div>
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
                      <div className="text-xs text-white/40 font-mono mb-1">TERRAIN VEDETTE</div>
                      <div className="text-3xl font-black text-white mb-2">STADIUM ELITE</div>
                      <div className="text-sm text-white/60 mb-4">Plateau · Dakar</div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-white/40 mb-1">Joueurs</div>
                          <div className="text-xl font-black text-white">14/22</div>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-white/40 mb-1">Surface</div>
                          <div className="text-lg font-black text-white">Synthétique</div>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-white/40 mb-1">Note</div>
                          <div className="text-lg font-black text-white">4.9★</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="text-3xl font-black text-emerald-400">15 000</div>
                        <div className="text-xs text-white/40 font-mono">FCFA / heure</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-32 px-6 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-20">
            <div className="inline-block mb-6">
              <span className="text-black text-sm font-mono tracking-[0.3em] uppercase">COMMENT ÇA MARCHE</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="text-black">TROIS</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500 ml-4">ÉTAPES</span>
            </h2>
            <p className="text-xl text-black/60 max-w-2xl font-light">
              De l'idée au coup d'envoi. Simple, rapide, fiable.
            </p>
          </div>

          <div className="space-y-16 md:space-y-24">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 md:order-2">
                <div className="relative">
                  <div className="absolute -bottom-4 -left-4 w-full h-full border-2 border-black/10"></div>
                  <div className="relative bg-black text-white p-10 md:p-12">
                    <div className="text-8xl font-black text-emerald-400 mb-6">01</div>
                    <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">CHOISISSEZ VOTRE TERRAIN</h3>
                    <p className="text-lg text-white/70 leading-relaxed mb-6 font-light">
                      Parcourez les terrains premium à Dakar. Filtrez par localisation, prix, surface. Photos réelles, avis honnêtes.
                    </p>
                    <div className="pt-6 border-t border-white/10">
                      <div className="text-sm text-white/50 font-mono">Yoff · Parcelles · Plateau · Médina</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-7 md:order-1">
                <div className="h-64 md:h-96 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-2 border-black/5 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl font-black text-emerald-500/20">⚽</div>
                  </div>
                  <div className="absolute top-4 left-4 w-16 h-16 border-2 border-emerald-500/30 rotate-45"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-blue-500/30 -rotate-12"></div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7">
                <div className="h-64 md:h-96 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border-2 border-black/5 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl font-black text-blue-500/20">📅</div>
                  </div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-2 border-blue-500/30 -rotate-45"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-emerald-500/30 rotate-12"></div>
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="relative">
                  <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-black/10"></div>
                  <div className="relative bg-white border-2 border-black p-10 md:p-12">
                    <div className="text-8xl font-black text-blue-500 mb-6">02</div>
                    <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-black">RÉSERVEZ VOTRE CRÉNEAU</h3>
                    <p className="text-lg text-black/70 leading-relaxed mb-6 font-light">
                      Consultez les disponibilités en direct. Réservez instantanément. Partagez avec votre équipe. Plusieurs options de paiement.
                    </p>
                    <div className="pt-6 border-t border-black/10">
                      <div className="text-sm text-black/50 font-mono">Wave · Orange Money · Espèces</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 md:order-2">
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-full h-full border-2 border-black/10"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-blue-500 text-white p-10 md:p-12">
                    <div className="text-8xl font-black text-white/30 mb-6">03</div>
                    <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">PRÉSENTEZ-VOUS & JOUEZ</h3>
                    <p className="text-lg text-white/90 leading-relaxed mb-6 font-light">
                      Recevez des rappels. Terrain prêt. Équipe notifiée. Tout est prêt pour un match épique.
                    </p>
                    <div className="pt-6 border-t border-white/20">
                      <div className="text-sm text-white/70 font-mono">Annulation facile · Notifications instantanées</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-7 md:order-1">
                <div className="h-64 md:h-96 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-2 border-black/5 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl font-black text-emerald-500/20">🏆</div>
                  </div>
                  <div className="absolute top-4 left-4 w-16 h-16 border-2 border-emerald-500/30 rotate-45"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-blue-500/30 -rotate-12"></div>
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
              <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">TERRAINS VEDETTES</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-white">
              MEILLEURES <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">LOCALISATIONS</span>
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-xl text-white/60 font-light">Emplacements premium. Meilleures notes. Disponibles maintenant.</p>
              <Link href="/fields" className="text-white/80 hover:text-white font-bold text-sm font-mono tracking-wider border-b-2 border-white/30 hover:border-white transition-colors">
                TOUT VOIR →
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group cursor-pointer">
              <div className="relative mb-4">
                <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6 min-h-[300px] flex flex-col justify-between group-hover:bg-white/10 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-white/40 font-mono uppercase">Plateau</span>
                      <span className="text-sm font-black text-emerald-400">4.9★</span>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">STADIUM ELITE</h3>
                    <p className="text-sm text-white/60 mb-6 font-light">Centre-ville · Synthétique · Éclairage</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-white/40 font-mono">18:00 - 20:00</span>
                    <span className="text-2xl font-black text-emerald-400">15 000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="relative mb-4">
                <div className="absolute -bottom-2 -left-2 w-full h-full border-2 border-blue-500/30 group-hover:border-blue-500/50 transition-colors"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6 min-h-[300px] flex flex-col justify-between group-hover:bg-white/10 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-white/40 font-mono uppercase">Parcelles</span>
                      <span className="text-sm font-black text-blue-400">4.7★</span>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">SUNSET VALLEY</h3>
                    <p className="text-sm text-white/60 mb-6 font-light">Bord de mer · Gazon naturel · Parking</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-white/40 font-mono">20:00 - 22:00</span>
                    <span className="text-2xl font-black text-blue-400">12 000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="relative mb-4">
                <div className="absolute -top-2 -right-2 w-full h-full border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6 min-h-[300px] flex flex-col justify-between group-hover:bg-white/10 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-white/40 font-mono uppercase">Médina</span>
                      <span className="text-sm font-black text-emerald-400">4.8★</span>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">RIVERSIDE ARENA</h3>
                    <p className="text-sm text-white/60 mb-6 font-light">Prêt pour tournoi · Tribune · Snacks</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-white/40 font-mono">Week-end</span>
                    <span className="text-2xl font-black text-emerald-400">18 000</span>
                  </div>
                </div>
              </div>
            </div>
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
              ? 'Choisissez un terrain, réservez votre créneau, dominez le terrain.'
              : 'Rejoignez des milliers de joueurs à Dakar. Réservez votre premier match en quelques secondes.'}
          </p>
          
          <Link href={user ? '/fields' : '/auth/register'} className="inline-block group">
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
