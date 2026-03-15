'use client';

import { useState } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  onReviewSubmitted: () => void;
  editingReview: { id: string; rating: number; comment: string } | null;
}

export function ReviewModal({
  isOpen,
  onClose,
  fieldId,
  onReviewSubmitted,
  editingReview,
}: ReviewModalProps) {
  const [rating, setRating] = useState(editingReview?.rating ?? 5);
  const [comment, setComment] = useState(editingReview?.comment ?? '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    setLoading(true);
    try {
      const url = editingReview ? `/api/reviews/${editingReview.id}` : '/api/reviews';
      const method = editingReview ? 'PUT' : 'POST';
      const body = editingReview
        ? { rating, comment }
        : { field_id: fieldId, rating, comment };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onReviewSubmitted();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 rounded-xl border border-white/10 p-6 max-w-md w-full">
        <h2 className="text-xl font-black text-white mb-4">
          {editingReview ? 'Modifier votre avis' : 'Laisser un avis'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Note</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`w-10 h-10 rounded border-2 ${
                    rating >= s ? 'border-yellow-400 text-yellow-400' : 'border-white/30 text-white/50'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2">Commentaire</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-white/20 text-white rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading || comment.trim().length < 10}
            className="flex-1 py-2 bg-red-600 text-white font-black rounded-lg disabled:opacity-50"
          >
            {loading ? 'Envoi...' : editingReview ? 'Enregistrer' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}
