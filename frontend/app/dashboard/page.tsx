'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getReports, getWatchlist, addToWatchlist, deleteReport, removeFromWatchlist, runQuery, getStockChart } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const theme = {
  bg: '#07111f',
  bgSoft: '#0b1728',
  panel: 'rgba(12, 22, 38, 0.82)',
  panelStrong: 'rgba(15, 26, 44, 0.94)',
  panelAlt: 'rgba(17, 29, 48, 0.86)',
  border: 'rgba(154, 174, 208, 0.12)',
  borderStrong: 'rgba(109, 140, 196, 0.24)',
  text: '#f5f7fb',
  textSoft: '#c7d2e4',
  textMuted: '#8c9ab3',
  textFaint: '#617089',
  blue: '#5b8cff',
  blueSoft: 'rgba(91, 140, 255, 0.14)',
  blueGlow: 'rgba(91, 140, 255, 0.28)',
  emerald: '#35c98b',
  emeraldSoft: 'rgba(53, 201, 139, 0.14)',
  amber: '#f3b44f',
  amberSoft: 'rgba(243, 180, 79, 0.14)',
  red: '#f36b6b',
  redSoft: 'rgba(243, 107, 107, 0.14)',
  shadow: '0 24px 60px rgba(1, 7, 18, 0.36)',
};

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

  const handleAddToWatchlist = async (symbol: string, companyName: string) => {
    try {
      await addToWatchlist(symbol, companyName);
      fetchWatchlist();
      alert(`${symbol} added to watchlist`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add to watchlist');
    }
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
    setLoading(true);
    setResult(null);
    try {
      const res = await runQuery(query, '');
      setResult(res.data.result);
      fetchReports();
    } catch {
      alert('Query failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const sentimentColor = (s: string) =>
    s === 'positive' ? theme.emerald : s === 'negative' ? theme.red : theme.amber;

  const sentimentBg = (s: string) =>
    s === 'positive' ? theme.emeraldSoft : s === 'negative' ? theme.redSoft : theme.amberSoft;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const recentReports = reports.slice(0, 4);
  const watchlistPreview = watchlist.slice(0, 4);
  const recentReportDate = reports.length ? formatDate(reports[0].created_at) : 'No reports yet';
  const uniqueCompaniesTracked = new Set(watchlist.map((item: any) => item.symbol)).size;

  const tabs = [
    {
      id: 'query',
      label: 'New Research',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Saved Reports',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
    ...(isUserAdmin ? [{
      id: 'admin',
      label: 'Admin Panel',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      )
    }] : []),
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      color: theme.text,
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(circle at 12% 8%, rgba(91,140,255,0.20) 0%, transparent 26%),
          radial-gradient(circle at 82% 22%, rgba(60,110,200,0.12) 0%, transparent 24%),
          radial-gradient(circle at 72% 92%, rgba(53,201,139,0.08) 0%, transparent 24%),
          linear-gradient(180deg, #08111d 0%, #091320 38%, #07101b 100%)
        `
      }} />
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.05,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(7, 14, 24, 0.72)',
        backdropFilter: 'blur(26px)',
        borderBottom: `1px solid ${theme.border}`,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6ea2ff 0%, #396fff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${theme.blueGlow}`
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '-0.3px',
            color: theme.text
          }}>Klypup Research</span>
          <div style={{
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.7px',
            color: '#8bb0ff',
            background: 'rgba(91,140,255,0.14)',
            border: '1px solid rgba(91,140,255,0.22)',
            padding: '3px 9px',
            borderRadius: '999px'
          }}>AI POWERED</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {org && (
            <div style={topPill}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.emerald, boxShadow: '0 0 8px rgba(53,201,139,0.6)' }} />
              <span style={{ fontSize: '13px', color: theme.textSoft, fontWeight: '600' }}>{org.name}</span>
              {isUserAdmin && (
                <span style={{
                  fontSize: '11px',
                  color: theme.textMuted,
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  {org.invite_code}
                </span>
              )}
            </div>
          )}
          <div style={topPill}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #5f8eff, #2f62e6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '700',
              color: 'white'
            }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: theme.text, lineHeight: 1 }}>{user?.name}</p>
              <p style={{ fontSize: '10px', color: theme.textFaint, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: '700',
            background: 'rgba(243,107,107,0.06)',
            border: '1px solid rgba(243,107,107,0.22)',
            borderRadius: '9px',
            color: '#ff8c8c',
            cursor: 'pointer'
          }}>Sign out</button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '240px',
          flexShrink: 0,
          background: 'rgba(8, 15, 27, 0.65)',
          backdropFilter: 'blur(14px)',
          borderRight: `1px solid ${theme.border}`,
          padding: '22px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <p style={sidebarLabel}>Menu</p>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '700' : '500',
                background: activeTab === tab.id ? 'linear-gradient(180deg, rgba(91,140,255,0.20), rgba(91,140,255,0.10))' : 'transparent',
                color: activeTab === tab.id ? '#dbe6ff' : theme.textMuted,
                border: activeTab === tab.id ? '1px solid rgba(91,140,255,0.24)' : '1px solid transparent',
                boxShadow: activeTab === tab.id ? `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(91,140,255,0.04), 0 14px 30px rgba(16, 31, 58, 0.28)` : 'none',
                textAlign: 'left'
              }}
            >
              <span style={{ opacity: activeTab === tab.id ? 1 : 0.8 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          <div style={{
            marginTop: '22px',
            padding: '16px',
            borderRadius: '14px',
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadow
          }}>
            <p style={sidebarLabel}>Workspace</p>
            {[
              { label: 'Reports', value: reports.length, color: theme.blue },
              { label: 'Watchlist', value: watchlist.length, color: theme.emerald },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i === 0 ? '8px' : '0' }}>
                <span style={{ fontSize: '12px', color: theme.textMuted }}>{s.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {activeTab === 'query' && (
            <div style={{ marginTop: '14px' }}>
              <p style={sidebarLabel}>Quick Queries</p>
              {['Analyze NVIDIA stock', 'Apple Q4 2024 earnings', 'Tesla risk assessment'].map((q, i) => (
                <button key={i} onClick={() => setQuery(q)} style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  marginBottom: '6px',
                  border: `1px solid ${theme.border}`,
                  background: 'rgba(255,255,255,0.015)',
                  color: theme.textMuted,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}>→ {q}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: '32px 34px', overflowY: 'auto' }}>
          {activeTab === 'query' && (
            <div>
              <div style={{ marginBottom: '26px' }}>
                <h1 style={{ fontSize: '34px', fontWeight: '800', color: theme.text, letterSpacing: '-0.8px', marginBottom: '6px' }}>
                  Research Query
                </h1>
                <p style={{ color: theme.textMuted, fontSize: '14px' }}>Powered by Groq · Llama 3.3 70B · Real-time data</p>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px',
                background: 'rgba(17, 28, 45, 0.75)',
                border: `1px solid ${theme.borderStrong}`,
                borderRadius: '16px',
                padding: '8px 8px 8px 18px',
                boxShadow: '0 18px 40px rgba(2, 8, 20, 0.28)'
              }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuery()}
                  placeholder="Ask about any company, stock, or market trend..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: theme.text,
                    fontSize: '15px',
                    outline: 'none',
                    padding: '10px 0'
                  }}
                />
                <button onClick={handleQuery} disabled={loading} style={{
                  padding: '12px 22px',
                  borderRadius: '12px',
                  border: '1px solid rgba(108,150,255,0.2)',
                  background: loading ? 'rgba(91,140,255,0.24)' : 'linear-gradient(135deg, #4f7fff, #6ca0ff)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : `0 14px 24px rgba(47, 98, 230, 0.28), 0 0 20px rgba(91,140,255,0.22)`
                }}>
                  {loading ? 'Analyzing...' : 'Analyze →'}
                </button>
              </div>

              {loading && (
                <div style={{
                  ...panelStyle,
                  padding: '54px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '14px' }}>⚙️</div>
                  <p style={{ color: theme.text, fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>Agent is working</p>
                  <p style={{ color: theme.textMuted, fontSize: '13px' }}>
                    Fetching stock data → Scanning news → Searching documents → Synthesizing
                  </p>
                </div>
              )}

              {!result && !loading && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
                    {[
                      { label: 'AI Model', value: 'Llama 3.3', sub: 'Groq inference engine', color: theme.blue, tint: theme.blueSoft },
                      { label: 'Saved Reports', value: reports.length, sub: recentReportDate, color: theme.emerald, tint: theme.emeraldSoft },
                      { label: 'Watchlist', value: watchlist.length, sub: `${uniqueCompaniesTracked} tracked companies`, color: theme.amber, tint: theme.amberSoft },
                      { label: 'Workspace', value: org?.name || 'Personal', sub: isUserAdmin ? 'Admin access' : 'Analyst access', color: '#86a7ff', tint: 'rgba(134,167,255,0.12)' },
                    ].map((s, i) => (
                      <div key={i} style={{
                        ...panelStyle,
                        padding: '20px',
                        borderTop: `1px solid ${s.color}55`,
                        background: `linear-gradient(180deg, ${s.tint} 0%, rgba(15,26,44,0.9) 45%, rgba(13,22,36,0.92) 100%)`
                      }}>
                        <p style={{ color: s.color, fontSize: '29px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.6px' }}>{s.value}</p>
                        <p style={{ color: theme.textSoft, fontSize: '12px', fontWeight: '700' }}>{s.label}</p>
                        <p style={{ color: theme.textFaint, fontSize: '11px', marginTop: '3px' }}>{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ ...panelStyle, padding: '26px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <p style={sectionEyebrow}>Workspace Home</p>
                          <h3 style={{ color: theme.text, fontSize: '22px', fontWeight: '800', marginTop: '6px' }}>
                            Welcome back, {user?.name?.split(' ')[0] || 'Analyst'}
                          </h3>
                        </div>
                        <div style={{
                          padding: '7px 12px',
                          borderRadius: '999px',
                          background: theme.blueSoft,
                          border: '1px solid rgba(91,140,255,0.22)',
                          color: '#9fc0ff',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          {isUserAdmin ? 'Admin Workspace' : 'Analyst Workspace'}
                        </div>
                      </div>

                      <p style={{ color: theme.textSoft, fontSize: '14px', lineHeight: '1.75', marginBottom: '20px', maxWidth: '90%' }}>
                        Your dashboard brings together recent research, tracked companies, and quick actions so you can jump straight into the next analysis without losing context.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                        {[
                          {
                            title: 'New Research',
                            desc: 'Start a fresh company analysis',
                            action: () => {
                              setResult(null);
                              setActiveTab('query');
                              setQuery('');
                            },
                            color: theme.blue,
                            bg: 'rgba(91,140,255,0.08)'
                          },
                          {
                            title: 'Saved Reports',
                            desc: 'Review your latest analyses',
                            action: () => setActiveTab('reports'),
                            color: theme.emerald,
                            bg: 'rgba(53,201,139,0.08)'
                          },
                          {
                            title: 'Watchlist',
                            desc: 'Open your tracked companies',
                            action: () => setActiveTab('watchlist'),
                            color: theme.amber,
                            bg: 'rgba(243,180,79,0.08)'
                          },
                          {
                            title: isUserAdmin ? 'Admin Panel' : 'Research Tips',
                            desc: isUserAdmin ? 'Manage org access and roles' : 'Use example prompts below',
                            action: () => isUserAdmin ? setActiveTab('admin') : setQuery('Analyze NVIDIA stock'),
                            color: '#86a7ff',
                            bg: 'rgba(134,167,255,0.08)'
                          },
                        ].map((item, i) => (
                          <button key={i} onClick={item.action} style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `1px solid ${item.color}25`,
                            background: item.bg,
                            textAlign: 'left',
                            cursor: 'pointer',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                          }}>
                            <p style={{ color: item.color, fontSize: '13px', fontWeight: '700', marginBottom: '5px' }}>{item.title}</p>
                            <p style={{ color: theme.textSoft, fontSize: '12px', lineHeight: '1.55' }}>{item.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ ...panelStyle, padding: '20px' }}>
                      <p style={sectionEyebrow}>Quick Actions</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                        <button onClick={() => setQuery('Analyze Apple stock and recent news')} style={quickActionStyle}>
                          <span>Analyze Apple</span>
                          <span style={{ color: theme.blue }}>→</span>
                        </button>
                        <button onClick={() => setQuery('Compare Microsoft and Google performance')} style={quickActionStyle}>
                          <span>Compare Companies</span>
                          <span style={{ color: theme.blue }}>→</span>
                        </button>
                        <button onClick={() => setActiveTab('reports')} style={quickActionStyle}>
                          <span>Open Reports</span>
                          <span style={{ color: theme.emerald }}>→</span>
                        </button>
                        <button onClick={() => setActiveTab('watchlist')} style={quickActionStyle}>
                          <span>Open Watchlist</span>
                          <span style={{ color: theme.amber }}>→</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ ...panelStyle, padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <p style={sectionEyebrow}>Recent Research Queries</p>
                        <button onClick={() => setActiveTab('reports')} style={linkButtonStyle}>View all</button>
                      </div>

                      {recentReports.length === 0 ? (
                        <div style={emptyStateStyle}>
                          <p style={{ color: theme.textSoft, fontSize: '13px' }}>No reports yet. Run your first research query to populate this workspace.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {recentReports.map((report: any) => (
                            <div key={report.id} style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.02)',
                              border: `1px solid ${theme.border}`
                            }}>
                              <p style={{ color: theme.text, fontSize: '13px', fontWeight: '600', marginBottom: '6px', lineHeight: '1.5' }}>{report.title}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                                <span style={{ color: theme.textFaint, fontSize: '11px' }}>{formatDate(report.created_at)}</span>
                                {report.tags ? (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    background: theme.blueSoft,
                                    color: '#9fc0ff',
                                    fontSize: '10px',
                                    fontWeight: '700'
                                  }}>
                                    {report.tags}
                                  </span>
                                ) : (
                                  <span style={{ color: theme.textFaint, fontSize: '10px' }}>Research Report</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ ...panelStyle, padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <p style={sectionEyebrow}>Bookmarked Companies</p>
                        <button onClick={() => setActiveTab('watchlist')} style={linkButtonStyle}>Open watchlist</button>
                      </div>

                      {watchlistPreview.length === 0 ? (
                        <div style={emptyStateStyle}>
                          <p style={{ color: theme.textSoft, fontSize: '13px' }}>Tracked companies will appear here after you add them from a research result.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                          {watchlistPreview.map((item: any) => (
                            <div key={item.id} style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.02)',
                              border: `1px solid ${theme.border}`
                            }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #4c7dff, #7aa7ff)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                color: 'white',
                                marginBottom: '10px',
                                fontSize: '13px'
                              }}>
                                {item.symbol?.[0]}
                              </div>
                              <p style={{ color: theme.text, fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{item.company_name}</p>
                              <p style={{ color: '#96b5ff', fontSize: '11px', fontWeight: '700' }}>{item.symbol}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ ...panelStyle, padding: '24px', marginBottom: '16px' }}>
                    <p style={sectionEyebrow}>How the AI Agent Works</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginTop: '18px' }}>
                      {[
                        { n: '01', title: 'Natural language query', desc: 'Type anything — company name, comparison, earnings report, risk assessment.', color: theme.blue, bg: 'rgba(91,140,255,0.07)' },
                        { n: '02', title: 'Intelligent tool calling', desc: 'Agent selects which tools to use — stock API, news API, or vector document search.', color: '#7ea5ff', bg: 'rgba(126,165,255,0.07)' },
                        { n: '03', title: 'Structured output', desc: 'Results rendered as cards, metrics, sentiment badges, and source-attributed insights.', color: theme.emerald, bg: 'rgba(53,201,139,0.07)' },
                      ].map((s, i) => (
                        <div key={i} style={{ padding: '16px', borderRadius: '12px', background: s.bg, border: `1px solid ${s.color}18` }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: `${s.color}15`, padding: '3px 8px', borderRadius: '999px', display: 'inline-block', marginBottom: '10px', letterSpacing: '1px' }}>STEP {s.n}</div>
                          <p style={{ color: theme.text, fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>{s.title}</p>
                          <p style={{ color: theme.textSoft, fontSize: '12px', lineHeight: '1.6' }}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...panelStyle, padding: '20px' }}>
                    <p style={sectionEyebrow}>Example Queries</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginTop: '14px' }}>
                      {[
                        { q: 'Analyze Apple stock and recent news', tag: 'Stock' },
                        { q: 'What did NVIDIA say in Q3 2024 earnings?', tag: 'Earnings' },
                        { q: 'Compare Microsoft and Google performance', tag: 'Compare' },
                        { q: 'Give me a risk assessment of Tesla', tag: 'Risk' },
                        { q: 'Latest news on Amazon', tag: 'News' },
                        { q: 'Analyze Microsoft Q1 2025 earnings', tag: 'Earnings' },
                      ].map((item, i) => (
                        <button key={i} onClick={() => setQuery(item.q)} style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: 'rgba(255,255,255,0.02)',
                          border: `1px solid ${theme.border}`,
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ color: theme.textSoft, fontSize: '12px' }}>{item.q}</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#8bb0ff', background: 'rgba(91,140,255,0.12)', padding: '3px 7px', borderRadius: '999px', flexShrink: 0, marginLeft: '8px' }}>{item.tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result && !loading && (
                <div>
                  <div style={{
                    ...panelStyle,
                    padding: '20px',
                    marginBottom: '16px',
                    background: 'linear-gradient(180deg, rgba(91,140,255,0.12), rgba(15,26,44,0.92))',
                    border: '1px solid rgba(91,140,255,0.18)'
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#8fb3ff', textTransform: 'uppercase', marginBottom: '8px' }}>AI Summary</p>
                    <p style={{ color: theme.textSoft, lineHeight: '1.8', fontSize: '14px' }}>{result.summary}</p>
                  </div>

                  {result.companies?.map((company: any, i: number) => (
                    <div key={i} style={{ ...panelStyle, padding: '22px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '14px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #4a79ff, #7ea7ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            color: 'white',
                            fontSize: '15px',
                            boxShadow: `0 10px 22px ${theme.blueSoft}`
                          }}>{company.symbol?.[0]}</div>
                          <div>
                            <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>{company.name}</h3>
                            <p style={{ color: theme.textMuted, fontSize: '12px' }}>{company.symbol} · Stock Analysis</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            onClick={() => handleAddToWatchlist(company.symbol, company.name)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              border: '1px solid rgba(91,140,255,0.22)',
                              background: theme.blueSoft,
                              color: '#a9c3ff',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            + Watchlist
                          </button>

                          <span style={{
                            padding: '6px 14px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: sentimentBg(company.sentiment),
                            color: sentimentColor(company.sentiment),
                            border: `1px solid ${sentimentColor(company.sentiment)}33`
                          }}>
                            {company.sentiment === 'positive' ? '▲' : company.sentiment === 'negative' ? '▼' : '●'} {company.sentiment}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
                        {[
                          { label: 'Price', value: `$${company.current_price}` },
                          { label: 'Market Cap', value: company.market_cap },
                          { label: 'P/E Ratio', value: company.pe_ratio },
                          { label: '30d Change', value: company.price_change_30d },
                        ].map((m, j) => (
                          <div key={j} style={{
                            padding: '14px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.02)',
                            border: `1px solid ${theme.border}`
                          }}>
                            <p style={{ color: theme.textFaint, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{m.label}</p>
                            <p style={{ color: theme.text, fontSize: '16px', fontWeight: '800' }}>{m.value}</p>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${theme.border}`
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
                            <p style={{ color: theme.textSoft, fontSize: '12px', fontWeight: '600' }}>
                              {company.symbol} price history
                            </p>
                          </div>

                          <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '10px',
                              border: `1px solid ${theme.borderStrong}`,
                              background: theme.bgSoft,
                              color: theme.text,
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
                            color: theme.textMuted,
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
                            color: theme.red,
                            fontSize: '13px'
                          }}>
                            {chartErrorMap[company.symbol]}
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartDataMap[company.symbol] || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(154,174,208,0.10)" />
                                <XAxis dataKey="date" stroke={theme.textFaint} fontSize={11} />
                                <YAxis stroke={theme.textFaint} fontSize={11} domain={['auto', 'auto']} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#0d1726',
                                    border: `1px solid ${theme.borderStrong}`,
                                    borderRadius: '12px',
                                    color: theme.text,
                                    boxShadow: theme.shadow
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="close"
                                  stroke="#6ea2ff"
                                  strokeWidth={2.6}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(53,201,139,0.07)', border: '1px solid rgba(53,201,139,0.16)' }}>
                          <p style={{ color: theme.emerald, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Key Insights</p>
                          {company.key_insights?.map((s: string, k: number) => (
                            <p key={k} style={{ color: theme.textSoft, fontSize: '12px', marginBottom: '5px', lineHeight: '1.6' }}>· {s}</p>
                          ))}
                        </div>
                        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(243,107,107,0.07)', border: '1px solid rgba(243,107,107,0.16)' }}>
                          <p style={{ color: theme.red, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Risk Factors</p>
                          {company.risks?.map((s: string, k: number) => (
                            <p key={k} style={{ color: theme.textSoft, fontSize: '12px', marginBottom: '5px', lineHeight: '1.6' }}>· {s}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {result.news_highlights?.length > 0 && (
                    <div style={{ ...panelStyle, padding: '20px', marginBottom: '14px' }}>
                      <p style={sectionEyebrow}>News Highlights</p>
                      <div style={{ marginTop: '14px' }}>
                        {result.news_highlights.map((news: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: i < result.news_highlights.length - 1 ? `1px solid ${theme.border}` : 'none', gap: '14px' }}>
                            <p style={{ color: theme.textSoft, fontSize: '13px', flex: 1, marginRight: '16px', lineHeight: '1.6' }}>{news.title}</p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ color: theme.textFaint, fontSize: '11px' }}>{news.source}</span>
                              <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', background: sentimentBg(news.sentiment), color: sentimentColor(news.sentiment) }}>{news.sentiment}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.recommendation && (
                    <div style={{
                      ...panelStyle,
                      padding: '20px',
                      background: 'linear-gradient(180deg, rgba(91,140,255,0.10), rgba(14,26,43,0.94))',
                      border: '1px solid rgba(91,140,255,0.16)'
                    }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#8fb3ff', textTransform: 'uppercase', marginBottom: '8px' }}>AI Recommendation</p>
                      <p style={{ color: theme.textSoft, fontSize: '14px', lineHeight: '1.8', marginBottom: '10px' }}>{result.recommendation}</p>
                      <p style={{ color: theme.textFaint, fontSize: '11px' }}>Sources: {result.sources?.join(' · ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: theme.text, letterSpacing: '-0.6px', marginBottom: '4px' }}>Saved Reports</h1>
                <p style={{ color: theme.textMuted, fontSize: '13px' }}>
                  {isUserAdmin ? `All reports for ${org?.name}` : 'Your research reports'}
                </p>
              </div>
              {reports.length === 0 ? (
                <div style={{ ...panelStyle, padding: '60px', textAlign: 'center' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>📋</p>
                  <p style={{ color: theme.textMuted, fontSize: '14px' }}>No reports yet — run a query first!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                  {reports.map((r: any) => (
                    <div key={r.id} style={{ ...panelStyle, padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(91,140,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', fontSize: '16px' }}>📄</div>
                        <p style={{ color: theme.text, fontWeight: '600', fontSize: '14px', marginBottom: '6px', lineHeight: '1.5' }}>{r.title}</p>
                        <p style={{ color: theme.textFaint, fontSize: '11px' }}>{formatDate(r.created_at)}</p>
                      </div>
                      {isUserAdmin && (
                        <button onClick={() => deleteReport(r.id).then(fetchReports)} style={{ marginTop: '14px', padding: '8px', borderRadius: '9px', background: 'rgba(243,107,107,0.08)', border: '1px solid rgba(243,107,107,0.16)', color: '#ff8f8f', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: theme.text, letterSpacing: '-0.6px', marginBottom: '4px' }}>Watchlist</h1>
                <p style={{ color: theme.textMuted, fontSize: '13px' }}>Companies you are tracking</p>
              </div>
              {watchlist.length === 0 ? (
                <div style={{ ...panelStyle, padding: '60px', textAlign: 'center' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</p>
                  <p style={{ color: theme.textMuted, fontSize: '14px' }}>No companies yet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                  {watchlist.map((item: any) => (
                    <div key={item.id} style={{ ...panelStyle, padding: '18px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f7fff, #79a6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', marginBottom: '10px' }}>{item.symbol?.[0]}</div>
                      <p style={{ color: theme.text, fontWeight: '600', fontSize: '14px' }}>{item.company_name}</p>
                      <p style={{ color: '#8fb3ff', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>{item.symbol}</p>
                      <button onClick={() => removeFromWatchlist(item.id).then(fetchWatchlist)} style={{ width: '100%', padding: '8px', borderRadius: '9px', background: 'rgba(243,107,107,0.08)', border: '1px solid rgba(243,107,107,0.16)', color: '#ff8f8f', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'admin' && isUserAdmin && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: theme.text, letterSpacing: '-0.6px', marginBottom: '4px' }}>Admin Panel</h1>
                <p style={{ color: theme.textMuted, fontSize: '13px' }}>Manage your organization workspace</p>
              </div>

              <div style={{ ...panelStyle, padding: '24px', marginBottom: '16px' }}>
                <p style={sectionEyebrow}>Organization Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '16px' }}>
                  {[
                    { label: 'Org Name', value: org?.name },
                    { label: 'Invite Code', value: org?.invite_code },
                    { label: 'Total Reports', value: reports.length },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
                      <p style={{ color: theme.textFaint, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{item.label}</p>
                      <p style={{ color: theme.text, fontSize: '16px', fontWeight: '700', fontFamily: item.label === 'Invite Code' ? 'monospace' : 'inherit' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...panelStyle, padding: '24px', marginBottom: '16px' }}>
                <p style={sectionEyebrow}>Role Permissions</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                  {[
                    { feature: 'Run Research Queries', admin: true, analyst: true },
                    { feature: 'View Saved Reports', admin: true, analyst: true },
                    { feature: 'Delete Reports', admin: true, analyst: false },
                    { feature: 'Manage Watchlist', admin: true, analyst: true },
                    { feature: 'View Invite Code', admin: true, analyst: false },
                    { feature: 'Access Admin Panel', admin: true, analyst: false },
                  ].map((row, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSoft, fontSize: '13px' }}>{row.feature}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', background: row.admin ? theme.emeraldSoft : theme.redSoft, color: row.admin ? theme.emerald : theme.red }}>Admin</span>
                        <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', background: row.analyst ? theme.emeraldSoft : theme.redSoft, color: row.analyst ? theme.emerald : theme.red }}>Analyst</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                ...panelStyle,
                padding: '20px',
                background: 'linear-gradient(180deg, rgba(91,140,255,0.10), rgba(14,26,43,0.94))',
                border: '1px solid rgba(91,140,255,0.16)'
              }}>
                <p style={{ color: '#8fb3ff', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>How to invite teammates</p>
                <p style={{ color: theme.textSoft, fontSize: '13px', lineHeight: '1.7' }}>
                  Share your invite code <strong style={{ color: theme.text, fontFamily: 'monospace' }}>{org?.invite_code}</strong> with your team. They enter it during signup to join <strong style={{ color: theme.text }}>{org?.name}</strong> and will see all shared reports.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: '16px',
  background: theme.panel,
  border: `1px solid ${theme.border}`,
  boxShadow: theme.shadow,
  backdropFilter: 'blur(14px)',
};

const topPill: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${theme.border}`,
};

const sidebarLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '1.1px',
  color: theme.textFaint,
  textTransform: 'uppercase',
  padding: '0 4px',
  marginBottom: '8px'
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1.1px',
  color: theme.textFaint,
  textTransform: 'uppercase',
};

const quickActionStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: '12px',
  border: `1px solid ${theme.border}`,
  background: 'rgba(255,255,255,0.02)',
  color: theme.text,
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  textAlign: 'left',
};

const linkButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#8fb3ff',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  padding: 0,
};

const emptyStateStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.02)',
  border: `1px dashed ${theme.borderStrong}`
};
