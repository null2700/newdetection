// frontend/src/pages/ArticleDetail.js
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ArticleDetail({ currentUser }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.url) {
      fetch(`http://127.0.0.1:8000/article-detail?url=${encodeURIComponent(state.url)}`)
        .then((r) => r.json())
        .then((d) => {
          setData(d);
          setLoading(false);
          if (currentUser) markArticleAsRead();
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [state?.url]);

  const markArticleAsRead = async () => {
    try {
      await fetch("http://127.0.0.1:8000/user/article-read", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  };

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 gap-4">
        <div className="text-5xl">📭</div>
        <p className="text-lg">No article selected.</p>
        <button
          onClick={() => navigate("/feed")}
          className="btn-primary"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyan-400" />
      </div>
    );
  }

  const biasCount = data?.biases?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Article Column ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 glass-card p-8"
      >
        {/* Back */}
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-cyan-400 text-sm mb-6 transition-colors"
        >
          ← Back to Feed
        </button>

        <h1
          className="text-3xl font-extrabold text-white mb-4 leading-tight"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {state.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-white/5">
          <span className="text-gray-300 font-medium">{state.source}</span>
          <span>·</span>
          <span>
            {state.publishedAt
              ? new Date(state.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : ""}
          </span>
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-500 hover:text-cyan-400 font-medium ml-auto"
          >
            Read Original ↗
          </a>
        </div>

        {/* Body */}
        <div
          className="article-prose"
          dangerouslySetInnerHTML={{
            __html:
              data?.highlighted ||
              data?.text ||
              "<p>No article content available.</p>",
          }}
        />

        {/* Quiz CTA */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-center"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 70%)",
              }}
            />
            <h3
              className="text-xl font-bold text-white mb-2 relative z-10"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              🎯 Test Your Understanding
            </h3>
            <p className="text-gray-400 mb-5 text-sm relative z-10">
              Take an AI-generated quiz to reinforce your learning and earn points.
            </p>
            <button
              onClick={() =>
                navigate("/article/quiz", { state: { article: state } })
              }
              className="btn-primary relative z-10"
            >
              Start Quiz 🧠
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Bias Sidebar ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6 h-fit sticky top-24"
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Bias Analysis
          </h2>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              biasCount === 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-orange-500/10 text-orange-400 border-orange-500/20"
            }`}
          >
            {biasCount === 0 ? "Clean" : `${biasCount} found`}
          </span>
        </div>

        {biasCount === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white font-semibold mb-1">No biases detected</p>
            <p className="text-gray-500 text-sm">
              This article appears balanced and neutral.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.biases.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="border border-white/5 rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-cyan-500/10 text-cyan-400 text-xs font-bold px-2 py-0.5 rounded">
                    #{i + 1}
                  </span>
                  <h3 className="text-cyan-400 font-semibold text-sm">{b.type}</h3>
                </div>
                <p className="text-gray-400 italic text-xs mb-3 pl-2 border-l border-white/10">
                  "{b.example}"
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Intensity</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-red-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(b.score * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-orange-400">
                    {(b.score * 100).toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wider">Highlight Legend</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <mark className="bias-highlight text-xs">highlighted text</mark>
            <span>= detected bias</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}