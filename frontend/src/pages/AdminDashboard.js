import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import '../style/AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);

  // Forms
  const [storeForm, setStoreForm] = useState({ name: '', address: '' });
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '', address: '' });

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchStores();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStores = async () => {
    try {
      const { data } = await api.get('/stores');
      setStores(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Add Store ---
  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/stores', storeForm);
      setStores([...stores, data]);
      setStoreForm({ name: '', address: '' });
      alert('Store added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to add store');
    }
  };

  // --- Add Owner ---
  const handleAddOwner = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/users', { ...ownerForm, role: 'owner' });
      setUsers([...users, data]);
      setOwnerForm({ name: '', email: '', password: '', address: '' });
      alert('Owner added successfully!');
    } catch (err) {
      console.error(err.response?.data || err);
      alert('Failed to add owner');
    }
  };

  // --- Delete User ---
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      alert('User deleted');
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  // --- Delete Store ---
  const handleDeleteStore = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      await api.delete(`/stores/${id}`);
      setStores(stores.filter(s => s._id !== id));
      alert('Store deleted');
    } catch (err) {
      console.error(err);
      alert('Failed to delete store');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>
      <div>Total users: {stats.totalUsers}</div>
      <div>Total stores: {stats.totalStores}</div>
      <div>Total ratings: {stats.totalRatings}</div>

      {/* Add Store Form */}
      <h3>Add Store</h3>
      <form onSubmit={handleAddStore}>
        <input
          type="text"
          placeholder="Name"
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
        <button type="submit">Add Store</button>
      </form>

      {/* Add Owner Form */}
      <h3>Add Owner</h3>
      <form onSubmit={handleAddOwner}>
        <input
          type="text"
          placeholder="Name"
          value={ownerForm.name}
          onChange={e => setOwnerForm({ ...ownerForm, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={ownerForm.email}
          onChange={e => setOwnerForm({ ...ownerForm, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={ownerForm.password}
          onChange={e => setOwnerForm({ ...ownerForm, password: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={ownerForm.address}
          onChange={e => setOwnerForm({ ...ownerForm, address: e.target.value })}
          required
        />
        <button type="submit">Add Owner</button>
      </form>

      {/* Users Table */}
      <h3>Users</h3>
      <table className="simple-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Address</th><th>Role</th><th>Store</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.address}</td>
              <td>{u.role}</td>
              <td>{u.storeId ? stores.find(s => s._id === u.storeId)?.name : '-'}</td>
              <td>
                <button type="button" onClick={() => handleDeleteUser(u._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stores Table */}
      <h3>Stores</h3>
      <table className="simple-table">
        <thead>
          <tr><th>Name</th><th>Address</th><th>Avg Rating</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {stores.map(s => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.address}</td>
              <td>{s.avgRating ?? 0}</td>
              <td>
                <button type="button" onClick={() => handleDeleteStore(s._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
