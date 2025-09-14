import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../style/OwnerDashboard.css';

export default function OwnerDashboard() {
  const { user, setUser } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [avg, setAvg] = useState(0);
  const [storeForm, setStoreForm] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.storeId) return;

    const fetchRatings = async () => {
      try {
        const { data } = await api.get(`/ratings/store/${user.storeId}`);
        setRatings(data.ratings);
        setAvg(data.avgRating);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRatings();
  }, [user]);

  // --- Add Store ---
  const handleAddStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/stores', storeForm);
      
      // Update user context with new storeId
      setUser({ ...user, storeId: data._id });

      alert('Store added successfully!');
      setStoreForm({ name: '', address: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add store');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="owner-dashboard">
      <h2>Owner Dashboard</h2>

      {!user.storeId ? (
        <div className="store-form-wrapper">
          <h3>Add Your Store</h3>
          <form onSubmit={handleAddStore} className="store-form">
            <input
              type="text"
              placeholder="Store Name"
              value={storeForm.name}
              onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={storeForm.address}
              onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Store'}
            </button>
          </form>
        </div>
      ) : (
        <div className="ratings-section">
          <div className="store-rating">Store average rating: {avg}</div>
          <h3>Ratings</h3>
          {ratings.length === 0 ? (
            <div className="no-ratings">No ratings yet.</div>
          ) : (
            <ul className="ratings-list">
              {ratings.map(r => (
                <li key={r._id}>
                  <span className="rater-name">{r.userId?.name || 'Anonymous'}</span> —{' '}
                  <span className="rater-value">{r.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
