'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getReports, getWatchlist, deleteReport, removeFromWatchlist, runQuery } from '@/lib/api';

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

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/'); return; }
    setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    setOrg(JSON.parse(localStorage.getItem('org') || '{}'));
    fetchReports();
    fetchWatchlist();
  }, []);

  const fetchReports = async () => {
    try { const res = await getReports(); setReports(res.data); } catch {}
  };
  const fetchWatchlist = async () => {
    try { const res = await getWatchlist(); setWatchlist(res.data); } catch {}
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
    s === 'positive' ? '#22c55e' : s === 'negative' ? '#ef4444' : '#f59e0b';
  const sentimentBg = (s: string) =>
    s === 'positive' ? 'rgba(34,197,94,0.1)' : s === 'negative' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';

  const tabs = [
    { id: 'query', label: 'New Research', icon: '🔍' },
    { id: 'reports', label: 'Saved Reports', icon: '📋' },
    { id: 'watchlist', label: 'Watchlist', icon: '⭐' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#030811', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(13, 2, 2, 0.06)',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '64px', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #698dc8, rgb(4, 1, 11))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '25px'
          }}>💰</div>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#e1d2c6' }}>Klypup Research</span>
          <div style={{
            marginLeft: '8px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
            background: 'rgba(71, 137, 243, 0.15)', color: '#60a5fa', fontWeight: '600'
          }}>AI Powered</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {org && (
            <div style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
              background: 'rgba(29, 23, 23, 0.04)', border: '1px solid rgba(255,255,255,0.06)',
              color: '#bfcee1'
            }}>
              🏢 {org.name}
              <span style={{ color: '#475569', marginLeft: '8px', fontSize: '11px' }}>
                #{org.invite_code}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #132a50, #7f95a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', color: 'white', fontSize: '14px'
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '600', lineHeight: 1 }}>{user?.name}</p>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
            color: '#f87171', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
          }}>Logout</button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: '240px', background: 'rgba(15,23,42,0.6)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '24px 16px', flexShrink: 0
        }}>
          <p style={{ fontSize: '11px', color: '#475569', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px'
          }}>Navigation</p>

          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width: '100%', padding: '11px 14px', borderRadius: '10px',
              border: 'none', cursor: 'pointer', marginBottom: '4px',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))'
                : 'transparent',
              color: activeTab === tab.id ? '#93c5fd' : '#64748b',
              display: 'flex', alignItems: 'center', gap: '10px',
              fontSize: '14px', fontWeight: activeTab === tab.id ? '600' : '400',
              textAlign: 'left',
              borderLeft: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent'
            }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}

          {/* Stats */}
          <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Workspace</p>
            {[
              { label: 'Reports', value: reports.length },
              { label: 'Watchlist', value: watchlist.length },
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{stat.label}</span>
                <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '700' }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Example queries */}
          {activeTab === 'query' && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Try These</p>
              {[
                'Analyze NVIDIA stock',
                'Apple Q4 2024 earnings',
                'Compare Tesla and Ford',
              ].map((q, i) => (
                <button key={i} onClick={() => setQuery(q)} style={{
                  width: '100%', padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)', background: 'transparent',
                  color: '#64748b', fontSize: '12px', cursor: 'pointer',
                  marginBottom: '6px', textAlign: 'left'
                }}>→ {q}</button>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

          {/* Query Tab */}
          {activeTab === 'query' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#f1f5f9', marginBottom: '6px' }}>
                  Research Query
                </h2>
                <p style={{ color: '#475569', fontSize: '14px' }}>
                  Ask anything about stocks, companies, or market trends
                </p>
              </div>

              {/* Search bar */}
              <div style={{
                display: 'flex', gap: '12px', marginBottom: '28px',
                background: 'rgba(30,41,59,0.6)', borderRadius: '14px',
                padding: '8px', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <input value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuery()}
                  placeholder="e.g. Analyze Apple stock and recent news, Compare NVIDIA and AMD..."
                  style={{
                    flex: 1, padding: '12px 16px', background: 'transparent',
                    border: 'none', color: '#f1f5f9', fontSize: '15px', outline: 'none'
                  }} />
                <button onClick={handleQuery} disabled={loading} style={{
                  padding: '12px 28px',
                  background: loading ? '#1e293b' : 'linear-gradient(135deg, #22447c, #06030d)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', whiteSpace: 'nowrap'
                }}>
                  {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
                </button>
              </div>

              {/* Loading */}
              {loading && (
                <div style={{
                  background: 'rgba(30,41,59,0.6)', borderRadius: '16px', padding: '48px',
                  textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>👀</div>
                  <p style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    AI Agent is working...
                  </p>
                  <p style={{ color: '#475569', fontSize: '14px' }}>
                    Fetching stock prices → Getting latest news → Searching documents → Synthesizing analysis
                  </p>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div>
                  {/* Summary */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                    borderRadius: '16px', padding: '24px', marginBottom: '20px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '16px' }}>📈</span>
                      <p style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '1px' }}>AI Summary</p>
                    </div>
                    <p style={{ color: '#e2e8f0', lineHeight: '1.7', fontSize: '15px' }}>{result.summary}</p>
                  </div>

                  {/* Company cards */}
                  {result.companies?.map((company: any, i: number) => (
                    <div key={i} style={{
                      background: 'rgba(30,41,59,0.6)', borderRadius: '16px', padding: '24px',
                      marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      {/* Company header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6, #111017)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', color: 'white', fontSize: '16px'
                          }}>
                            {company.symbol?.[0]}
                          </div>
                          <div>
                            <h3 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: '800' }}>
                              {company.name}
                            </h3>
                            <p style={{ color: '#475569', fontSize: '13px' }}>{company.symbol} · Stock Analysis</p>
                          </div>
                        </div>
                        <span style={{
                          padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                          background: sentimentBg(company.sentiment),
                          color: sentimentColor(company.sentiment),
                          border: `1px solid ${sentimentColor(company.sentiment)}33`
                        }}>
                          {company.sentiment === 'positive' ? '↑' : company.sentiment === 'negative' ? '↓' : '→'} {company.sentiment}
                        </span>
                      </div>

                      {/* Metrics grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                        {[
                          { label: 'Current Price', value: `$${company.current_price}`, icon: '💵' },
                          { label: 'Market Cap', value: company.market_cap, icon: '🏦' },
                          { label: 'P/E Ratio', value: company.pe_ratio, icon: '📉' },
                          { label: '30d Change', value: company.price_change_30d, icon: '📈' },
                        ].map((metric, j) => (
                          <div key={j} style={{
                            background: 'rgba(15,23,42,0.6)', borderRadius: '12px', padding: '16px',
                            border: '1px solid rgba(255,255,255,0.04)'
                          }}>
                            <p style={{ color: '#475569', fontSize: '11px', marginBottom: '6px', fontWeight: '600' }}>
                              {metric.icon} {metric.label}
                            </p>
                            <p style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '800' }}>{metric.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Insights and risks */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{
                          background: 'rgba(34,197,94,0.05)', borderRadius: '12px',
                          padding: '16px', border: '1px solid rgba(34,197,94,0.1)'
                        }}>
                          <p style={{ color: '#22c55e', fontSize: '12px', fontWeight: '700',
                            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                            ✓ Key Insights
                          </p>
                          {company.key_insights?.map((insight: string, k: number) => (
                            <p key={k} style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '6px', lineHeight: '1.5' }}>
                              • {insight}
                            </p>
                          ))}
                        </div>
                        <div style={{
                          background: 'rgba(239,68,68,0.05)', borderRadius: '12px',
                          padding: '16px', border: '1px solid rgba(239,68,68,0.1)'
                        }}>
                          <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700',
                            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                            ⚠ Risk Factors
                          </p>
                          {company.risks?.map((risk: string, k: number) => (
                            <p key={k} style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '6px', lineHeight: '1.5' }}>
                              • {risk}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* News */}
                  {result.news_highlights?.length > 0 && (
                    <div style={{
                      background: 'rgba(30,41,59,0.6)', borderRadius: '16px', padding: '24px',
                      marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span>📰</span>
                        <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '1px' }}>News Highlights</p>
                      </div>
                      {result.news_highlights.map((news: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '14px 0',
                          borderBottom: i < result.news_highlights.length - 1
                            ? '1px solid rgba(255,255,255,0.04)' : 'none'
                        }}>
                          <p style={{ color: '#cbd5e1', fontSize: '14px', flex: 1, marginRight: '16px', lineHeight: '1.5' }}>
                            {news.title}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ color: '#475569', fontSize: '12px' }}>{news.source}</span>
                            <span style={{
                              padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                              background: sentimentBg(news.sentiment),
                              color: sentimentColor(news.sentiment)
                            }}>{news.sentiment}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendation */}
                  {result.recommendation && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
                      borderRadius: '16px', padding: '24px',
                      border: '1px solid rgba(59,130,246,0.15)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span>🤖</span>
                        <p style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '1px' }}>AI Recommendation</p>
                      </div>
                      <p style={{ color: '#e2e8f0', lineHeight: '1.7', fontSize: '15px', marginBottom: '12px' }}>
                        {result.recommendation}
                      </p>
                      <p style={{ color: '#475569', fontSize: '12px' }}>
                        📡 Sources: {result.sources?.join(' · ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#f1f5f9', marginBottom: '6px' }}>
                  Saved Reports
                </h2>
                <p style={{ color: '#475569', fontSize: '14px' }}>
                  All research reports for {org?.name}
                </p>
              </div>

              {reports.length === 0 ? (
                <div style={{
                  background: 'rgba(30,41,59,0.6)', borderRadius: '16px', padding: '60px',
                  textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <p style={{ color: '#64748b', fontSize: '16px' }}>No reports yet.</p>
                  <p style={{ color: '#475569', fontSize: '14px', marginTop: '4px' }}>
                    Run a research query to get started!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {reports.map((report: any) => (
                    <div key={report.id} style={{
                      background: 'rgba(30,41,59,0.6)', borderRadius: '16px', padding: '20px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>📄</div>
                        <p style={{ color: '#f1f5f9', fontWeight: '700', marginBottom: '8px', fontSize: '15px', lineHeight: '1.4' }}>
                          {report.title}
                        </p>
                        <p style={{ color: '#475569', fontSize: '12px' }}>
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <button onClick={() => deleteReport(report.id).then(fetchReports)} style={{
                        marginTop: '16px', padding: '8px', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                        color: '#f87171', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
                      }}>
                        🗑 Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#f1f5f9', marginBottom: '6px' }}>
                  Watchlist
                </h2>
                <p style={{ color: '#475569', fontSize: '14px' }}>
                  Companies you're tracking
                </p>
              </div>

              {watchlist.length === 0 ? (
                <div style={{
                  background: 'rgba(30,41,59,0.6)', borderRadius: '16px', padding: '60px',
                  textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                  <p style={{ color: '#64748b', fontSize: '16px' }}>No companies in watchlist.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {watchlist.map((item: any) => (
                    <div key={item.id} style={{
                      background: 'rgba(30,41,59,0.6)', borderRadius: '16px', padding: '20px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '800', color: 'white', marginBottom: '12px', fontSize: '16px'
                      }}>
                        {item.symbol?.[0]}
                      </div>
                      <p style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '15px' }}>{item.company_name}</p>
                      <p style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>{item.symbol}</p>
                      <button onClick={() => removeFromWatchlist(item.id).then(fetchWatchlist)} style={{
                        width: '100%', padding: '8px', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                        color: '#f87171', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
                      }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}