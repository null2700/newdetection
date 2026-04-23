import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DashboardUser() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newsInput, setNewsInput] = useState("");
  const [isUrl, setIsUrl] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const [counterReadings, setCounterReadings] = useState({});
  const [loadingCounter, setLoadingCounter] = useState({});

  const handlePerspectiveSwap = (newsId, title, biasLabel) => {
    if (counterReadings[newsId] || loadingCounter[newsId]) return;

    setLoadingCounter(prev => ({ ...prev, [newsId]: true }));
    
    // Simulate an API search delay
    setTimeout(() => {
      const topic = title ? title.split(' ').slice(0, 5).join(' ') : 'this topic';
      let recommendations = [];
      
      if (biasLabel === 'LEFT') {
        recommendations = [
          {
            id: 'r1',
            type: 'RIGHT',
            title: `Conservative Viewpoint on: ${topic}...`,
            source: 'Right-Leaning Publications',
            labelClass: 'bg-red-500/20 text-red-400'
          },
          {
            id: 'r2',
            type: 'CENTER',
            title: `Fact-Check & Neutral Analysis: ${topic}...`,
            source: 'Independent Wire',
            labelClass: 'bg-purple-500/20 text-purple-400'
          }
        ];
      } else if (biasLabel === 'RIGHT') {
        recommendations = [
          {
            id: 'r3',
            type: 'LEFT',
            title: `Progressive Viewpoint on: ${topic}...`,
            source: 'Left-Leaning Publications',
            labelClass: 'bg-blue-500/20 text-blue-400'
          },
          {
            id: 'r4',
            type: 'CENTER',
            title: `Fact-Check & Neutral Analysis: ${topic}...`,
            source: 'Independent Wire',
            labelClass: 'bg-purple-500/20 text-purple-400'
          }
        ];
      }

      setCounterReadings(prev => ({ ...prev, [newsId]: recommendations }));
      setLoadingCounter(prev => ({ ...prev, [newsId]: false }));
    }, 1500);
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const response = await fetch("http://127.0.0.1:8000/dashboard-data", {
        headers,
        credentials: "include"
      });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
        }
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      // sort history by newest first
      if (data.news_history) {
        data.news_history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!newsInput.trim()) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const payload = isUrl ? { url: newsInput } : { text: newsInput };
      const token = localStorage.getItem("token");
      const headers = { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };
      
      const response = await fetch("http://127.0.0.1:8000/news/analyze", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Analysis failed. Please try again.");
      
      // Refresh dashboard data to show new history
      await fetchDashboardData();
      setNewsInput("");
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-300">{error}</p>
          <button onClick={() => window.location.href="/"} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">Return Home</button>
        </div>
      </div>
    );
  }

  const { user, news_history, bias_summary } = dashboardData;
  const totalArticles = news_history ? news_history.length : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header / User Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 bg-[#13131a] p-8 rounded-2xl border border-white/5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-cyan-500/20">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {user.username}!</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Analyze News Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#13131a] p-6 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold text-white mb-4">Analyze News Bias</h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="radio" checked={!isUrl} onChange={() => setIsUrl(false)} className="text-cyan-500 bg-gray-800 border-gray-700" />
                    Paste Text
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="radio" checked={isUrl} onChange={() => setIsUrl(true)} className="text-cyan-500 bg-gray-800 border-gray-700" />
                    Enter URL
                  </label>
                </div>
                
                {isUrl ? (
                  <input
                    type="url"
                    placeholder="https://news-article.com/..."
                    value={newsInput}
                    onChange={(e) => setNewsInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                ) : (
                  <textarea
                    placeholder="Paste news article content here..."
                    rows={5}
                    value={newsInput}
                    onChange={(e) => setNewsInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                  />
                )}
                
                {analyzeError && <p className="text-red-400 text-sm">{analyzeError}</p>}
                
                <button
                  type="submit"
                  disabled={analyzing || !newsInput.trim()}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : "Analyze Bias"}
                </button>
              </form>
            </motion.div>

            {/* History Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#13131a] p-6 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6">Analysis History</h2>
              <div className="space-y-4">
                {news_history && news_history.length > 0 ? (
                  news_history.map((news) => (
                    <div key={news.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white truncate max-w-[70%]">{news.title || "Analyzed Article"}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          news.bias_label === 'LEFT' ? 'bg-blue-500/20 text-blue-400' :
                          news.bias_label === 'RIGHT' ? 'bg-red-500/20 text-red-400' :
                          news.bias_label === 'CENTER' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {news.bias_label}
                        </span>
                      </div>
                      {news.source_url && (
                        <a href={news.source_url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline block mb-2 truncate">
                          {news.source_url}
                        </a>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Score: {news.bias_score?.toFixed(2)}</span>
                          <span>{new Date(news.created_at).toLocaleDateString()}</span>
                        </div>
                        {(news.bias_label === 'LEFT' || news.bias_label === 'RIGHT') && (
                          <button 
                            onClick={() => handlePerspectiveSwap(news.id, news.title, news.bias_label)}
                            disabled={loadingCounter[news.id] || counterReadings[news.id]}
                            className="text-[11px] px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingCounter[news.id] ? (
                              <><div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div> Searching...</>
                            ) : (
                              counterReadings[news.id] ? "Perspectives Loaded" : "🔄 Find Counter-Readings"
                            )}
                          </button>
                        )}
                      </div>

                      {/* Perspective Swapper Results */}
                      {counterReadings[news.id] && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-white/10 overflow-hidden">
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <span>⚖️ Recommended Counter-Readings</span>
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">Perspective Swapper</span>
                          </h4>
                          <div className="grid gap-3">
                            {counterReadings[news.id].map(rec => (
                              <div key={rec.id} className="bg-[#0a0a0f] p-3 rounded-lg border border-white/5 flex flex-col gap-1 hover:border-cyan-500/30 transition-colors">
                                <div className="flex justify-between items-start">
                                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${rec.labelClass}`}>
                                    {rec.type}
                                  </span>
                                  <span className="text-xs text-gray-500">{rec.source}</span>
                                </div>
                                <p className="text-sm text-gray-200 mt-1">{rec.title}</p>
                                <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-block w-max">Read simulated article →</a>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No analysis history yet. Analyze your first article above!</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#13131a] p-6 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6">Analytics</h2>
              
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-400 mb-1">Total Articles Analyzed</p>
                <p className="text-4xl font-bold text-white">{totalArticles}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Bias Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(bias_summary || {}).map(([label, count]) => {
                    const percentage = totalArticles > 0 ? (count / totalArticles) * 100 : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300 font-medium">{label}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              label === 'LEFT' ? 'bg-blue-500' :
                              label === 'RIGHT' ? 'bg-red-500' :
                              label === 'CENTER' ? 'bg-purple-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
