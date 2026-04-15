import React, { useState } from 'react';
import '../styles/Feedback.css';

const Feedback = ({ booking, onSubmit, onBack }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [statusCard, setStatusCard] = useState({ text: '', type: '' });

  const handleSubmit = async () => {
    if (rating === 0) {
      setStatusCard({ text: 'Something went wrong. Please try again.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusCard({ text: '', type: '' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
      onSubmit({ rating, comment });
    } catch (error) {
      setStatusCard({ text: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-container">
        <div className="feedback-success">
          <div className="success-icon">✓</div>
          <h2>Thank You!</h2>
          <p>Your feedback has been submitted successfully.</p>
          <button className="back-btn" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Rate Your Experience</h2>
      </div>

      <div className="feedback-content">
        {statusCard.text && (
          <div className={`account-status-card ${statusCard.type || 'info'}`}>
            {statusCard.text}
          </div>
        )}
        <div className="movie-info">
          <h3>{booking?.movieName}</h3>
          <p>Share your feedback to help us improve!</p>
        </div>

        <div className="rating-section">
          <label>How would you rate your experience?</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`star ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
          <p className="rating-text">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</p>
        </div>

        <div className="comment-section">
          <label htmlFor="comment">Additional Comments (Optional)</label>
          <textarea
            id="comment"
            placeholder="Tell us what you loved or what we can improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="5"
            maxLength="500"
          />
          <p className="char-count">{comment.length}/500</p>
        </div>

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
};

export default Feedback;
