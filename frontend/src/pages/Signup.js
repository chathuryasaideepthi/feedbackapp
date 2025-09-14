import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../style/Signup.css';

export default function Signup() {
  const [payload, setPayload] = useState({ name:'', email:'', address:'', password:'' });
  const [err, setErr] = useState(null);
  const { signup } = useAuth();
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setErr(null);
    try {
      await signup(payload);
      nav('/');
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) setErr(response.errors.map(x=>x.msg).join(', '));
      else setErr(response?.msg || 'Failed');
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <h2>Sign up</h2>
      {err && <div className="error">{err}</div>}
      <input placeholder="Name" value={payload.name} onChange={e=>setPayload({...payload,name:e.target.value})} required />
      <input placeholder="Email" value={payload.email} onChange={e=>setPayload({...payload,email:e.target.value})} required />
      <input placeholder="Address" value={payload.address} onChange={e=>setPayload({...payload,address:e.target.value})} />
      <input placeholder="Password" type="password" value={payload.password} onChange={e=>setPayload({...payload,password:e.target.value})} required />
      <button type="submit">Signup</button>
      
      <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
        Already have an account? <Link to="/login" style={{ color: '#4A90E2', textDecoration: 'none' }}>Login</Link>
      </p>
    </form>
  );
}
