// frontend/src/pages/Dashboard.js
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Mock / demo data ──────────────────────────────────────────────────────────
const WEEKLY_BIAS = [
  { day: "Mon", left: 3, center: 8, right: 2 },
  { day: "Tue", left: 5, center: 6, right: 4 },
  { day: "Wed", left: 2, center: 10, right: 1 },
  { day: "Thu", left: 4, center: 7, right: 3 },
  { day: "Fri", left: 6, center: 5, right: 5 },
  { day: "Sat", left: 1, center: 9, right: 0 },
  { day: "Sun", left: 3, center: 8, right: 2 },
];

const TOPIC_BIAS = [
  { topic: "Politics", score: 72 },
  { topic: "Economy", score: 45 },
  { topic: "Climate", score: 58 },
  { topic: "Tech", score: 22 },
  { topic: "Sports", score: 11 },
  { topic: "Health", score: 34 },
];

const DISTRIBUTION = [
  { name: "Left", value: 24, color: "#60a5fa" },
  { name: "Center", value: 53, color: "#34d399" },
  { name: "Right", value: 23, color: "#f87171" },
];

const READING_TREND = Array.from({ length: 14 }, (_, i) => ({
  day: `D-${13 - i}`,
  articles: Math.floor(Math.random() * 6 + 1),
  score: Math.floor(Math.random() * 40 + 60),
}));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#13131a] border border-white/10 rounded-xl p-3 text-xs text-gray-300 shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const StatTile = ({ label, value, sub, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-5"
  >
    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
    <p
      className={`text-3xl font-extrabold mb-0.5 ${color}`}
      style={{ fontFamily: "Syne, sans-serif" }}
    >
      {value}
    </p>
    {sub && <p className="text-xs text-gray-600">{sub}</p>}
  </motion.div>
);

export default function Dashboard({ currentUser }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetch("http://127.0.0.1:8000/user/stats", { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { setUserStats(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-white mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Analytics Dashboard
        </h1>
        <p className="text-gray-500 text-sm">
          {currentUser ? `Welcome back, ${currentUser.name} — ` : ""}
          Live bias trends and your reading insights.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Articles Analyzed" value={userStats?.articles_read ?? "—"} sub="all time" color="text-cyan-400" />
        <StatTile label="Avg Bias Score" value="38%" sub="across feed" color="text-yellow-400" />
        <StatTile label="Quizzes Taken" value={userStats?.quizzes_given ?? "—"} sub="total" color="text-emerald-400" />
        <StatTile label="Current Streak" value={userStats?.reading_streak ?? "—"} sub="days 🔥" color="text-orange-400" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Bias Distribution */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2
            className="text-base font-bold text-white mb-5"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Weekly Bias Distribution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY_BIAS} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="left" name="Left" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="center" name="Center" fill="#34d399" radius={[3, 3, 0, 0]} />
              <Bar dataKey="right" name="Right" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bias Pie */}
        <div className="glass-card p-6 flex flex-col">
          <h2
            className="text-base font-bold text-white mb-5"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Lean Distribution
          </h2>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DISTRIBUTION.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [`${v}%`, n]}
                  contentStyle={{ background: "#13131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {DISTRIBUTION.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name} {d.value}%
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reading trend */}
        <div className="glass-card p-6">
          <h2
            className="text-base font-bold text-white mb-5"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Reading Activity (14 Days)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={READING_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="articles"
                name="Articles"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ fill: "#22d3ee", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Most biased topics */}
        <div className="glass-card p-6">
          <h2
            className="text-base font-bold text-white mb-5"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Most Biased Topics
          </h2>
          <div className="space-y-3">
            {TOPIC_BIAS.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-16 shrink-0">{t.topic}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.score}%` }}
                    transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
                    className="h-2 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${
                        t.score > 60 ? "#f87171" : t.score > 35 ? "#fbbf24" : "#34d399"
                      } 0%, ${
                        t.score > 60 ? "#ef4444" : t.score > 35 ? "#f59e0b" : "#10b981"
                      } 100%)`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{t.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!currentUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 glass-card p-5 text-center border border-cyan-500/20"
        >
          <p className="text-gray-400 text-sm">
            📊 Sign in to see your personal reading stats and quiz performance.
          </p>
        </motion.div>
      )}
    </div>
  );
}