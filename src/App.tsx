import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Award, 
  Grid,
  ChevronRight,
  BookOpen,
  Info,
  Compass,
  MapPin,
  Phone,
  Instagram,
  MessageCircle,
  Smartphone,
  Download
} from "lucide-react";
import PublicLookup from "./components/PublicLookup";
import AdminPanel from "./components/AdminPanel";
import { getClubLogoBase64 } from "./components/LogoGenerator";

const ADMIN_CREDS = {
  mode: "admin",
  pass: "MJ2027", // Customizable Administrator Password
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialExamParam, setInitialExamParam] = useState("");
  const [initialTabParam, setInitialTabParam] = useState<"search" | "register">("search");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isDevelopmentUrl, setIsDevelopmentUrl] = useState(false);

  useEffect(() => {
    // Determine if user is accessing workspace via developer urls
    if (typeof window !== "undefined") {
      const isDev = window.location.origin.includes("aistudio.google.com") || 
                    window.location.origin.includes("ais-dev-") ||
                    window.location.origin.includes("localhost");
      setIsDevelopmentUrl(isDev);
    }

    // Parse query params on load
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode") || "";
    const pass = params.get("pass") || "";
    const exam = params.get("exam") || "";
    const tab = params.get("tab") || "";

    if (mode === ADMIN_CREDS.mode && pass === ADMIN_CREDS.pass) {
      setIsAdmin(true);
    }
    if (exam) {
      setInitialExamParam(exam);
    }
    if (tab === "register") {
      setInitialTabParam("register");
    } else {
      setInitialTabParam("search");
    }
  }, []);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (enteredPassword === ADMIN_CREDS.pass) {
      setIsAdmin(true);
      setShowPasswordModal(false);
      setEnteredPassword("");
      // Sync URL parameter in place for consistent session state without reload
      const newUrl = `${window.location.origin}${window.location.pathname}?mode=admin&pass=${ADMIN_CREDS.pass}`;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    } else {
      setModalError("Invalid Administrative Passcode. Keep training!");
    }
  };

  const handleSignOut = () => {
    setIsAdmin(false);
    // Clear URL parameters
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 border-8 border-slate-900 flex flex-col selection:bg-red-600 selection:text-white">

      {/* Top Universal Banner */}
      <header className="h-20 border-b-2 border-slate-900 flex items-center justify-between px-6 md:px-10 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white border-2 border-slate-900 flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0 p-0.5">
            <img 
              src={getClubLogoBase64()} 
              alt="Lions Karate Club Pune Logo" 
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tighter leading-none uppercase text-slate-900 font-space">
              LIONS KARATE CLUB PUNE
            </h1>
            <span className="text-[9px] tracking-[0.2em] font-extrabold text-red-700 uppercase">
              RANK REGISTRY • EXAM PORTAL
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 h-full">

          <div className="hidden md:flex h-full items-center border-r border-slate-200 pr-6 mr-3">
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">EXAM PORTAL V2.4</span>
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-emerald-50 border-2 border-slate-900 px-3 py-1.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wide font-space">
                Admin Authorized
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 border-2 border-slate-900 text-[10px] font-black tracking-widest hover:bg-slate-900 hover:text-white transition-colors bg-white cursor-pointer uppercase shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
            >
              Admin Sign-In
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        {isAdmin ? (
          <AdminPanel onSignOut={handleSignOut} />
        ) : (
          <PublicLookup initialExamParam={initialExamParam} initialTabParam={initialTabParam} />
        )}
      </main>

      {/* Dojo Creed Footer banner */}
      <footer className="bg-white border-t-2 border-slate-900 py-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border-2 border-slate-900 p-6 bg-slate-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-900 mb-3 font-space flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-700 inline-block rotate-45"></span> Dojo Kun (Creed)
            </h4>
            <ul className="text-slate-700 text-[11px] leading-relaxed font-bold uppercase tracking-wide space-y-2">
              <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 text-red-600 shrink-0" /> Character, Seek perfection.</li>
              <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 text-red-650 shrink-0" /> Sincerity, Be faithful.</li>
              <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 text-red-650 shrink-0" /> Effort, Endeavor to excel.</li>
              <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 text-red-650 shrink-0" /> Etiquette, Respect others.</li>
              <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 text-red-650 shrink-0" /> Control, Refrain from violent behavior.</li>
            </ul>
          </div>
          <div className="md:col-span-2 text-slate-800 flex flex-col justify-between gap-6">
            <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-[10px] font-black text-red-700 uppercase tracking-widest mb-3 font-space">
                  DOJO LOCATION
                </span>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4.5 w-4.5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <address className="not-italic text-xs font-black text-slate-900 uppercase leading-snug">
                      MANAJI NAGAR, NARHE, PUNE
                    </address>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                      LIONS KARATE CLUB, MAHARASHTRA, INDIA
                    </p>
                  </div>
                </div>

                <span className="block text-[10px] font-black text-red-700 uppercase tracking-widest mb-3 mt-5 font-space">
                  CONTACT NUMBER
                </span>
                <a 
                  href="tel:+919049688172" 
                  className="inline-flex items-center gap-2 text-slate-900 hover:text-red-700 transition-colors group cursor-pointer"
                >
                  <Phone className="h-4 w-4 text-slate-900 group-hover:text-red-700 shrink-0" />
                  <span className="text-xs font-black tracking-widest uppercase font-mono">
                    +91 90496 88172
                  </span>
                </a>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l-2 border-slate-900 pt-5 sm:pt-0 sm:pl-6 flex flex-col justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-black text-red-700 uppercase tracking-widest mb-3 font-space">
                    FOLLOW & CHAT WITH US
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <a 
                      href="https://www.instagram.com/lions_karate_club_pune?igsh=MTdpeHVjeTFkeTd6aw==" 
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-2.5 bg-slate-50 hover:bg-slate-900 text-slate-900 hover:text-white border-2 border-slate-900 px-3 py-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none duration-150"
                    >
                      <Instagram className="h-4 w-4 shrink-0" />
                      <span className="text-[9px] font-black tracking-widest uppercase">
                        INSTAGRAM PAGE
                      </span>
                    </a>
                    
                    <a 
                      href="https://wa.me/919049688172" 
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white border-2 border-slate-900 px-3 py-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none duration-150"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600 hover:text-white" />
                      <span className="text-[9px] font-black tracking-widest uppercase">
                        WHATSAPP CHAT
                      </span>
                    </a>
                  </div>
                </div>

                <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">
                  Lions Karate Club Pune teaches traditional Shotokan Karate-Do, focusing on physical fitness, self-defense, and mental discipline.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-200 pt-4 gap-2">
              <div className="flex space-x-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-900"></div>
                  <span className="text-[9px] font-black tracking-widest uppercase text-slate-600">DOJO SYSTEM: ACTIVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500"></div>
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-600">VERIFIED RECORDS</span>
                </div>
              </div>
              <p className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                © 2026 Lions Karate Club Pune — Authorized Records Panel
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Passcode Admin Entry Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-sm p-6 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 font-space">
                <Lock className="h-4 w-4 text-red-650" /> Administrative Access
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setEnteredPassword("");
                  setModalError("");
                }}
                className="text-slate-500 hover:text-slate-900 text-xs font-black leading-none border-2 border-slate-950 px-1.5 py-0.5 bg-slate-50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-space">
                  Enter Secure Instructor Passcode
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-center text-lg font-bold text-slate-950 outline-none focus:bg-white focus:border-red-650 transition rounded-none uppercase font-mono"
                  autoFocus
                />
              </div>

              {modalError && (
                <p className="text-xs font-extrabold text-red-700 text-center animate-shake">
                  {modalError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-none border-2 border-slate-900 cursor-pointer transition-colors"
              >
                Verify & Enter Console
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile App Download & Installation Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-lg p-6 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] text-slate-900 relative">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 font-space">
                <Smartphone className="h-5 w-5 text-red-650" /> Install Portal as Mobile App
              </h3>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-slate-500 hover:text-slate-900 text-xs font-black leading-none border-2 border-slate-950 px-2 py-1 bg-slate-50 transition cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-5">
              <p className="text-xs text-slate-700 font-bold leading-relaxed uppercase">
                You can download and install this Exam portal as a dedicated mobile App directly on your Apple iOS or Android smartphone. It is lightweight, starts up instantly, and runs in full screen mode like a native app!
              </p>

              {/* Instructions container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* iOS Option */}
                <div className="border-2 border-slate-900 p-4 bg-slate-50 relative">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900 text-white font-mono text-[8px] font-black uppercase tracking-widest leading-none">iOS / Safari</div>
                  <h4 className="font-black text-xs uppercase text-slate-950 tracking-wide mb-3 mt-1 pr-12 flex items-center gap-1.5">
                    📱 Apple iPhone
                  </h4>
                  <ol className="text-[10px] leading-relaxed font-bold uppercase tracking-wider text-slate-700 space-y-2">
                    <li className="flex gap-1.5"><span className="text-red-700 font-black">1.</span> Open Safari and go to the public link below.</li>
                    <li className="flex gap-1.5"><span className="text-red-700 font-black">2.</span> Tap the <strong className="text-slate-950 font-black">"Share"</strong> icon (square with upward arrow) at Safari's bottom bar.</li>
                    <li className="flex gap-1.5"><span className="text-red-700 font-black">3.</span> Scroll down and tap <strong className="text-slate-950 font-black">"Add to Home Screen"</strong>.</li>
                    <li className="flex gap-1.5"><span className="text-red-700 font-black">4.</span> Tap <strong className="text-slate-950 font-black">"Add"</strong>. The app icon will appear instantly!</li>
                  </ol>
                </div>

                {/* Android Option */}
                <div className="border-2 border-slate-900 p-4 bg-slate-50 relative">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-600 text-white font-mono text-[8px] font-black uppercase tracking-widest leading-none">Android / Chrome</div>
                  <h4 className="font-black text-xs uppercase text-slate-950 tracking-wide mb-3 mt-1 pr-16 flex items-center gap-1.5">
                    🤖 Android Phone
                  </h4>
                  <ol className="text-[10px] leading-relaxed font-bold uppercase tracking-wider text-slate-700 space-y-2">
                    <li className="flex gap-1.5"><span className="text-emerald-600 font-black">1.</span> Open Chrome and paste the public link below.</li>
                    <li className="flex gap-1.5"><span className="text-emerald-600 font-black">2.</span> Tap the <strong className="text-slate-950 font-black">3 dots menu</strong> icon in the top right corner.</li>
                    <li className="flex gap-1.5"><span className="text-emerald-600 font-black">3.</span> Tap <strong className="text-slate-950 font-black">"Install app"</strong> or <strong className="text-slate-950 font-black">"Add to Home screen"</strong>.</li>
                    <li className="flex gap-1.5"><span className="text-emerald-600 font-black">4.</span> Follow the prompt. The app is ready to launch on your screen!</li>
                  </ol>
                </div>
              </div>

              {/* Direct Link Info */}
              <div className="border-2 border-red-700 p-4 bg-red-50 text-slate-900">
                <span className="block text-[9px] font-black text-red-700 uppercase tracking-widest leading-none mb-1.5 font-space">
                  ⭐ ENSURE YOU INSTALL THIS EXACT PUBLIC LINK:
                </span>
                <div className="font-mono text-[10px] sm:text-xs font-black text-slate-950 bg-white p-2.5 border border-slate-950 select-all break-all text-center">
                  https://ais-pre-v7edj3kbk73xoblxzmtdoi-683048240716.asia-southeast1.run.app
                </div>
                <p className="text-[9px] font-bold text-red-800 uppercase leading-normal mt-2">
                  ⚠️ WARNING: Opening the app in standard Google preview (aistudio.google.com) on mobile will result in a 403 authorization error. Always install and access via the public link above!
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("https://ais-pre-v7edj3kbk73xoblxzmtdoi-683048240716.asia-southeast1.run.app");
                    alert("Public App Link successfully copied to clipboard!");
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-none border-2 border-slate-900 cursor-pointer text-center duration-150 transition"
                >
                  📋 COPY PUBLIC PORTAL URL
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className="px-6 py-3 border-2 border-slate-900 text-xs font-black uppercase tracking-widest bg-white hover:bg-slate-100 text-slate-900 transition rounded-none cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
