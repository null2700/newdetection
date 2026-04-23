// frontend/src/pages/AnalyzePage.js
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BIAS_LABEL_COLORS = {
  left: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", label: "Left Leaning" },
  center: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", label: "Neutral / Center" },
  right: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: "Right Leaning" },
  neutral: { bg: "bg-gray-500/10", border: "border-gray-500/20", text: "text-gray-400", label: "Neutral" },
};

export default function AnalyzePage({ currentUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("url"); // "url" | "paste"
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let data;
      if (mode === "url" && url.trim()) {
        const res = await fetch(
          `http://127.0.0.1:8000/article-detail?url=${encodeURIComponent(url.trim())}`
        );
        data = await res.json();
      } else if (mode === "paste" && text.trim()) {
        const res = await fetch("http://127.0.0.1:8000/analyze-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
        data = await res.json();
      } else {
        setError("Please enter a URL or paste some text.");
        setLoading(false);
        return;
      }
      setResult(data);
      if (currentUser) {
        await fetch("http://127.0.0.1:8000/user/article-read", {
          method: "POST",
          credentials: "include",
        });
      }
    } catch (err) {
      setError("Analysis failed. Check your input and try again.");
    }
    setLoading(false);
  };

  const biasStyle = BIAS_LABEL_COLORS[result?.political_bias] || BIAS_LABEL_COLORS["neutral"];
  const overallBiasCount = result?.biases?.length || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-white mb-2"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Analyze an Article
        </h1>
        <p className="text-gray-500 text-sm">
          Paste a URL or article text to run our full bias detection pipeline.
        </p>
      </div>

      {/* Input Card */}
      <div className="glass-card p-6 mb-8">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5 p-1 bg-white/5 rounded-xl w-fit">
          {["url", "paste"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                mode === m
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {m === "url" ? "🔗 URL" : "📋 Paste Text"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "url" ? (
            <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">
                Article URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.thehindu.com/article/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
            </motion.div>
          ) : (
            <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">
                Article Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full article text here for analysis…"
                rows={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-3 text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary mt-5 px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black" />
              Analyzing…
            </>
          ) : (
            "Run Bias Analysis →"
          )}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary Row */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className={`glass-card p-5 border ${biasStyle.border} ${biasStyle.bg}`}>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Political Lean</p>
                <p className={`text-2xl font-extrabold ${biasStyle.text}`} style={{ fontFamily: "Syne, sans-serif" }}>
                  {biasStyle.label}
                </p>
                {result.confidence != null && (
                  <p className="text-xs text-gray-600 mt-1">
                    Confidence: {(result.confidence * 100).toFixed(0)}%
                  </p>
                )}
              </div>
              <div className="glass-card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bias Patterns</p>
                <p className="text-2xl font-extrabold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                  {overallBiasCount}
                </p>
                <p className="text-xs text-gray-600 mt-1">detected instances</p>
              </div>
              <div className="glass-card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Article Length</p>
                <p className="text-2xl font-extrabold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                  {result.text ? Math.round(result.text.split(" ").length / 200) : 0} min
                </p>
                <p className="text-xs text-gray-600 mt-1">estimated read</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Article Text */}
              <div className="lg:col-span-2 glass-card p-6">
                <h2
                  className="text-lg font-bold text-white mb-4"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  Article Content{" "}
                  {overallBiasCount > 0 && (
                    <span className="text-xs text-yellow-400 font-normal ml-2">
                      (highlighted text = detected bias)
                    </span>
                  )}
                </h2>
                <div
                  className="article-prose max-h-[500px] overflow-y-auto pr-2"
                  dangerouslySetInnerHTML={{
                    __html:
                      result.highlighted ||
                      result.text ||
                      "<p>No content available.</p>",
                  }}
                />
              </div>

              {/* Bias Details */}
              <div className="glass-card p-6 h-fit">
                <h2
                  className="text-lg font-bold text-white mb-4"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  Detected Patterns
                </h2>
                {overallBiasCount === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-white font-semibold text-sm">No strong biases</p>
                    <p className="text-gray-500 text-xs mt-1">Article appears balanced.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.biases.map((b, i) => (
                      <div
                        key={i}
                        className="border border-white/5 rounded-xl p-4 bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-semibold">
                            {b.type}
                          </span>
                        </div>
                        <p className="text-gray-500 italic text-xs mb-2">"{b.example}"</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 rounded-full h-1">
                            <div
                              className="bg-orange-400 h-1 rounded-full"
                              style={{ width: `${Math.min(b.score * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-orange-400 font-bold">
                            {(b.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentUser && (
                  <button
                    onClick={() =>
                      navigate("/quiz", {
                        state: { article: { title: url || "Analyzed Article" } },
                      })
                    }
                    className="btn-primary w-full mt-6 py-3 text-sm"
                  >
                    Test Your Understanding 🧠
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}