// frontend/src/pages/SettingsPage.js
import { useState } from "react";
import { motion } from "framer-motion";

const Section = ({ title, children }) => (
  <div className="glass-card p-6 mb-4">
    <h2
      className="text-base font-bold text-white mb-5 pb-4 border-b border-white/5"
      style={{ fontFamily: "Syne, sans-serif" }}
    >
      {title}
    </h2>
    {children}
  </div>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div>
      <p className="text-sm text-gray-200 font-medium">{label}</p>
      {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all ${
        value ? "bg-cyan-500" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default function SettingsPage({ currentUser }) {
  const [notifications, setNotifications] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [quizReminders, setQuizReminders] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-white mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Settings
        </h1>
        <p className="text-gray-500 text-sm">Customize your FairFeed experience.</p>
      </div>

      {currentUser && (
        <Section title="Account">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={currentUser.name}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">
                Email
              </label>
              <input
                type="email"
                defaultValue={currentUser.email}
                disabled
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </Section>
      )}

      <Section title="Preferences">
        <Toggle
          label="Dark Mode"
          desc="Use the dark color scheme (recommended)"
          value={darkMode}
          onChange={setDarkMode}
        />
        <Toggle
          label="Auto-Analyze on Visit"
          desc="Automatically run bias detection when opening an article"
          value={autoAnalyze}
          onChange={setAutoAnalyze}
        />
      </Section>

      <Section title="Notifications">
        <Toggle
          label="Push Notifications"
          desc="Get alerts for new unbiased articles"
          value={notifications}
          onChange={setNotifications}
        />
        <Toggle
          label="Daily Quiz Reminders"
          desc="Remind me to take a quiz each day"
          value={quizReminders}
          onChange={setQuizReminders}
        />
      </Section>

      <Section title="Danger Zone">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-400 font-medium">Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all data.</p>
          </div>
          <button className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all font-semibold">
            Delete
          </button>
        </div>
      </Section>

      <motion.button
        onClick={handleSave}
        className="btn-primary px-8 py-3 w-full"
        whileTap={{ scale: 0.97 }}
      >
        {saved ? "✓ Saved!" : "Save Settings"}
      </motion.button>
    </div>
  );
}