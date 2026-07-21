import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Review } from '../types';
import { Star, MessageSquare, Check, User, ChevronRight, PenTool } from 'lucide-react';

interface ReviewsProps {
  reviews: Review[];
  onReviewCreated: (review: Review) => void;
}

export default function Reviews({ reviews, onReviewCreated }: ReviewsProps) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Calculate stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) {
      alert('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newReview: Review = {
        id: 'REV-' + Math.floor(1000 + Math.random() * 9000),
        name,
        rating,
        comment,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      };

      onReviewCreated(newReview);
      setIsSubmitting(false);
      setSuccessMessage(true);
      setName('');
      setComment('');
      setRating(5);
      
      // Hide success message after 4s
      setTimeout(() => {
        setSuccessMessage(false);
        setShowForm(false);
      }, 3000);
    }, 800);
  };

  return (
    <section id="reviews" className="py-24 bg-zinc-900 border-t border-zinc-850 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-brand-yellow font-mono text-xs font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1.5 rounded-full inline-block mb-4">
            CUSTOMER VOICE
          </span>
          <h2 className="text-4xl font-bold font-display tracking-tight text-white mb-4">
            Customer Reviews & Ratings
          </h2>
          <p className="text-zinc-400 text-base">
            Verified customer experiences with our premium rides. We maintain complete transparent reviews from our genuine passengers.
          </p>
        </div>

        {/* Reviews Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Stats Left Column */}
          <div className="lg:col-span-4 bg-zinc-950 p-8 rounded-2xl border border-zinc-800/80 text-center">
            <h3 className="text-white font-bold font-display text-lg mb-6">Review Summary</h3>
            <div className="text-6xl font-extrabold text-white font-mono mb-2">{averageRating}</div>
            
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(averageRating))
                      ? 'text-brand-yellow fill-brand-yellow'
                      : 'text-zinc-700'
                  }`}
                />
              ))}
            </div>

            <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-8">
              Based on {totalReviews} passenger {totalReviews === 1 ? 'review' : 'reviews'}
            </p>

            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              {showForm ? 'Close Review Form' : 'Write a Review'}
            </button>
          </div>

          {/* List Right Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Dynamic Form Container */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mb-8"
                >
                  <div className="bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-4">
                    <h4 className="text-lg font-bold text-white font-display">Write Your Verified Review</h4>
                    
                    {successMessage ? (
                      <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center flex flex-col items-center gap-2">
                        <Check className="w-8 h-8 text-emerald-500" />
                        <span className="font-semibold text-sm">Review Submitted Successfully!</span>
                        <p className="text-zinc-400 text-xs">Thank you for sharing your premium experience with us.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Your Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="Rahul S."
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2 pl-4 pr-4 text-white text-sm outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Rating (1 to 5 Stars) *</label>
                            <div className="flex items-center gap-1.5 h-[38px]">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="text-zinc-500 hover:text-brand-yellow transition-colors cursor-pointer"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= (hoverRating || rating)
                                        ? 'text-brand-yellow fill-brand-yellow'
                                        : 'text-zinc-700'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Review Comment *</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Share your travel experience, vehicle condition, and driver punctuality details..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 px-4 text-white text-sm outline-none transition-colors resize-none"
                          />
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-xs py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Verified Review'}
                        </motion.button>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-10 text-center font-sans text-zinc-400">
                  <p className="text-base font-bold text-white mb-2">No reviews yet</p>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                    Be the first passenger to share your premium travel experience! Click "Write a Review" on the left to begin.
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={review.id}
                    className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-brand-yellow font-bold text-sm">
                            {review.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-white text-sm font-semibold block leading-tight">{review.name}</span>
                            <span className="text-zinc-500 text-[10px] font-mono leading-none">{review.date}</span>
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating
                                  ? 'text-brand-yellow fill-brand-yellow'
                                  : 'text-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-zinc-300 text-sm leading-relaxed font-sans pl-11">
                        {review.comment}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
