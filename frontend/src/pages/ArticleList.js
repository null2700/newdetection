// frontend/src/pages/ArticleList.js
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function SkeletonCard() {
  return (
    <div className="glass-card p-6">
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="skeleton h-5 w-full mb-2" />
      <div className="skeleton h-5 w-3/4 mb-4" />
      <div className="skeleton h-4 w-1/2 mb-6" />
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-3 w-12" />
      </div>
    </div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const getBiasColor = (confidence) => {
  if (confidence > 0.8) return { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" };
  if (confidence > 0.6) return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" };
  return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" };
};

export default function ArticleList({ articles, loading, currentUser }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="skeleton h-8 w-56 mb-3" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center mt-24 px-6">
        <div className="text-7xl mb-5">📰</div>
        <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
          No Articles Found
        </h3>
        <p className="text-gray-500">Refresh to load the latest unbiased news.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-extrabold text-white mb-1"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Unbiased News Feed
          </h1>
          <p className="text-gray-500 text-sm">
            {articles.length} articles verified for political neutrality
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live · Updated just now
        </div>
      </div>

      {/* Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {articles.map((art, i) => {
          const bias = getBiasColor(art.confidence);
          return (
            <motion.div
              key={i}
              variants={cardAnim}
              onClick={() => navigate("/article", { state: art })}
              className="glass-card p-6 cursor-pointer hover:border-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/5 transition-all group relative flex flex-col"
            >
              {/* Confidence badge */}
              <div
                className={`absolute top-4 right-4 ${bias.bg} ${bias.border} border ${bias.text} text-xs font-bold px-2.5 py-1 rounded-full`}
              >
                {(art.confidence * 100).toFixed(0)}% Neutral
              </div>

              {/* Source chip */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-xs">
                  {art.source?.charAt(0) || "N"}
                </span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {art.source}
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-white font-semibold text-base leading-snug mb-3 group-hover:text-cyan-400 transition-colors flex-1 pr-16"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {art.title?.length > 110 ? art.title.slice(0, 110) + "…" : art.title}
              </h3>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <span className="text-xs text-gray-600">
                  {art.publishedAt
                    ? new Date(art.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </span>
                <a
                  href={art.url}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-500 hover:text-cyan-400 text-xs font-semibold flex items-center gap-1"
                >
                  Source ↗
                </a>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}