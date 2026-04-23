// frontend/src/pages/QuizPage.js
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_QUESTIONS = [
  {
    question: "Which word in the headline below is an example of emotional language?",
    snippet: '"The OUTRAGEOUS decision by lawmakers to cut healthcare funding."',
    options: ["decision", "lawmakers", "OUTRAGEOUS", "funding"],
    correct: 2,
    explanation: "'OUTRAGEOUS' is emotionally loaded language designed to provoke anger rather than inform.",
  },
  {
    question: "What type of bias is present in the following statement?",
    snippet: '"Everyone knows the current government has failed."',
    options: ["Slant Bias", "Opinion as Fact", "Sensationalism", "Omission Bias"],
    correct: 1,
    explanation: "'Everyone knows' presents an opinion as universally accepted fact without evidence.",
  },
  {
    question: "Which sentence below is the most neutral way to report the same event?",
    snippet: "A new economic policy was announced.",
    options: [
      "The disastrous new policy will destroy jobs.",
      "The revolutionary policy will save thousands.",
      "The government announced a new economic policy affecting employment.",
      "Corrupt officials pushed through a harmful economic measure.",
    ],
    correct: 2,
    explanation: "Option C presents facts without emotional adjectives or loaded language.",
  },
];

export default function QuizPage({ currentUser }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const article = state?.article;

  const [questions, setQuestions] = useState(SAMPLE_QUESTIONS);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === questions[current].correct;
    if (correct) {
      setScore((s) => s + 1);
      setPointsEarned((p) => p + 10);
    }
    setAnswers((a) => [...a, { idx, correct }]);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      submitScore();
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const submitScore = async () => {
    if (!currentUser) return;
    try {
      await fetch("http://127.0.0.1:8000/user/quiz-complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: Math.round((score / questions.length) * 100),
          questions: questions.length,
        }),
      });
    } catch {}
  };

  const pct = Math.round((score / questions.length) * 100);
  const q = questions[current];
  const progress = ((current + (answered ? 1 : 0)) / questions.length) * 100;

  if (finished) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10"
        >
          <div className="text-7xl mb-5">
            {pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "📚"}
          </div>
          <h2
            className="text-3xl font-extrabold text-white mb-2"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Quiz Complete!
          </h2>
          <p className="text-gray-400 mb-8">
            You got{" "}
            <span className="text-white font-bold">
              {score}/{questions.length}
            </span>{" "}
            correct
          </p>

          {/* Score ring */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171"}
                strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-2xl font-black text-white"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {pct}%
              </span>
            </div>
          </div>

          {currentUser && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
              <p className="text-amber-400 font-bold text-lg">+{pointsEarned} points earned! ⚡</p>
              <p className="text-gray-500 text-xs mt-1">Added to your profile</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={() => navigate("/feed")} className="btn-primary w-full py-3">
              Back to Feed
            </button>
            <button
              onClick={() => { setCurrent(0); setScore(0); setFinished(false); setAnswered(false); setSelected(null); setAnswers([]); setPointsEarned(0); }}
              className="w-full border border-white/10 hover:border-white/20 text-gray-400 hover:text-white py-3 rounded-xl font-medium transition-all text-sm"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1
            className="text-xl font-extrabold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            🧠 Bias Detection Quiz
          </h1>
          <span className="text-sm text-gray-500">
            {current + 1} / {questions.length}
          </span>
        </div>
        {article && (
          <p className="text-xs text-gray-600 mb-3 truncate">
            Based on: {article.title}
          </p>
        )}
        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="glass-card p-7"
        >
          <p className="text-white font-semibold text-lg mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            {q.question}
          </p>

          {q.snippet && (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6 italic text-gray-300 text-sm">
              {q.snippet}
            </div>
          )}

          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let style = "border-white/10 bg-white/[0.02] text-gray-300 hover:border-cyan-500/30 hover:bg-white/[0.05]";
              if (answered) {
                if (idx === q.correct) style = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                else if (idx === selected && idx !== q.correct) style = "border-red-500/50 bg-red-500/10 text-red-300";
                else style = "border-white/5 bg-white/[0.01] text-gray-600 opacity-50";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-sm font-medium ${style} ${!answered ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="text-gray-600 mr-3 text-xs">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
              >
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                  Explanation
                </p>
                <p className="text-gray-300 text-sm">{q.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {answered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleNext}
              className="btn-primary w-full mt-5 py-3"
            >
              {current + 1 >= questions.length ? "See Results" : "Next Question →"}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Score tracker */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
        <span>Score: {score}/{current + (answered ? 1 : 0)} correct</span>
        <span>⚡ {score * 10} pts earned</span>
      </div>
    </div>
  );
}