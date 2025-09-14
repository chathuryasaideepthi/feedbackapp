import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import StoresList from './pages/StoresList';
import StorePage from './pages/StorePage';
import OwnerDashboard from './pages/OwnerDashboard';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';


export default function App() {
  const { user, logout } = useAuth();
  return (
    <div>
      <nav className="topnav">
        <Link to="/">Stores</Link>
        {!user && <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </>}
        {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user && user.role === 'owner' && <Link to="/owner">Owner</Link>}
        {user && <button className="logout-btn" onClick={logout}>Logout</button>}

      </nav>

      <Routes>
        <Route path="/" element={<StoresList/>} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login/>} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup/>} />
        <Route path="/stores/:id" element={<StorePage/>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard/></ProtectedRoute>} />
        <Route path="/owner" element={<ProtectedRoute roles={['owner']}><OwnerDashboard/></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
