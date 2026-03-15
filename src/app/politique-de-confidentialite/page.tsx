'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackPageView } from '@/lib/utils/analytics';

export default function PrivacyPage() {
  useEffect(() => {
    trackPageView('privacy');
  }, []);

  const sections = [
    {
      title: '1. Introduction',
      content: 'Petit Camp s\'engage à protéger la confidentialité et la sécurité de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme de réservation.'
    },
    {
      title: '2. Données collectées',
      content: 'Nous collectons les données suivantes : nom, prénom, email, numéro de téléphone, informations de paiement (via nos prestataires sécurisés), historique de réservations, et données de navigation (cookies, adresse IP). Ces données sont nécessaires pour la gestion de vos réservations et l\'amélioration de nos services.'
    },
    {
      title: '3. Utilisation des données',
      content: 'Vos données personnelles sont utilisées pour : traiter vos réservations, vous envoyer des confirmations et rappels, améliorer nos services, vous contacter en cas de problème, et vous informer de nos offres (avec votre consentement). Nous ne vendons jamais vos données à des tiers.'
    },
    {
      title: '4. Stockage et sécurité',
      content: 'Vos données sont stockées sur des serveurs sécurisés et protégées par des mesures techniques et organisationnelles appropriées. Nous utilisons le chiffrement SSL pour toutes les transmissions de données. Vos mots de passe sont cryptés de manière sécurisée.'
    },
    {
      title: '5. Partage des données',
      content: 'Nous ne partageons vos données qu\'avec : nos prestataires de paiement (Wave, Orange Money) pour le traitement des transactions, nos hébergeurs pour le stockage sécurisé, et les autorités légales si requis par la loi. Nous ne partageons jamais vos données à des fins commerciales.'
    },
    {
      title: '6. Cookies',
      content: 'Nous utilisons des cookies pour améliorer votre expérience, analyser l\'utilisation du site, et personnaliser le contenu. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur. Certains cookies sont essentiels au fonctionnement du site.'
    },
    {
      title: '7. Vos droits',
      content: 'Conformément à la réglementation sur la protection des données, vous avez le droit de : accéder à vos données, rectifier vos données, supprimer vos données, vous opposer au traitement, limiter le traitement, et porter plainte auprès de l\'autorité de contrôle compétente.'
    },
    {
      title: '8. Conservation des données',
      content: 'Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Les données de réservation sont conservées pendant 3 ans après votre dernière activité. Vous pouvez demander la suppression de vos données à tout moment.'
    },
    {
      title: '9. Données des mineurs',
      content: 'Notre service est destiné aux personnes majeures. Si vous avez moins de 18 ans, vous devez obtenir l\'autorisation de vos parents ou tuteurs légaux avant d\'utiliser notre plateforme. Nous ne collectons pas sciemment de données personnelles de mineurs sans consentement parental.'
    },
    {
      title: '10. Modifications',
      content: 'Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour. Nous vous informerons des changements importants par email ou notification sur la plateforme.'
    },
    {
      title: '11. Contact',
      content: 'Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous via WhatsApp au +221 78 925 18 34 ou utilisez notre formulaire de contact.'
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
            <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">CONFIDENTIALITÉ</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            POLITIQUE DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">CONFIDENTIALITÉ</span>
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
            Questions sur notre politique de confidentialité ?
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

