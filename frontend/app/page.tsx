'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', name: '', org_name: '', invite_code: '', role: 'analyst'
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = isLogin
        ? await login({ email: form.email, password: form.password })
        : await signup(form);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('org', JSON.stringify(res.data.org));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f172a'
    }}>
      <div style={{
        background: '#1e293b', borderRadius: '16px', padding: '40px',
        width: '100%', maxWidth: '420px', border: '1px solid #334155'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#f1f5f9' }}>
          Klypup Research
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '14px' }}>
          AI-powered investment research platform
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
          {['Login', 'Sign Up'].map((tab) => (
            <button key={tab} onClick={() => setIsLogin(tab === 'Login')} style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: (tab === 'Login') === isLogin ? '#3b82f6' : 'transparent',
              color: (tab === 'Login') === isLogin ? 'white' : '#94a3b8',
              fontWeight: '500', fontSize: '14px'
            }}>{tab}</button>
          ))}
        </div>

        {/* Form fields */}
        {!isLogin && (
          <>
            <input placeholder="Full Name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle} />
            <input placeholder="Organization Name (or leave blank to join existing)" value={form.org_name}
              onChange={e => setForm({ ...form, org_name: e.target.value })}
              style={inputStyle} />
            <input placeholder="Invite Code (optional - to join existing org)" value={form.invite_code}
              onChange={e => setForm({ ...form, invite_code: e.target.value })}
              style={inputStyle} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              style={inputStyle}>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </>
        )}

        <input placeholder="Email" value={form.email} type="email"
          onChange={e => setForm({ ...form, email: e.target.value })}
          style={inputStyle} />
        <input placeholder="Password" value={form.password} type="password"
          onChange={e => setForm({ ...form, password: e.target.value })}
          style={inputStyle} />

        {error && (
          <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '12px', background: '#3b82f6', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', marginBottom: '12px',
  outline: 'none'
};