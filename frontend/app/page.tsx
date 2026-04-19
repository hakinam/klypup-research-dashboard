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
      minHeight: '100vh', display: 'flex',
      background: 'url("/bg.png") center/cover no-repeat fixed',
    }}>
      {/* Left side */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '65px',
        borderRight: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)'
      }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px', marginTop: '-20px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', boxShadow: '0 0 20px rgba(139,92,246,0.4)'
            }}>💰</div>
            <span style={{
              fontSize: '28px', fontWeight: '800', color: '#f1f5f9',
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #ffffff, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Klypup Research</span>
          </div>
          <h1 style={{
            fontSize: '48px', fontWeight: '800', color: '#f1f5f9',
            lineHeight: '1.2', marginBottom: '16px'
          }}>
            AI-Powered<br />
            <span style={{ background: 'linear-gradient(135deg, #5c6e8d, #8f71e2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Investment Research
            </span>
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.6' }}>
            Research any company in seconds. Get real-time stock data, news sentiment, and AI-powered insights — all in one place.
          </p>
        </div>

        {/* Feature list */}
        {[
          { icon: '⚡', title: 'Real-time Stock Data', desc: 'Live prices from Yahoo Finance' },
          { icon: '📰', title: 'News Sentiment Analysis', desc: 'AI-classified news from 1000s of sources' },
          { icon: '🤖', title: 'AI Agent with Tool Calling', desc: 'Intelligent data orchestration' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: 'rgba(59,130,246,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '18px'
            }}>{f.icon}</div>
            <div>
              <p style={{ color: '#f1f5f9', fontWeight: '600', marginBottom: '2px' }}>{f.title}</p>
              <p style={{ color: '#64748b', fontSize: '14px' }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Right side - form */}
      <div style={{
        width: '580px', display: 'flex', alignItems: 'left',
        justifyContent: 'center', padding: '40px',
        background: 'rgba(7, 7, 7, 0.3)',
        backdropFilter: 'blur(2px)'
      }}>
        <div style={{ width: '100%' }}>
          <div style={{
            background: 'rgba(10, 10, 11, 0.8)', borderRadius: '20px',
            padding: '45px', border: '2px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '14px' }}>
              {isLogin ? 'Sign in to your workspace' : 'Start your research journey'}
            </p>

            {/* Toggle */}
            <div style={{
              display: 'flex', background: 'rgba(27, 41, 72, 0.8)',
              borderRadius: '10px', padding: '4px', marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {['Login', 'Sign Up'].map((tab) => (
                <button key={tab} onClick={() => setIsLogin(tab === 'Login')} style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                  transition: 'all 0.2s',
                  background: (tab === 'Login') === isLogin
                    ? 'linear-gradient(135deg, #3b82f6, #2e283b)'
                    : 'transparent',
                  color: (tab === 'Login') === isLogin ? 'white' : '#64748b',
                }}>{tab}</button>
              ))}
            </div>

            {!isLogin && (
              <>
                <input placeholder="Full Name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle} />
                <input placeholder="Organization Name" value={form.org_name}
                  onChange={e => setForm({ ...form, org_name: e.target.value })}
                  style={inputStyle} />
                <input placeholder="Invite Code (optional - join existing org)" value={form.invite_code}
                  onChange={e => setForm({ ...form, invite_code: e.target.value })}
                  style={inputStyle} />
                <select value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={inputStyle}>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}

            <input placeholder="Email address" value={form.email} type="email"
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle} />
            <input placeholder="Password" value={form.password} type="password"
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle} />

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '12px', marginBottom: '16px'
              }}>
                <p style={{ color: '#f87171', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '14px',
              background: loading ? '#334155' : 'linear-gradient(135deg, #3b82f6, #9791a4)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In →' : 'Create Account →'}
            </button>

            {isLogin && (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', marginTop: '16px' }}>
                Don't have an account?{' '}
                <span onClick={() => setIsLogin(false)}
                  style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}>
                  Sign up free
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(15,23,42,0.8)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', color: '#f1f5f9',
  fontSize: '14px', marginBottom: '12px', outline: 'none',
};