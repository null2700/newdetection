// frontend/src/pages/Profile.js
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

const StatCard = ({ value, label, color, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-card p-5 border-l-2 ${color}`}
  >
    <div className="text-2xl mb-1">{icon}</div>
    <div
      className="text-3xl font-extrabold text-white mb-0.5"
      style={{ fontFamily: "Syne, sans-serif" }}
    >
      {value}
    </div>
    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
  </motion.div>
);

export default function Profile({ currentUser }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/user/stats", { credentials: "include" });
      if (res.ok) setUserStats(await res.json());
    } catch {}
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyan-400" />
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="max-w-xl mx-auto text-center mt-24 px-6">
        <p className="text-gray-500">Unable to load profile. Please try again.</p>
      </div>
    );
  }

  const today = new Date();
  const heatmapData =
    userStats.heatmap_data?.length > 0
      ? userStats.heatmap_data
      : Array.from({ length: 365 }, (_, i) => {
          const d = new Date();
          d.setDate(today.getDate() - i);
          return { date: d.toISOString().split("T")[0], count: Math.floor(Math.random() * 4) };
        });

  const avgScore =
    userStats.quiz_data?.length > 0
      ? Math.round(userStats.quiz_data.reduce((a, q) => a + q.score, 0) / userStats.quiz_data.length)
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-cyan-500/20">
            {userStats.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1
              className="text-2xl font-extrabold text-white"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {userStats.name}
            </h1>
            <p className="text-gray-500 text-sm">{currentUser?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {userStats.badges?.map((badge, i) => (
                <span
                  key={i}
                  className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 px-8 py-4 rounded-2xl">
          <div
            className="text-4xl font-black gradient-text"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            #{userStats.rank}
          </div>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Global Rank</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard value={userStats.articles_read} label="Articles Read" color="border-cyan-500" icon="📰" />
        <StatCard value={userStats.quizzes_given} label="Quizzes Taken" color="border-emerald-500" icon="🧩" />
        <StatCard value={`${avgScore}%`} label="Avg Quiz Score" color="border-yellow-500" icon="🎯" />
        <StatCard value={userStats.reading_streak} label="Day Streak" color="border-orange-500" icon="🔥" />
      </div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mb-6"
      >
        <h2
          className="text-lg font-bold text-white mb-4"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Reading Activity 📅
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <CalendarHeatmap
              startDate={new Date(today.getFullYear(), 0, 1)}
              endDate={new Date(today.getFullYear(), 11, 31)}
              values={heatmapData}
              classForValue={(v) => {
                if (!v || v.count === 0) return "color-empty";
                return `color-scale-${Math.min(v.count, 4)}`;
              }}
              tooltipDataAttrs={(v) => ({
                "data-tip": v?.date
                  ? `${v.date}: ${v.count} article${v.count !== 1 ? "s" : ""} read`
                  : "No data",
              })}
              gutterSize={3}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
          <span>Less</span>
          {["color-empty", "color-scale-1", "color-scale-2", "color-scale-3", "color-scale-4"].map((c) => (
            <span key={c} className={`w-3 h-3 rounded-sm react-calendar-heatmap-${c}`} />
          ))}
          <span>More</span>
        </div>
      </motion.div>

      {/* Quiz History */}
      {userStats.quiz_data?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2
            className="text-lg font-bold text-white mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Quiz History
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="p-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">Quiz</th>
                  <th className="p-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">Score</th>
                  <th className="p-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {userStats.quiz_data.map((quiz, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-gray-300">#{quiz.id || idx + 1}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          quiz.score >= 80
                            ? "bg-emerald-500/10 text-emerald-400"
                            : quiz.score >= 50
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {quiz.score}%
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{quiz.winRate || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}