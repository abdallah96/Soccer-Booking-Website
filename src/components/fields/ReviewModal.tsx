'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  onReviewSubmitted: () => void;
}

// Star Rating Component
const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (rating: number) => void; interactive?: boolean }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`text-4xl transition-all duration-200 ${
            interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'
          } ${
            (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'
          }`}
          disabled={!interactive}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export function ReviewModal({ isOpen, onClose, fieldId, onReviewSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      toast.error('Veuillez écrire un commentaire d\'au moins 10 caractères');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          field_id: fieldId,
          rating,
          comment: comment.trim(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Merci pour votre avis !');
        onReviewSubmitted();
        onClose();
      } else {
        toast.error(result.error || 'Erreur lors de la soumission');
      }
    } catch (error) {
      toast.error('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900 border-2 border-red-500/30 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Decorative border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-gray-500/10 pointer-events-none" />
        
        <div className="relative p-8 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                Laissez-nous un commentaire
              </h2>
              <p className="text-white/60 font-light">
                Partagez votre expérience sur ce terrain
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-black text-white/80 mb-4 text-center uppercase tracking-tight font-mono">
                Votre note
              </label>
              <StarRating 
                rating={rating} 
                onRate={setRating} 
                interactive={true} 
              />
              {rating > 0 && (
                <p className="text-center text-white/60 text-sm mt-3">
                  {rating === 5 && '⭐ Excellent !'}
                  {rating === 4 && '👍 Très bien'}
                  {rating === 3 && '👍 Bien'}
                  {rating === 2 && '😐 Moyen'}
                  {rating === 1 && '👎 Pas bien'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-black text-white/80 mb-3 uppercase tracking-tight font-mono">
                Votre commentaire
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez votre expérience : qualité du terrain, installations, ambiance..."
                rows={6}
                className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 rounded-xl resize-none transition-all placeholder:text-white/30"
              />
              <p className="text-xs text-white/40 mt-2 font-light">
                {comment.length}/500 caractères minimum: 10
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white/10 text-white font-black hover:bg-white/20 transition-colors rounded-xl border border-white/20"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || rating === 0 || comment.trim().length < 10}
                className="flex-1 px-6 py-4 bg-red-600 text-white font-black hover:bg-red-700 transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {submitting ? 'Publication...' : 'Publier mon avis'}
                </span>
                {!submitting && (
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

