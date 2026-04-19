'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getReports, getWatchlist, deleteReport, removeFromWatchlist, runQuery } from '@/lib/api';
import { LogOut, Search, Trash2, Plus, TrendingUp, FileText, Star } from 'lucide-react';

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
    const storedUser = localStorage.getItem('user');
    const storedOrg = localStorage.getItem('org');
    if (!localStorage.getItem('token')) {
      router.push('/');
      return;
    }
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedOrg) setOrg(JSON.parse(storedOrg));
    fetchReports();
    fetchWatchlist();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await getReports();
      setReports(res.data);
    } catch (err) {}
  };

  const fetchWatchlist = async () => {
    try {
      const res = await getWatchlist();
      setWatchlist(res.data);
    } catch (err) {}
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await runQuery(query, '');
      setResult(res.data.result);
      fetchReports();
    } catch (err) {
      alert('Query failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    await deleteReport(id);
    fetchReports();
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const sentimentColor = (s: string) =>
    s === 'positive' ? '#22c55e' : s === 'negative' ? '#ef4444' : '#f59e0b';

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Navbar */}
      <div style={{
        background: '#1e293b', borderBottom: '1px solid #334155',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TrendingUp size={24} color="#3b82f6" />
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#f1f5f9' }}>
            Klypup Research
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {org && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '500' }}>{org.name}</p>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Invite: {org.invite_code}</p>
            </div>
          )}
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#3b82f6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '700', color: 'white'
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
          }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <div style={{
          width: '220px', background: '#1e293b', borderRight: '1px solid #334155',
          padding: '16px', flexShrink: 0
        }}>
          {[
            { id: 'query', label: 'New Research', icon: <Search size={16} /> },
            { id: 'reports', label: 'Saved Reports', icon: <FileText size={16} /> },
            { id: 'watchlist', label: 'Watchlist', icon: <Star size={16} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', marginBottom: '4px',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '500', textAlign: 'left'
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {/* Query Tab */}
          {activeTab === 'query' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
                Research Query
              </h2>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                Ask anything about stocks, companies, or market trends
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuery()}
                  placeholder="e.g. Analyze Apple stock and recent news..."
                  style={{
                    flex: 1, padding: '14px 16px', background: '#1e293b',
                    border: '1px solid #334155', borderRadius: '10px',
                    color: '#f1f5f9', fontSize: '15px', outline: 'none'
                  }}
                />
                <button onClick={handleQuery} disabled={loading} style={{
                  padding: '14px 24px', background: '#3b82f6', color: 'white',
                  border: 'none', borderRadius: '10px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px',
                  opacity: loading ? 0.7 : 1
                }}>
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              {/* Loading state */}
              {loading && (
                <div style={{
                  background: '#1e293b', borderRadius: '12px', padding: '40px',
                  textAlign: 'center', border: '1px solid #334155'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '16px' }}>
                    🤖 AI agent is gathering data...
                  </p>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>
                    Fetching stock prices, news, and documents
                  </p>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div>
                  {/* Summary card */}
                  <div style={{
                    background: '#1e293b', borderRadius: '12px', padding: '20px',
                    marginBottom: '16px', border: '1px solid #334155'
                  }}>
                    <h3 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600',
                      textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      Summary
                    </h3>
                    <p style={{ color: '#f1f5f9', lineHeight: '1.6' }}>{result.summary}</p>
                  </div>

                  {/* Company cards */}
                  {result.companies?.map((company: any, i: number) => (
                    <div key={i} style={{
                      background: '#1e293b', borderRadius: '12px', padding: '20px',
                      marginBottom: '16px', border: '1px solid #334155'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700' }}>
                            {company.name}
                            <span style={{ color: '#64748b', fontSize: '14px', marginLeft: '8px' }}>
                              {company.symbol}
                            </span>
                          </h3>
                        </div>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                          background: sentimentColor(company.sentiment) + '22',
                          color: sentimentColor(company.sentiment)
                        }}>
                          {company.sentiment}
                        </span>
                      </div>

                      {/* Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        {[
                          { label: 'Price', value: `$${company.current_price}` },
                          { label: 'Market Cap', value: company.market_cap },
                          { label: 'P/E Ratio', value: company.pe_ratio },
                          { label: '30d Change', value: company.price_change_30d },
                        ].map((metric, j) => (
                          <div key={j} style={{
                            background: '#0f172a', borderRadius: '8px', padding: '12px'
                          }}>
                            <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '4px' }}>{metric.label}</p>
                            <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '700' }}>{metric.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Insights and risks */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <p style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                            KEY INSIGHTS
                          </p>
                          {company.key_insights?.map((insight: string, k: number) => (
                            <p key={k} style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                              • {insight}
                            </p>
                          ))}
                        </div>
                        <div>
                          <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                            RISKS
                          </p>
                          {company.risks?.map((risk: string, k: number) => (
                            <p key={k} style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                              • {risk}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* News highlights */}
                  {result.news_highlights?.length > 0 && (
                    <div style={{
                      background: '#1e293b', borderRadius: '12px', padding: '20px',
                      marginBottom: '16px', border: '1px solid #334155'
                    }}>
                      <h3 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                        News Highlights
                      </h3>
                      {result.news_highlights.map((news: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '10px 0',
                          borderBottom: i < result.news_highlights.length - 1 ? '1px solid #334155' : 'none'
                        }}>
                          <p style={{ color: '#f1f5f9', fontSize: '14px', flex: 1, marginRight: '12px' }}>
                            {news.title}
                          </p>
                          <span style={{
                            padding: '2px 10px', borderRadius: '20px', fontSize: '11px',
                            fontWeight: '600', flexShrink: 0,
                            background: sentimentColor(news.sentiment) + '22',
                            color: sentimentColor(news.sentiment)
                          }}>
                            {news.sentiment}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendation */}
                  {result.recommendation && (
                    <div style={{
                      background: '#1e293b', borderRadius: '12px', padding: '20px',
                      border: '1px solid #3b82f6'
                    }}>
                      <h3 style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        AI Recommendation
                      </h3>
                      <p style={{ color: '#f1f5f9', lineHeight: '1.6' }}>{result.recommendation}</p>
                      <p style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>
                        Sources: {result.sources?.join(', ')}
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
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '24px' }}>
                Saved Reports
              </h2>
              {reports.length === 0 ? (
                <div style={{
                  background: '#1e293b', borderRadius: '12px', padding: '40px',
                  textAlign: 'center', border: '1px solid #334155'
                }}>
                  <p style={{ color: '#64748b' }}>No reports yet. Run a research query first!</p>
                </div>
              ) : (
                reports.map((report: any) => (
                  <div key={report.id} style={{
                    background: '#1e293b', borderRadius: '12px', padding: '20px',
                    marginBottom: '12px', border: '1px solid #334155',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ color: '#f1f5f9', fontWeight: '600', marginBottom: '4px' }}>
                        {report.title}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px' }}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteReport(report.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444'
                    }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '24px' }}>
                Watchlist
              </h2>
              {watchlist.length === 0 ? (
                <div style={{
                  background: '#1e293b', borderRadius: '12px', padding: '40px',
                  textAlign: 'center', border: '1px solid #334155'
                }}>
                  <p style={{ color: '#64748b' }}>No companies in watchlist yet.</p>
                </div>
              ) : (
                watchlist.map((item: any) => (
                  <div key={item.id} style={{
                    background: '#1e293b', borderRadius: '12px', padding: '20px',
                    marginBottom: '12px', border: '1px solid #334155',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ color: '#f1f5f9', fontWeight: '600' }}>{item.company_name}</p>
                      <p style={{ color: '#3b82f6', fontSize: '13px' }}>{item.symbol}</p>
                    </div>
                    <button onClick={() => removeFromWatchlist(item.id).then(fetchWatchlist)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444'
                    }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}