import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StoreCard from '../components/StoreCard';
import '../style/StoresList.css';

export default function StoresList() {
  const [stores, setStores] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async (search = '') => {
    try {
      const { data } = await api.get('/stores', { 
        params: { q: search, sortBy: 'name', order: 'asc' } 
      });
      setStores(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="stores-list">
      <h2>Stores</h2>
      
      <div className="search-bar">
        <input 
          placeholder="Search by name or address" 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
        <button onClick={() => fetchStores(q)}>Search</button>
      </div>

      <div className="stores-grid">
        {stores.map(s => (
          <StoreCard key={s._id} store={s} refresh={() => fetchStores(q)} />
        ))}
      </div>
    </div>
  );
}
