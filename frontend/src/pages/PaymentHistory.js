import React, { useEffect, useMemo, useState } from 'react';
import '../styles/AccountPages.css';
import { buildApiUrl, fetchJson } from '../utils/api';

const PaymentHistory = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusCard, setStatusCard] = useState({ text: '', type: '' });
  const [receiptStatusByPaymentId, setReceiptStatusByPaymentId] = useState({});
  const [feedbackByPaymentId, setFeedbackByPaymentId] = useState({});
  const [submittingFeedbackByPaymentId, setSubmittingFeedbackByPaymentId] = useState({});
  const [feedbackMessageByPaymentId, setFeedbackMessageByPaymentId] = useState({});
  const [hoverState, setHoverState] = useState({ paymentId: null, rating: 0 });

  const userId = user?._id || user?.id || user?.uid;
  const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  const formatDateTime = (value) => {
    if (!value) return { date: 'N/A', time: 'N/A' };
    const d = new Date(value);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) {
        setHistory([]);
        setStatusCard({ text: 'Login required to view payment history.', type: 'warning' });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const separator = emailQuery ? '&' : '?';
        const data = await fetchJson(`/api/payments/history/${userId}${emailQuery}${separator}t=${Date.now()}`);
        setHistory(data.history || []);
        if (!data.history?.length) {
          setStatusCard({ text: 'No payment records available yet.', type: 'info' });
        } else {
          setStatusCard({ text: '', type: '' });
        }
      } catch (error) {
        setHistory([]);
        setStatusCard({ text: 'Unable to load payment history right now. Please try again.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userId, emailQuery]);

  useEffect(() => {
    const loadExistingFeedback = async () => {
      if (!userId) return;
      try {
        const feedbackList = await fetchJson(`/api/feedback/user/${userId}`);
        const mapped = (feedbackList || []).reduce((acc, item) => {
          const paymentKey = item?.payment?._id || item?.paymentId || item?.payment;
          if (paymentKey && item?.rating) {
            acc[String(paymentKey)] = Number(item.rating);
          }
          return acc;
        }, {});
        setFeedbackByPaymentId(mapped);
      } catch {
        setFeedbackByPaymentId({});
      }
    };

    loadExistingFeedback();
  }, [userId]);

  const statusLabel = (status) => {
    if (status === 'successful') return 'Success';
    if (status === 'failed') return 'Failed';
    return status || 'Unknown';
  };

  const downloadReceipt = async (paymentId) => {
    try {
      setReceiptStatusByPaymentId((prev) => ({
        ...prev,
        [paymentId]: { text: 'Sending receipt email...', type: 'info' }
      }));

      const sendResponse = await fetch(buildApiUrl(`/api/payments/receipt/${paymentId}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });

      let sendData = null;
      let receipt = null;
      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        try {
          sendData = JSON.parse(errorText);
        } catch {
          sendData = { error: errorText };
        }
      } else {
        sendData = await sendResponse.json();
      }

      receipt = sendData?.receipt || null;

      let pdfBlob = null;
      if (sendData?.receiptPdfBase64) {
        const binaryString = atob(sendData.receiptPdfBase64);
        const byteArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i += 1) {
          byteArray[i] = binaryString.charCodeAt(i);
        }
        pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
      } else {
        const pdfResponse = await fetch(buildApiUrl(`/api/payments/receipt/${paymentId}?format=pdf`));
        if (!pdfResponse.ok) {
          const errorText = await pdfResponse.text();
          throw new Error(errorText || 'Unable to generate receipt PDF.');
        }
        pdfBlob = await pdfResponse.blob();
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `receipt-${receipt?.receiptNumber || paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

      if (sendResponse.ok) {
        setReceiptStatusByPaymentId((prev) => ({
          ...prev,
          [paymentId]: { text: '📧 Check your email for the receipt', type: 'success' }
        }));
      } else {
        const reason = sendData?.reason === 'smtp-not-configured'
          ? 'Email service is not configured on the backend yet.'
          : 'Unable to send receipt. Try again.';
        setReceiptStatusByPaymentId((prev) => ({
          ...prev,
          [paymentId]: { text: reason, type: 'error' }
        }));
      }
    } catch (error) {
      setReceiptStatusByPaymentId((prev) => ({
        ...prev,
        [paymentId]: { text: 'Unable to download receipt right now. Please try again.', type: 'error' }
      }));
    }
  };

  const handleRatingSelect = async (item, rating) => {
    const bookingId = item?.bookingId;
    const paymentId = item?.paymentId || item?.id;
    if (!paymentId || !userId) return;
    if (feedbackByPaymentId[String(paymentId)]) return;

    setSubmittingFeedbackByPaymentId((prev) => ({
      ...prev,
      [String(paymentId)]: true,
    }));

    try {
      const response = await fetch(buildApiUrl('/api/feedback/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: user?.email,
          bookingId,
          paymentId,
          movieId: item?.movieId,
          rating,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      const finalRating = Number(payload?.feedback?.rating || rating);

      if (!response.ok && !payload?.alreadySubmitted) {
        throw new Error(payload?.error || 'Unable to save feedback right now.');
      }

      setFeedbackByPaymentId((prev) => ({
        ...prev,
        [String(paymentId)]: finalRating,
      }));

      setFeedbackMessageByPaymentId((prev) => ({
        ...prev,
        [String(paymentId)]: { text: 'Feedback Submitted', type: 'success' },
      }));
    } catch (error) {
      setFeedbackMessageByPaymentId((prev) => ({
        ...prev,
        [String(paymentId)]: { text: 'Unable to submit feedback right now. Please try again.', type: 'error' },
      }));
    } finally {
      setSubmittingFeedbackByPaymentId((prev) => ({
        ...prev,
        [String(paymentId)]: false,
      }));
      setHoverState({ paymentId: null, rating: 0 });
    }
  };

  const summary = useMemo(() => {
    const total = history.length;
    const successful = history.filter((item) => item.status === 'successful').length;
    const failed = history.filter((item) => item.status === 'failed').length;
    return { total, successful, failed };
  }, [history]);

  return (
    <div className="account-page-wrapper">
      <div className="account-page-container">
        <div className="account-section-card">
          <h2 className="account-page-title">Payment History</h2>
          <div className="account-stats-grid">
            <div className="account-stat-card">Total Records: <strong>{summary.total}</strong></div>
            <div className="account-stat-card">Success: <strong>{summary.successful}</strong></div>
            <div className="account-stat-card">Failed: <strong>{summary.failed}</strong></div>
          </div>
        </div>

        {statusCard.text && <div className={`account-status-card ${statusCard.type}`}>{statusCard.text}</div>}

        {loading && <div className="account-section-card">Loading payment history...</div>}

        {!loading && history.map((item) => {
          const dt = formatDateTime(item.bookingDate || item.createdAt);
          const paymentKey = String(item.paymentId || item.id || '');
          const selectedRating = feedbackByPaymentId[paymentKey] || 0;
          const hoverRating = hoverState.paymentId === paymentKey ? hoverState.rating : 0;
          const activeRating = hoverRating || selectedRating;
          const isLocked = selectedRating > 0;
          const isSubmitting = Boolean(submittingFeedbackByPaymentId[paymentKey]);
          const feedbackMessage = feedbackMessageByPaymentId[paymentKey];
          return (
            <div key={item.id} className="account-item-card">
              <div className="account-item-header">
                <h3>{item.movieName || 'Movie/Event'}</h3>
                <span className={`account-badge ${item.status}`}>{statusLabel(item.status)}</span>
              </div>
              <div className="account-item-grid">
                <p><strong>Seat Details:</strong> {(item.seats || []).join(', ') || 'N/A'}</p>
                <p><strong>Date of Booking:</strong> {dt.date}</p>
                <p><strong>Time of Booking:</strong> {dt.time}</p>
                <p><strong>Amount:</strong> INR {Number(item.amount || 0).toFixed(2)}</p>
              </div>
              {receiptStatusByPaymentId[item.id]?.text && (
                <div className={`account-status-card ${receiptStatusByPaymentId[item.id].type}`}>
                  {receiptStatusByPaymentId[item.id].text}
                </div>
              )}
              <button className="account-action-btn" onClick={() => downloadReceipt(item.id)}>
                Download Receipt
              </button>

              <div className="account-feedback-card">
                <div className="account-feedback-header">Rate Your Experience</div>
                <div className="account-feedback-stars" role="group" aria-label="Rate this booking">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= activeRating;
                    return (
                      <button
                        key={`${paymentKey}-${star}`}
                        type="button"
                        className={`account-star-btn ${filled ? 'filled' : ''}`}
                        onMouseEnter={() => !isLocked && setHoverState({ paymentId: paymentKey, rating: star })}
                        onMouseLeave={() => !isLocked && setHoverState({ paymentId: null, rating: 0 })}
                        onClick={() => !isLocked && !isSubmitting && handleRatingSelect(item, star)}
                        disabled={isLocked || isSubmitting || !item.id}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>

                {isLocked && (
                  <div className="account-feedback-note success">Feedback Submitted</div>
                )}

                {!item.id && (
                  <div className="account-feedback-note warning">Feedback unavailable for this payment.</div>
                )}

                {!isLocked && feedbackMessage?.text && (
                  <div className={`account-feedback-note ${feedbackMessage.type || 'info'}`}>
                    {feedbackMessage.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentHistory;
