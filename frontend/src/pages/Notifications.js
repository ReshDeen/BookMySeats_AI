import React, { useEffect, useState } from 'react';
import '../styles/AccountPages.css';
import { fetchJson } from '../utils/api';

const Notifications = ({ user, onNotificationsRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusCard, setStatusCard] = useState({ text: '', type: '' });

  const userId = user?._id || user?.id;
  const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  useEffect(() => {
    const loadNotifications = async () => {
      if (!userId) {
        setLoading(false);
        setStatusCard({ text: 'Login required to view notifications.', type: 'warning' });
        return;
      }

      try {
        setLoading(true);
        const data = await fetchJson(`/api/notifications/user/${userId}${emailQuery}`);
        setNotifications(data.notifications || []);

        await fetchJson(`/api/notifications/user/${userId}/read-all${emailQuery}`, { method: 'PUT' });
        onNotificationsRead?.();
      } catch (error) {
        setStatusCard({ text: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [userId, emailQuery, onNotificationsRead]);

  const renderTypeLabel = (type) => {
    if (type === 'payment-success') return 'Payment Successful';
    if (type === 'payment-failed') return 'Payment Failed';
    return 'System Update';
  };

  return (
    <div className="account-page-wrapper">
      <div className="account-page-container">
        <div className="account-section-card">
          <h2 className="account-page-title">Notifications</h2>
          <p className="account-muted">Payment events and important updates appear here.</p>
        </div>

        {statusCard.text && <div className={`account-status-card ${statusCard.type}`}>{statusCard.text}</div>}
        {loading && <div className="account-section-card">Loading notifications...</div>}

        {!loading && notifications.length === 0 && (
          <div className="account-section-card">No notifications yet.</div>
        )}

        {!loading && notifications.map((item) => (
          <div key={item._id} className="account-item-card">
            <div className="account-item-header">
              <h3>{item.title}</h3>
              <span className={`account-badge ${item.type}`}>{renderTypeLabel(item.type)}</span>
            </div>
            <p className="account-item-message">{item.message}</p>
            <p className="account-item-meta">{new Date(item.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
