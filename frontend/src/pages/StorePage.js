import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import '../style/StorePage.css';

export default function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await api.get(`/stores/${id}`);
        setStore(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch store data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [id]);

  if (loading) return <div className="loading">Loading store details...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="store-page">
      <h2>{store.name}</h2>
      <p><strong>Address:</strong> {store.address}</p>
      <p><strong>Average Rating:</strong> {store.avgRating ?? 0}</p>
    </div>
  );
}
