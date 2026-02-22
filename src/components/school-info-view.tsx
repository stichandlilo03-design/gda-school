"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Music, ScrollText, Flag, User } from "lucide-react";

interface SchoolInfo {
  name: string;
  motto: string | null;
  primaryColor: string;
  secondaryColor: string;
  anthemLyrics: string | null;
  nationalAnthem: string | null;
  rulesText: string | null;
  countryCode: string;
}

export default function SchoolInfoView({ school }: { school: SchoolInfo }) {
  const [tab, setTab] = useState<"anthem" | "national" | "rules">("anthem");
  const [isReading, setIsReading] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const getVoice = () => {
    if (voices.length === 0) return undefined;
    // Try to match gender preference
    const langPrefix = school.countryCode === "NG" ? "en" : school.countryCode === "KE" ? "en" : school.countryCode === "ZA" ? "en" : school.countryCode === "GH" ? "en" : "en";
    const genderKeywords = voiceGender === "female" ? ["female", "woman", "zira", "samantha", "karen", "fiona", "moira", "tessa"] : ["male", "man", "david", "daniel", "james", "thomas", "fred", "alex"];
    // Try gender match first
    let v = voices.find(v => genderKeywords.some(k => v.name.toLowerCase().includes(k)) && v.lang.startsWith(langPrefix));
    if (!v) v = voices.find(v => genderKeywords.some(k => v.name.toLowerCase().includes(k)));
    if (!v) v = voices.find(v => v.lang.startsWith(langPrefix));
    return v || voices[0];
  };

  const readAloud = (text: string) => {
    if (!text.trim() || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = voiceGender === "female" ? 1.1 : 0.9;
    utter.volume = 1;
    const voice = getVoice();
    if (voice) utter.voice = voice;
    setIsReading(true);
    utter.onend = () => setIsReading(false);
    utter.onerror = () => setIsReading(false);
    window.speechSynthesis.speak(utter);
  };

  const stopReading = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setIsReading(false);
  };

  const content = tab === "anthem" ? school.anthemLyrics : tab === "national" ? school.nationalAnthem : school.rulesText;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* School Header */}
      <div className="card text-center py-6" style={{ background: `linear-gradient(135deg, ${school.primaryColor}, ${school.secondaryColor})` }}>
        <h2 className="text-xl font-bold text-white">{school.name}</h2>
        {school.motto && <p className="text-sm text-white/80 mt-1 italic">{school.motto}</p>}
      </div>

      {/* Voice Selection */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-[10px] text-gray-500 font-medium">Voice:</span>
        <button onClick={() => setVoiceGender("female")}
          className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition ${voiceGender === "female" ? "bg-pink-100 text-pink-700 ring-2 ring-pink-300" : "bg-gray-100 text-gray-500"}`}>
          <User className="w-3 h-3" /> Female
        </button>
        <button onClick={() => setVoiceGender("male")}
          className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition ${voiceGender === "male" ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300" : "bg-gray-100 text-gray-500"}`}>
          <User className="w-3 h-3" /> Male
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: "anthem" as const, label: "🎵 School Anthem", icon: Music, has: !!school.anthemLyrics },
          { key: "national" as const, label: "🏳️ National Anthem", icon: Flag, has: !!school.nationalAnthem },
          { key: "rules" as const, label: "📜 School Rules", icon: ScrollText, has: !!school.rulesText },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 text-xs py-2.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${tab === t.key ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
            {!t.has && <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card">
        {!content ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              {tab === "anthem" ? "🎵 School anthem not set yet" : tab === "national" ? "🏳️ National anthem not added yet" : "📜 School rules not set yet"}
            </p>
            <p className="text-[10px] text-gray-300 mt-1">Your principal will add this soon</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">
                {tab === "anthem" ? "🎵 School Anthem" : tab === "national" ? "🏳️ National Anthem" : "📜 School Rules"}
              </h3>
              <button onClick={() => isReading ? stopReading() : readAloud(content)}
                className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-bold transition ${isReading ? "bg-red-100 text-red-700 animate-pulse" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                {isReading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isReading ? "Stop Reading" : "🔊 Read Aloud"}
              </button>
            </div>

            {/* Reading indicator */}
            {isReading && (
              <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 bg-emerald-500 rounded-full animate-pulse" style={{ height: `${10 + Math.random() * 15}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <span className="text-xs font-medium text-emerald-700">
                  Reading with {voiceGender} voice...
                </span>
              </div>
            )}

            {/* Content display */}
            <div className={`whitespace-pre-wrap text-sm leading-relaxed ${tab === "rules" ? "text-gray-700" : "text-gray-800 text-center"}`}
              style={tab !== "rules" ? { fontFamily: "Georgia, serif", fontSize: "15px", lineHeight: "2" } : {}}>
              {content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
