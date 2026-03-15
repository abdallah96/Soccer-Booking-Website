'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackPageView } from '@/lib/utils/analytics';

export default function FAQPage() {
  useEffect(() => {
    trackPageView('faq');
  }, []);

  const faqs = [
    {
      question: 'Comment réserver un terrain ?',
      answer: 'Créez un compte sur notre plateforme, sélectionnez un terrain, choisissez la date et l\'heure souhaitées, puis confirmez votre réservation. Le paiement peut être effectué via Wave, Orange Money ou en espèces sur place.'
    },
    {
      question: 'Quels sont les horaires d\'ouverture ?',
      answer: 'Nos terrains sont disponibles de 8h à 2h du matin. Les tarifs varient selon les horaires : tarif jour (8h-18h) et tarif nuit (19h-2h).'
    },
    {
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons le paiement via Wave, Orange Money, ou en espèces directement sur place lors de votre arrivée.'
    },
    {
      question: 'Puis-je annuler ma réservation ?',
      answer: 'Oui, vous pouvez annuler votre réservation depuis votre espace "Mes Réservations". Les annulations doivent être effectuées au moins 24h avant l\'heure de réservation pour être éligibles à un remboursement.'
    },
    {
      question: 'Que se passe-t-il en cas d\'intempéries ?',
      answer: 'En cas de conditions météorologiques extrêmes rendant le terrain impraticable, nous vous contacterons pour reporter ou annuler votre réservation sans frais.'
    },
    {
      question: 'Combien de joueurs peuvent jouer sur un terrain ?',
      answer: 'La capacité varie selon le terrain. Chaque terrain indique sa capacité maximale (nombre de joueurs) sur sa page de description.'
    },
    {
      question: 'Les équipements sont-ils fournis ?',
      answer: 'Les terrains sont équipés d\'éclairage, vestiaires et parking. Les équipements de jeu (ballons, chasubles) ne sont pas fournis, merci de venir avec votre matériel.'
    },
    {
      question: 'Puis-je réserver pour plusieurs heures consécutives ?',
      answer: 'Oui, vous pouvez réserver pour 1h ou 1h30. Pour des durées plus longues, contactez-nous directement via WhatsApp.'
    },
    {
      question: 'Y a-t-il un parking disponible ?',
      answer: 'Oui, tous nos terrains disposent d\'un parking sécurisé pour les visiteurs.'
    },
    {
      question: 'Comment contacter le support ?',
      answer: 'Vous pouvez nous contacter via WhatsApp au +221 78 925 18 34 ou utiliser le formulaire de contact sur notre site.'
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
            <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">FAQ</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            QUESTIONS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">FRÉQUENTES</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
            Trouvez rapidement les réponses à vos questions
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-lg hover:bg-white/10 transition-colors"
            >
              <h3 className="text-xl font-black text-white mb-3">
                {faq.question}
              </h3>
              <p className="text-white/70 leading-relaxed font-light">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4 font-light">
            Vous ne trouvez pas la réponse à votre question ?
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

