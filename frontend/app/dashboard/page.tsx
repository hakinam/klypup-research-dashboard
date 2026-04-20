'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getReports, getWatchlist, deleteReport, removeFromWatchlist, runQuery, getStockChart } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('query');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');
  const [chartDataMap, setChartDataMap] = useState<Record<string, { date: string; close: number }[]>>({});
  const [chartLoadingMap, setChartLoadingMap] = useState<Record<string, boolean>>({});
  const [chartErrorMap, setChartErrorMap] = useState<Record<string, string>>({});



  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/'); return; }
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    setIsUserAdmin(storedUser.role === 'admin');
    setOrg(JSON.parse(localStorage.getItem('org') || '{}'));
    fetchReports();
    fetchWatchlist();
  }, []);

  useEffect(() => {
  if (!result?.companies?.length) return;

  result.companies.forEach((company: any) => {
    if (company.symbol) {
      fetchStockChart(company.symbol, selectedPeriod);
    }
  });
}, [result, selectedPeriod]);



  const fetchReports = async () => {
    try { const res = await getReports(); setReports(res.data); } catch {}
  };
  const fetchWatchlist = async () => {
    try { const res = await getWatchlist(); setWatchlist(res.data); } catch {}
  };
 const fetchStockChart = async (ticker: string, period: string) => {
  try {
    setChartLoadingMap(prev => ({ ...prev, [ticker]: true }));
    setChartErrorMap(prev => ({ ...prev, [ticker]: '' }));

    const res = await getStockChart(ticker, period);

    setChartDataMap(prev => ({
      ...prev,
      [ticker]: res.data.data || [],
    }));
  } catch {
    setChartErrorMap(prev => ({
      ...prev,
      [ticker]: 'Failed to load stock chart',
    }));
    setChartDataMap(prev => ({
      ...prev,
      [ticker]: [],
    }));
  } finally {
    setChartLoadingMap(prev => ({ ...prev, [ticker]: false }));
  }
};


  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await runQuery(query, '');
      setResult(res.data.result);
      fetchReports();
    } catch { alert('Query failed. Please try again.'); }
    finally { setLoading(false); }
  };
  const handleLogout = () => { localStorage.clear(); router.push('/'); };
  const sentimentColor = (s: string) =>
    s === 'positive' ? '#10b981' : s === 'negative' ? '#ef4444' : '#f59e0b';
  const sentimentBg = (s: string) =>
    s === 'positive' ? 'rgba(16,185,129,0.1)' : s === 'negative' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';

  const tabs = [
    { id: 'query', label: 'New Research', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    )},
    { id: 'reports', label: 'Saved Reports', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    )},
    { id: 'watchlist', label: 'Watchlist', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    )},
    ...(isUserAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
    )}] : []),
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c14',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 80% 50% at 20% -20%, rgba(59,130,246,0.15) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(37,99,235,0.1) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 60% 50%, rgba(16,185,129,0.05) 0%, transparent 50%)
        `
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,12,20,0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59,130,246,0.5)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontSize: '16px', fontWeight: '700', letterSpacing: '-0.3px',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Klypup Research</span>
          <div style={{
            fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px',
            color: '#3b82f6', background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            padding: '2px 8px', borderRadius: '20px'
          }}>AI POWERED</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {org && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>{org.name}</span>
              {isUserAdmin && (
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                  🔑 {org.invite_code}
                </span>
              )}
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', color: 'white'
            }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', lineHeight: 1 }}>{user?.name}</p>
              <p style={{ fontSize: '10px', color: '#475569', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '6px 14px', fontSize: '12px', fontWeight: '600',
            background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '7px', color: '#ef4444', cursor: 'pointer'
          }}>Sign out</button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: '220px', flexShrink: 0,
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '20px 12px',
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          <p style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '1px',
            color: '#64748b', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px'
          }}>Menu</p>

          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width: '100%', padding: '9px 12px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px',
              fontSize: '13px', fontWeight: activeTab === tab.id ? '600' : '400',
              background: activeTab === tab.id ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#60a5fa' : '#64748b',
              borderLeft: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.15s', textAlign: 'left'
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}

          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Workspace</p>
            {[
              { label: 'Reports', value: reports.length, color: '#3b82f6' },
              { label: 'Watchlist', value: watchlist.length, color: '#10b981' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {activeTab === 'query' && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', padding: '0 2px', marginBottom: '8px' }}>Quick Queries</p>
              {['Analyze NVIDIA stock', 'Apple Q4 2024 earnings', 'Tesla risk assessment'].map((q, i) => (
                <button key={i} onClick={() => setQuery(q)} style={{
                  width: '100%', padding: '7px 10px', borderRadius: '6px', marginBottom: '4px',
                  border: '1px solid rgba(255,255,255,0.04)', background: 'transparent',
                  color: '#64748b', fontSize: '11px', cursor: 'pointer', textAlign: 'left',
                }}>→ {q}</button>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* QUERY TAB */}
          {activeTab === 'query' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                  Research Query
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px' }}>Powered by Groq · Llama 3.3 70B · Real-time data</p>
              </div>

              {/* Search bar */}
              <div style={{
                display: 'flex', gap: '10px', marginBottom: '28px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '6px 6px 6px 16px',
              }}>
                <input value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuery()}
                  placeholder="Ask about any company, stock, or market trend..."
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: '#e2e8f0', fontSize: '14px', outline: 'none', padding: '8px 0'
                  }} />
                <button onClick={handleQuery} disabled={loading} style={{
                  padding: '10px 22px', borderRadius: '8px', border: 'none',
                  background: loading ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: 'white', fontWeight: '600', fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 0 20px rgba(59,130,246,0.4)'
                }}>
                  {loading ? 'Analyzing...' : 'Analyze →'}
                </button>
              </div>

              {/* Loading */}
              {loading && (
                <div style={{
                  borderRadius: '14px', padding: '48px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚙️</div>
                  <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Agent is working</p>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>
                    Fetching stock data → Scanning news → Searching documents → Synthesizing
                  </p>
                </div>
              )}

              {/* Hero */}
              {!result && !loading && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'AI Model', value: 'Llama 3.3', sub: 'Groq Inference', color: '#3b82f6' },
                      { label: 'Data Tools', value: '3 Active', sub: 'Stock · News · Docs', color: '#2563eb' },
                      { label: 'Reports', value: reports.length, sub: 'This workspace', color: '#10b981' },
                      { label: 'Watchlist', value: watchlist.length, sub: 'Companies', color: '#f59e0b' },
                    ].map((s, i) => (
                      <div key={i} style={{
                        padding: '18px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${s.color}22`,
                        borderTop: `2px solid ${s.color}`
                      }}>
                        <p style={{ color: s.color, fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>{s.value}</p>
                        <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{s.label}</p>
                        <p style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderRadius: '14px', padding: '24px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', marginBottom: '18px' }}>How the AI Agent Works</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                      {[
                        { n: '01', title: 'Natural language query', desc: 'Type anything — company name, comparison, earnings report, risk assessment.', color: '#3b82f6' },
                        { n: '02', title: 'Intelligent tool calling', desc: 'Agent selects which tools to use — stock API, news API, or vector document search.', color: '#2563eb' },
                        { n: '03', title: 'Structured output', desc: 'Results rendered as cards, metrics, sentiment badges, and source-attributed insights.', color: '#10b981' },
                      ].map((s, i) => (
                        <div key={i} style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}18` }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: `${s.color}15`, padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px', letterSpacing: '1px' }}>STEP {s.n}</div>
                          <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>{s.title}</p>
                          <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>


                  <div style={{ borderRadius: '14px', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', marginBottom: '14px' }}>Example Queries</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
                      {[
                        { q: 'Analyze Apple stock and recent news', tag: 'Stock' },
                        { q: 'What did NVIDIA say in Q3 2024 earnings?', tag: 'Earnings' },
                        { q: 'Compare Microsoft and Google performance', tag: 'Compare' },
                        { q: 'Give me a risk assessment of Tesla', tag: 'Risk' },
                        { q: 'Latest news on Amazon', tag: 'News' },
                        { q: 'Analyze Microsoft Q1 2025 earnings', tag: 'Earnings' },
                      ].map((item, i) => (
                        <button key={i} onClick={() => setQuery(item.q)} style={{
                          padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.q}</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 7px', borderRadius: '20px', flexShrink: 0, marginLeft: '8px' }}>{item.tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div>
                  <div style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '8px' }}>AI Summary</p>
                    <p style={{ color: '#e2e8f0', lineHeight: '1.7', fontSize: '14px' }}>{result.summary}</p>
                  </div>

                  {result.companies?.map((company: any, i: number) => (
                    <div key={i} style={{ padding: '22px', borderRadius: '12px', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', fontSize: '15px' }}>{company.symbol?.[0]}</div>
                          <div>
                            <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>{company.name}</h3>
                            <p style={{ color: '#64748b', fontSize: '12px' }}>{company.symbol} · Stock Analysis</p>
                          </div>
                        </div>
                        <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: sentimentBg(company.sentiment), color: sentimentColor(company.sentiment), border: `1px solid ${sentimentColor(company.sentiment)}33` }}>
                          {company.sentiment === 'positive' ? '▲' : company.sentiment === 'negative' ? '▼' : '●'} {company.sentiment}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
                        {[
                          { label: 'Price', value: `$${company.current_price}` },
                          { label: 'Market Cap', value: company.market_cap },
                          { label: 'P/E Ratio', value: company.pe_ratio },
                          { label: '30d Change', value: company.price_change_30d },
                        ].map((m, j) => (
                          <div key={j} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{m.label}</p>
                            <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '700' }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        padding: '16px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '14px',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <div>
                            <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                              {company.symbol} price history
                            </p>
                          </div>

                          <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: '#0f172a',
                              color: '#e2e8f0',
                              outline: 'none',
                              fontSize: '12px'
                            }}
                          >
                            <option value="5d">5D</option>
                            <option value="1mo">1M</option>
                            <option value="3mo">3M</option>
                            <option value="6mo">6M</option>
                            <option value="1y">1Y</option>
                          </select>
                        </div>

                        {chartLoadingMap[company.symbol] ? (
                          <div style={{
                            height: '260px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            fontSize: '13px'
                          }}>
                            Loading chart...
                          </div>
                        ) : chartErrorMap[company.symbol] ? (
                          <div style={{
                            height: '260px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            fontSize: '13px'
                          }}>
                            {chartErrorMap[company.symbol]}
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartDataMap[company.symbol] || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px',
                                    color: '#e2e8f0'
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="close"
                                  stroke="#10b981"
                                  strokeWidth={2.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>


                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                          <p style={{ color: '#10b981', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Key Insights</p>
                          {company.key_insights?.map((s: string, k: number) => (
                            <p key={k} style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px', lineHeight: '1.5' }}>· {s}</p>
                          ))}
                        </div>
                        <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                          <p style={{ color: '#ef4444', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Risk Factors</p>
                          {company.risks?.map((s: string, k: number) => (
                            <p key={k} style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px', lineHeight: '1.5' }}>· {s}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {result.news_highlights?.length > 0 && (
                    <div style={{ padding: '20px', borderRadius: '12px', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', marginBottom: '14px' }}>News Highlights</p>
                      {result.news_highlights.map((news: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < result.news_highlights.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <p style={{ color: '#94a3b8', fontSize: '13px', flex: 1, marginRight: '16px', lineHeight: '1.5' }}>{news.title}</p>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                            <span style={{ color: '#64748b', fontSize: '11px' }}>{news.source}</span>
                            <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: sentimentBg(news.sentiment), color: sentimentColor(news.sentiment) }}>{news.sentiment}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.recommendation && (
                    <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '8px' }}>AI Recommendation</p>
                      <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7', marginBottom: '10px' }}>{result.recommendation}</p>
                      <p style={{ color: '#64748b', fontSize: '11px' }}>Sources: {result.sources?.join(' · ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '4px' }}>Saved Reports</h1>
                <p style={{ color: '#64748b', fontSize: '13px' }}>
                  {isUserAdmin ? `All reports for ${org?.name}` : 'Your research reports'}
                </p>
              </div>
              {reports.length === 0 ? (
                <div style={{ padding: '60px', borderRadius: '14px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>📋</p>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>No reports yet — run a query first!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                  {reports.map((r: any) => (
                    <div key={r.id} style={{ padding: '18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', fontSize: '16px' }}>📄</div>
                        <p style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '14px', marginBottom: '6px', lineHeight: '1.4' }}>{r.title}</p>
                        <p style={{ color: '#64748b', fontSize: '11px' }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      {isUserAdmin && (
                        <button onClick={() => deleteReport(r.id).then(fetchReports)} style={{ marginTop: '14px', padding: '7px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WATCHLIST TAB */}
          {activeTab === 'watchlist' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '4px' }}>Watchlist</h1>
                <p style={{ color: '#64748b', fontSize: '13px' }}>Companies you are tracking</p>
              </div>
              {watchlist.length === 0 ? (
                <div style={{ padding: '60px', borderRadius: '14px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</p>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>No companies yet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                  {watchlist.map((item: any) => (
                    <div key={item.id} style={{ padding: '18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', marginBottom: '10px' }}>{item.symbol?.[0]}</div>
                      <p style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '14px' }}>{item.company_name}</p>
                      <p style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '600', marginBottom: '14px' }}>{item.symbol}</p>
                      <button onClick={() => removeFromWatchlist(item.id).then(fetchWatchlist)} style={{ width: '100%', padding: '7px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADMIN TAB */}
          {activeTab === 'admin' && isUserAdmin && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '4px' }}>Admin Panel</h1>
                <p style={{ color: '#64748b', fontSize: '13px' }}>Manage your organization workspace</p>
              </div>

              <div style={{ padding: '24px', borderRadius: '12px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>Organization Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                  {[
                    { label: 'Org Name', value: org?.name },
                    { label: 'Invite Code', value: org?.invite_code },
                    { label: 'Total Reports', value: reports.length },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{item.label}</p>
                      <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '700', fontFamily: item.label === 'Invite Code' ? 'monospace' : 'inherit' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '24px', borderRadius: '12px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>Role Permissions</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { feature: 'Run Research Queries', admin: true, analyst: true },
                    { feature: 'View Saved Reports', admin: true, analyst: true },
                    { feature: 'Delete Reports', admin: true, analyst: false },
                    { feature: 'Manage Watchlist', admin: true, analyst: true },
                    { feature: 'View Invite Code', admin: true, analyst: false },
                    { feature: 'Access Admin Panel', admin: true, analyst: false },
                  ].map((row, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{row.feature}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: row.admin ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: row.admin ? '#10b981' : '#ef4444' }}>Admin</span>
                        <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: row.analyst ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: row.analyst ? '#10b981' : '#ef4444' }}>Analyst</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>🔑 How to invite teammates</p>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
                  Share your invite code <strong style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{org?.invite_code}</strong> with your team. They enter it during signup to join <strong style={{ color: '#f1f5f9' }}>{org?.name}</strong> and will see all shared reports.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}