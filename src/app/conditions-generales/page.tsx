'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackPageView } from '@/lib/utils/analytics';

export default function TermsPage() {
  useEffect(() => {
    trackPageView('terms');
  }, []);

  const sections = [
    {
      title: '1. Acceptation des conditions',
      content: 'En utilisant la plateforme Petit Camp et en effectuant une réservation, vous acceptez sans réserve les présentes conditions générales d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser nos services.'
    },
    {
      title: '2. Description du service',
      content: 'Petit Camp est une plateforme de réservation en ligne permettant aux utilisateurs de réserver des terrains de football. Nous mettons à votre disposition des terrains professionnels avec installations modernes (éclairage, vestiaires, parking).'
    },
    {
      title: '3. Réservations',
      content: 'Les réservations sont effectuées en ligne via notre plateforme. Chaque réservation est confirmée par email et SMS. La réservation est définitive une fois le paiement validé. Les créneaux sont disponibles de 8h à 2h du matin.'
    },
    {
      title: '4. Tarifs et paiement',
      content: 'Les tarifs varient selon les horaires : tarif jour (8h-18h) et tarif nuit (19h-2h). Les prix sont indiqués en FCFA par heure. Le paiement peut être effectué via Wave, Orange Money ou en espèces sur place. Tous les prix sont TTC.'
    },
    {
      title: '5. Annulation et remboursement',
      content: 'Les annulations doivent être effectuées au moins 24 heures avant l\'heure de réservation pour être éligibles à un remboursement. Les annulations de dernière minute (moins de 24h) ne donnent pas droit à un remboursement. En cas d\'intempéries rendant le terrain impraticable, nous proposerons un report ou un remboursement intégral.'
    },
    {
      title: '6. Utilisation du terrain',
      content: 'Le terrain doit être utilisé conformément à sa destination (football). L\'utilisateur s\'engage à respecter les installations et équipements mis à disposition. Tout dommage causé volontairement ou par négligence sera facturé à l\'utilisateur responsable.'
    },
    {
      title: '7. Responsabilité',
      content: 'Petit Camp décline toute responsabilité en cas d\'accident, de blessure ou de vol survenant pendant l\'utilisation du terrain. Les utilisateurs utilisent les installations à leurs propres risques. Il est recommandé de souscrire une assurance personnelle.'
    },
    {
      title: '8. Comportement',
      content: 'Tout comportement inapproprié, agressif ou non respectueux envers le personnel ou les autres utilisateurs peut entraîner l\'expulsion immédiate du terrain sans remboursement. Le respect des règles de bonne conduite est obligatoire.'
    },
    {
      title: '9. Données personnelles',
      content: 'Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité. En créant un compte, vous acceptez le traitement de vos données pour la gestion de vos réservations et l\'amélioration de nos services.'
    },
    {
      title: '10. Modification des conditions',
      content: 'Petit Camp se réserve le droit de modifier les présentes conditions générales à tout moment. Les modifications seront communiquées aux utilisateurs et s\'appliqueront aux nouvelles réservations. Il est recommandé de consulter régulièrement cette page.'
    },
    {
      title: '11. Propriété intellectuelle',
      content: 'Tous les contenus de la plateforme (textes, images, logos) sont la propriété de Petit Camp et sont protégés par les lois sur la propriété intellectuelle. Toute reproduction non autorisée est interdite.'
    },
    {
      title: '12. Droit applicable',
      content: 'Les présentes conditions générales sont régies par le droit sénégalais. En cas de litige, les parties s\'engagent à rechercher une solution amiable. À défaut, le litige sera porté devant les tribunaux compétents de Thiés, Sénégal.'
    }
  ];

  return (
    <div className="min-h-screen bg-black py-16 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto text-white">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 font-light font-mono text-sm transition-colors"
        >
          ← RETOUR
        </Link>

        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">LEGAL</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            CONDITIONS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">GÉNÉRALES</span>
          </h1>
          <p className="text-sm text-white/40 font-mono mb-4">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-lg"
            >
              <h2 className="text-2xl font-black text-white mb-4">
                {section.title}
              </h2>
              <p className="text-white/70 leading-relaxed font-light">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4 font-light">
            Questions sur nos conditions générales ?
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
          >
            NOUS CONTACTER
          </Link>
        </div>
      </div>
    </div>
  );
}

