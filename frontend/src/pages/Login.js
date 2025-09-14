import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/Login.css'; // Make sure this CSS file exists

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      setErr(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <h2>Login</h2>
      {err && <div className="error">{err}</div>}
      
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>

      <p className="bottom-text">
        Don't have an account? <Link to="/signup" className="link">Sign up</Link>
      </p>
    </form>
  );
}
