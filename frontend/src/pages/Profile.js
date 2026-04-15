import React, { useEffect, useState } from 'react';
import '../styles/AccountPages.css';
import { fetchJson } from '../utils/api';

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusCard, setStatusCard] = useState({ text: '', type: '' });

  const userId = user?._id || user?.id;
  const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setLoading(false);
        setStatusCard({ text: 'Login required to view profile.', type: 'warning' });
        return;
      }

      try {
        setLoading(true);
        const data = await fetchJson(`/api/profile/${userId}${emailQuery}`);
        setProfile(data);
      } catch (error) {
        setStatusCard({ text: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, emailQuery]);

  return (
    <div className="account-page-wrapper">
      <div className="account-page-container">
        <div className="account-section-card">
          <h2 className="account-page-title">My <span style={{color: '#ff4d4d'}}>Profile</span></h2>
        </div>

        {statusCard.text && <div className={`account-status-card ${statusCard.type}`}>{statusCard.text}</div>}
        {loading && <div className="account-section-card">Loading profile, Please Wait!...</div>}

        {!loading && profile?.user && (
          <div className="account-item-card">
            <div className="account-item-header">
              <h3>User Details</h3>
              <span className="account-badge system-update">Active</span>
            </div>
            <div className="account-item-grid">
              <p><strong>Name:</strong> {profile.user.name || 'N/A'}</p>
              <p><strong>Email:</strong> {profile.user.email || 'N/A'}</p>
              <p><strong>Age:</strong> {profile.user.age || 'N/A'}</p>
              <p><strong>Provider:</strong> {profile.user.provider || 'N/A'}</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="account-section-card">
            <h3 className="account-subtitle">Notification History</h3>
            {(profile?.notifications || []).length === 0 && <p className="account-muted">No recent notifications.</p>}
            {(profile?.notifications || []).map((item) => (
              <div key={item._id} className="account-item-card compact">
                <div className="account-item-header">
                  <h4>{item.title}</h4>
                  <span className={`account-badge ${item.type}`}>{item.type === 'payment-success' ? 'Success' : item.type === 'payment-failed' ? 'Failed' : 'Update'}</span>
                </div>
                <p className="account-item-message">{item.message}</p>
                <p className="account-item-meta">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="account-section-card">
            <h3 className="account-subtitle">Recent Activity</h3>
            {(profile?.recentPayments || []).length === 0 && <p className="account-muted">No recent payment activity.</p>}
            {(profile?.recentPayments || []).map((item) => (
              <div key={item._id} className="account-item-card compact">
                <div className="account-item-header">
                  <h4>{item.booking?.movieName || 'Booking'}</h4>
                  <span className={`account-badge ${item.status}`}>{item.status === 'successful' ? 'Success' : item.status === 'failed' ? 'Failed' : item.status}</span>
                </div>
                <div className="account-item-grid">
                  <p><strong>Seats:</strong> {(item.booking?.seats || []).join(', ') || 'N/A'}</p>
                  <p><strong>Amount:</strong> INR {Number(item.amount || 0).toFixed(2)}</p>
                  <p><strong>Date:</strong> {new Date(item.createdAt).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
