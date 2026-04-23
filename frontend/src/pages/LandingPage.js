// frontend/src/pages/LandingPage.js
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🧠",
    title: "BERT-Powered Detection",
    desc: "Our hybrid AI model combines transformer-based classification with rule-based NLP for unmatched accuracy.",
  },
  {
    icon: "🔍",
    title: "Explainable AI",
    desc: "See exactly which words and phrases contribute to bias with SHAP-style visual token highlighting.",
  },
  {
    icon: "🎮",
    title: "Gamified Learning",
    desc: "Earn points, maintain streaks, and climb the leaderboard while becoming a media literacy expert.",
  },
  {
    icon: "📡",
    title: "Real-Time News Feed",
    desc: "Browse live articles filtered for political neutrality, sourced from trusted outlets worldwide.",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "Track bias trends over time, visualize topic distributions, and measure your own reading habits.",
  },
  {
    icon: "🧩",
    title: "Interactive Quizzes",
    desc: "Test your ability to detect bias with AI-generated quizzes after every article you read.",
  },
];

const stats = [
  { value: "94%", label: "Detection Accuracy" },
  { value: "10k+", label: "Articles Analyzed" },
  { value: "3", label: "Bias Models" },
  { value: "50+", label: "Source Domains" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LandingPage({ onSignIn, currentUser }) {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Hero ── */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wider uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          AI-Powered Media Bias Detection
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Read the News
          <br />
          <span className="gradient-text">Without the Spin.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          FairFeed uses a hybrid BERT + rule-based AI to detect political bias in real-time news,
          explain its reasoning visually, and gamify your path to media literacy.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {currentUser ? (
            <button
              onClick={() => navigate("/feed")}
              className="btn-primary text-base px-8 py-3.5"
            >
              Go to Feed →
            </button>
          ) : (
            <button onClick={onSignIn} className="btn-primary text-base px-8 py-3.5">
              Get Started Free →
            </button>
          )}
          <button
            onClick={() => navigate("/feed")}
            className="border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold transition-all text-base"
          >
            Browse News
          </button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-3xl font-extrabold gradient-text mb-1"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {s.value}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2
            className="text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Everything You Need
          </h2>
          <p className="text-gray-500">Built for critical thinkers, journalists, and curious minds.</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="glass-card p-6 hover:border-cyan-500/20 transition-all group cursor-default"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">
                {f.icon}
              </div>
              <h3
                className="text-white font-bold text-lg mb-2"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative glass-card p-12 text-center overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 70%)",
            }}
          />
          <h2
            className="text-4xl font-extrabold text-white mb-4 relative z-10"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Start Reading Smarter
          </h2>
          <p className="text-gray-400 mb-8 relative z-10 max-w-xl mx-auto">
            Join thousands of readers who use FairFeed to cut through media noise and find the
            truth behind every headline.
          </p>
          {currentUser ? (
            <button
              onClick={() => navigate("/analyze")}
              className="btn-primary text-base px-10 py-4 relative z-10"
            >
              Analyze an Article →
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="btn-primary text-base px-10 py-4 relative z-10"
            >
              Create Free Account →
            </button>
          )}
        </motion.div>
      </section>
    </div>
  );
}