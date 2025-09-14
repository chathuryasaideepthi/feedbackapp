import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../style/StoreCard.css';

export default function StoreCard({ store, refresh }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(store.userRating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const submitRating = async (value) => {
    try {
      await api.post('/ratings', { storeId: store._id, value });
      setRating(value);
      if (refresh) refresh();
      alert('Rating saved');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error');
    }
  };

  return (
    <div className="store-card">
      <h3>{store.name}</h3>
      <div className="muted">{store.address}</div>
      <div>Avg Rating: {store.avgRating ?? 0}</div>
      <div>Your Rating:</div>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`star ${n <= (hoverRating || rating) ? 'filled' : ''}`}
            onClick={() => user && user.role === 'user' && submitRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
          >
            ★
          </span>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <Link to={`/stores/${store._id}`}>View</Link>
      </div>
    </div>
  );
}
