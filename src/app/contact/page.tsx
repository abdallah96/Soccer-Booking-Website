'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { trackPageView, trackAction } from '@/lib/utils/analytics';
import { useEffect } from 'react';

const WHATSAPP_NUMBER = '+221789251834';

export default function ContactPage() {
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    trackPageView('contact');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }

    // Format WhatsApp message
    const whatsappMessage = encodeURIComponent(
      name.trim() 
        ? `Bonjour, je suis ${name.trim()}.\n\n${message.trim()}`
        : message.trim()
    );

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\s/g, '')}?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
    
    trackAction('button_clicked', 'whatsapp_contact', { has_name: !!name.trim() });
    
    // Reset form
    setName('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-black py-16 md:py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_50%,rgba(34,197,94,0.1),transparent_70%)]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-white">
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">CONTACT</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            CONTACTEZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">NOUS</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
            Une question ? Besoin d'aide ? Contactez-nous directement sur WhatsApp.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-emerald-500/30"></div>
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                  Nom (optionnel)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  placeholder="Écrivez votre message ici..."
                  className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-5 bg-emerald-500 text-black font-black text-lg tracking-tight hover:bg-emerald-400 transition-colors transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <span>📱</span>
                <span>ENVOYER SUR WHATSAPP</span>
              </button>

              <p className="text-center text-sm text-white/40 font-light">
                En cliquant, WhatsApp s'ouvrira avec votre message pré-rempli
              </p>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4 font-light">Ou contactez-nous directement :</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\s/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAction('link_clicked', 'whatsapp_direct')}
            className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
          >
            <span>📱</span>
            <span>{WHATSAPP_NUMBER}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

