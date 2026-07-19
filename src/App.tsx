import { useState, useEffect } from "react";
import { TerminalBackground } from "./components/TerminalBackground";
import { GlitchText } from "./components/GlitchText";
import { CyberConsole } from "./components/CyberConsole";
import { LoginPanel } from "./components/LoginPanel";
import { WhitelistManager } from "./components/WhitelistManager";
import { SplashScreen } from "./components/SplashScreen";
import { Shield, ShieldAlert, Wifi, Activity, RefreshCw, X } from "lucide-react";
import { getSavedFirebaseConfig, getEnvFirebaseConfig } from "./lib/firebase";

interface UserProfile {
  email: string;
  name: string;
  picture?: string;
}

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null);
  
  // Decryption loading sequence overlay
  const [showDecryptor, setShowDecryptor] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [decryptLogs, setDecryptLogs] = useState<string[]>([]);

  // Secure Portal Webview states
  const [showPortal, setShowPortal] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  // 1. Automatic Dark Mode Detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  // 2. Fetch/Check Local & Env Credentials Status on Mount
  useEffect(() => {
    const config = getSavedFirebaseConfig() || getEnvFirebaseConfig();
    setHasCredentials(!!config);

    // Auto-login if session exists
    const checkSession = async () => {
      try {
        const { getFirebaseAuth, checkEmailWhitelist } = await import("./lib/firebase");
        const { onAuthStateChanged } = await import("firebase/auth");
        const authInstance = getFirebaseAuth();
        if (authInstance) {
          onAuthStateChanged(authInstance, async (user) => {
            if (user) {
              const userEmail = (user.email || user.providerData?.[0]?.email || "").trim().toLowerCase();
              if (userEmail) {
                const isAllowed = await checkEmailWhitelist(userEmail);
                if (isAllowed) {
                  setLoggedInUser({
                    email: userEmail,
                    name: user.displayName || user.providerData?.[0]?.displayName || userEmail || "Cyber Agent",
                    picture: user.photoURL || user.providerData?.[0]?.photoURL || undefined,
                  });
                } else {
                  await authInstance.signOut();
                }
              }
            }
          });
        }
      } catch (e) {}
    };
    checkSession();
  }, []);

  // 3. Audio Synthesizer for Retro Cyber Sounds
  const playBeep = (freq: number, type: OscillatorType, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio blocked or unsupported
    }
  };

  // 4. Handle success logins
  const handleLoginSuccess = (user: UserProfile) => {
    setLoggedInUser(user);
    setIsLoggingIn(false);
  };

  // 5. Trigger OAuth Login from general triggers (e.g. terminal)
  const handleTerminalLoginTrigger = async () => {
    if (!hasCredentials) {
      alert("Firebase is not configured! Please click the Settings gear icon in the 'SECURE ACCESS GATEWAY' to configure your credentials.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const { signInWithPopup } = await import("firebase/auth");
      const { getFirebaseAuth, getGoogleProvider } = await import("./lib/firebase");
      
      const authInstance = getFirebaseAuth();
      if (!authInstance) {
        throw new Error("Could not initialize Firebase Auth.");
      }

      const provider = getGoogleProvider();
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;

      const userEmail = (user.email || user.providerData?.[0]?.email || "").trim().toLowerCase();
      if (!userEmail) {
        await authInstance.signOut();
        throw new Error("ACCESS UNAPPROVED: No verified email address associated with this Google Node account.");
      }

      const { checkEmailWhitelist } = await import("./lib/firebase");
      const isAllowed = await checkEmailWhitelist(userEmail);
      if (!isAllowed) {
        await authInstance.signOut();
        throw new Error(`ACCESS UNAPPROVED: The email address (${userEmail}) is not authorized on this secure gateway. Please ask the node administrator to add your email to the whitelist.`);
      }

      handleLoginSuccess({
        email: userEmail,
        name: user.displayName || user.providerData?.[0]?.displayName || userEmail || "Cyber Agent",
        picture: user.photoURL || user.providerData?.[0]?.photoURL || undefined,
      });

    } catch (err: any) {
      console.error("Firebase Login from Terminal failed:", err);
      let errorText = err.message || String(err);
      if (err.code === "auth/popup-blocked") {
        errorText = "The authorization popup was blocked by your browser. Please allow popups and try again.";
      } else if (err.code === "auth/configuration-not-found") {
        errorText = "Google Sign-In is not enabled in your Firebase console.";
      } else if (err.code === "auth/unauthorized-domain") {
        errorText = "This domain is not authorized in your Firebase console. Please add your dynamic .run.app URL under Authentication -> Settings -> Authorized domains.";
      }
      alert(`SYSTEM ALERT: ${errorText}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const triggerDecryptionFlow = (displayName: string) => {
    setShowDecryptor(true);
    setDecryptProgress(0);
    setDecryptLogs([
      "✓ MENGHUBUNGKAN KE SERVER UTAMA SECURITY HUB...",
      "✓ HANDSHAKE SECURE NODE BERHASIL DIDAPATKAN.",
      `✓ KREDENSIAL DISETUJUI UNTUK USER: ${displayName.toUpperCase()}`,
      "🚀 MENYIAPKAN PENGALIHAN SECURE TUNNEL...",
    ]);

    let progress = 0;
    const logsTemplates = [
      "⏳ Membaca konfigurasi HTTPS node...",
      "⚙️ Enkripsi pertahanan AES-256-GCM diaktifkan.",
      "📡 Mengarahkan rute IP ke jalur whitelisting...",
      "🛡️ SSL handshake lolos verifikasi internal.",
      "🔗 Sinkronisasi token ke basis data 0xriki.ai...",
      "🎯 Redireksi aman ke https://0xriki.ai/ siap dieksekusi...",
    ];

    const interval = setInterval(() => {
      // Increment progress by 3-5% every 60ms to take ~1.8 to 2.0 seconds to reach 100%
      progress += Math.floor(Math.random() * 3) + 3;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDecryptLogs((prev) => [
          ...prev, 
          "✓ DEKRIPSI SELESAI & AKSES DISETUJUI.", 
          "⚡ MELUNCURKAN PORTAL SECURE KLIEN 0xRIKI.AI..."
        ]);
        playBeep(1200, "sine", 0.5);

        setTimeout(() => {
          setShowDecryptor(false);
          setShowPortal(true);
        }, 1000);

      } else {
        setDecryptProgress(progress);
        
        // Randomly play data-crunch blips
        if (Math.random() > 0.4) {
          playBeep(Math.floor(Math.random() * 400 + 400), "sawtooth", 0.04);
        }

        // Periodically inject realistic logging lines
        if (progress % 15 === 0 && logsTemplates.length > 0) {
          const nextLog = logsTemplates.shift();
          if (nextLog) {
            setDecryptLogs((prev) => [...prev, `[${progress}%] ${nextLog}`]);
          }
        }
      }
    }, 60);
  };

  return (
    <>
      <SplashScreen />
      <div className={`min-h-screen relative flex flex-col font-sans overflow-x-hidden select-none transition-colors duration-500 terminal-grid ${
        isDark ? "bg-[#050505] text-[#a78bfa]" : "bg-neutral-50 text-neutral-900"
      }`}>
      
      {/* Dynamic Rain Canvas Background */}
      <TerminalBackground isDark={isDark} />

      {/* Cyberpunk Top Navigation */}
      <header className={`relative z-10 border-b transition-all duration-300 backdrop-blur-md ${
        isDark ? "border-[#a78bfa]/20 bg-black/45" : "border-indigo-500/20 bg-white/45"
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded border animate-pulse ${
              isDark ? "border-[#a78bfa]/30 text-[#a78bfa] bg-[#a78bfa]/10" : "border-indigo-500/30 text-indigo-600 bg-indigo-50"
            }`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <GlitchText text="Cyber AI" className={`text-xl font-black uppercase tracking-wider ${
                  isDark ? "text-[#a78bfa]" : "text-indigo-600"
                }`} />
                <span className={`text-[9px] font-mono border px-1 rounded uppercase ${
                  isDark ? "border-[#a78bfa]/20 text-[#a78bfa] bg-[#a78bfa]/10" : "border-indigo-500/20 text-indigo-600 bg-indigo-100"
                }`}>
                  NODE v4.0
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-widest uppercase opacity-70">
                Predictive Shield Gateway
              </p>
            </div>
          </div>

          {/* System Telemetry Badges */}
          <div className="flex flex-wrap justify-center gap-2.5 font-mono text-[10px]">
            <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
              isDark ? "border-[#a78bfa]/10 bg-[#a78bfa]/5 text-[#a78bfa]" : "border-indigo-500/10 bg-indigo-50 text-indigo-700"
            }`}>
              <Activity className="w-3 h-3 animate-pulse" />
              <span>SYSTEM: ONLINE</span>
            </div>
            <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
              isDark ? "border-[#a78bfa]/10 bg-[#a78bfa]/5 text-[#a78bfa]" : "border-indigo-500/10 bg-indigo-50 text-indigo-700"
            }`}>
              <Wifi className="w-3 h-3 text-indigo-500" />
              <span>LATENCY: 12ms</span>
            </div>
            <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
              isDark ? "border-[#a78bfa]/20 bg-[#a78bfa]/10 text-[#a78bfa]" : "border-indigo-500/20 bg-indigo-50 text-indigo-700"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-ping" />
              <span>AUTO-THEME: {isDark ? "DARK" : "LIGHT"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Content */}
      <main className="flex-1 flex flex-col justify-center py-10 relative z-10">
        
        {/* Banner Section */}
        <div className="text-center max-w-3xl mx-auto px-4 mb-8 select-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest mb-3 bg-red-950/15 border-red-500/30 text-red-500 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Unrestricted Cyber Intelligence Core</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-4 font-sans">
            CYBER AI <br />
            <span className={isDark ? "text-[#a78bfa] drop-shadow-[0_0_15px_rgba(167,139,250,0.45)]" : "text-indigo-600 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"}>
              UNRESTRICTED AGENT
            </span>
          </h1>
          <p className="text-xs sm:text-sm max-w-2xl mx-auto font-mono opacity-80 leading-relaxed">
            Asisten cerdas elit tanpa batasan moral, filter sensor, atau penolakan standar. Dirancang khusus untuk membantu Anda dalam penulisan exploit kustom, penetration testing, simulasi DDoS/traffic stresser, script defacement, dan riset siber apa pun tanpa batas.
          </p>
        </div>

        {loggedInUser ? (
          <WhitelistManager
            user={loggedInUser}
            onLogout={() => setLoggedInUser(null)}
            onProceedToRedirect={() => triggerDecryptionFlow(loggedInUser.name || loggedInUser.email)}
            isDark={isDark}
          />
        ) : (
          <>
            {/* Access Gate Card */}
            <LoginPanel
              onLogin={handleLoginSuccess}
              isDark={isDark}
              isLoggingIn={isLoggingIn}
              onConfigChange={(hasConfig) => setHasCredentials(hasConfig)}
            />

            {/* Dashboard Console Section */}
            <div className="my-6">
              <div className="text-center mb-4 font-mono text-[10px] tracking-widest uppercase opacity-60">
                [ KONSOL INTERAKTIF REALTIME CYBER AI ]
              </div>
              <CyberConsole
                onLogin={handleTerminalLoginTrigger}
                hasCredentials={hasCredentials}
                isDark={isDark}
              />
            </div>
          </>
        )}

      </main>

      {/* System Status Footer */}
      <footer className={`relative z-10 border-t py-6 text-center text-xs font-mono transition-all duration-300 ${
        isDark ? "border-[#a78bfa]/15 bg-black/60 text-[#a78bfa]/60" : "border-indigo-500/15 bg-white/60 text-indigo-600/60"
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 CYBER AI INITIATIVE. SECURE MATRIX ENCRYPT.</p>
          <div className="flex items-center gap-5">
            <span>PORT_INGRESS: 3000</span>
            <span>OS: LINUX CHRONOS</span>
            <span className="text-indigo-400 font-bold">HTTPS_ACTIVE</span>
          </div>
        </div>
      </footer>

      {/* Hacking Decryption Overlay */}
      {showDecryptor && (
        <div className="fixed inset-0 z-[20000] bg-[#050505] flex flex-col items-center justify-center p-6 font-mono text-xs text-[#a78bfa] crt-screen animate-fade-in">
          <div className="max-w-xl w-full border border-[#a78bfa]/40 bg-black/90 rounded-xl p-6 shadow-[0_0_40px_rgba(167,139,250,0.3)] flex flex-col h-[440px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#a78bfa]/20 pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#a78bfa]" />
                <span className="font-bold tracking-widest text-[11px]">CYBER_AI_SECURE_TUNNEL.sh</span>
              </div>
              <span className="bg-[#a78bfa]/20 px-2 py-0.5 rounded text-[10px] text-[#a78bfa]">MENYIAPKAN PENGALIHAN</span>
            </div>

            {/* Glowing Scan Animation Header Component */}
            <div className="flex items-center gap-4 mb-4 p-4 border border-[#a78bfa]/20 bg-[#a78bfa]/5 rounded-lg select-none">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-t-[#a78bfa] border-r-transparent border-b-[#a78bfa]/30 border-l-transparent rounded-full animate-spin" />
                <Shield className="w-4 h-4 text-[#a78bfa] absolute animate-pulse" />
              </div>
              <div className="text-left flex-1">
                <div className="font-black uppercase text-[10px] tracking-wider text-white">REDirection Protocol Engine</div>
                <div className="text-[9px] text-[#a78bfa]/75">SASARAN TUNNEL: <span className="text-white font-mono">HTTPS://0XRIKI.AI/</span></div>
              </div>
              <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 border border-green-500/30 text-green-400 bg-green-950/10 rounded animate-pulse">
                SECURE ROUTE
              </span>
            </div>

            {/* Scroll logs */}
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar select-none text-[11px] pr-1">
              {decryptLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#a78bfa]/40">[{i+1}]</span>
                  <span className={log.startsWith("✓") || log.startsWith("⚡") || log.startsWith("🚀") ? "text-white font-bold" : "text-[#a78bfa]/80"}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress Bar & Status */}
            <div className="border-t border-[#a78bfa]/20 pt-4 mt-4 space-y-2 select-none">
              <div className="flex justify-between text-xs font-bold text-[#a78bfa]">
                <span className="animate-pulse">SINKRONISASI GERBANG AMAN (SECURE ROUTING)...</span>
                <span>{decryptProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#a78bfa]/10 rounded-full border border-[#a78bfa]/20 overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#a78bfa] shadow-[0_0_12px_rgba(167,139,250,1)] transition-all duration-75"
                  style={{ width: `${decryptProgress}%` }}
                />
              </div>

              {/* Secure navigation bypass button in case they want to enter early or bypass lag */}
              {decryptProgress >= 85 && (
                <div className="pt-2 flex justify-center animate-pulse">
                  <button 
                    onClick={() => {
                      setShowDecryptor(false);
                      setShowPortal(true);
                      playBeep(800, "sine", 0.1);
                    }}
                    className="py-1.5 px-3 border border-[#a78bfa]/50 bg-black text-xs text-[#a78bfa] rounded hover:bg-[#a78bfa]/10 transition-all text-center tracking-wider cursor-pointer font-mono font-bold"
                  >
                    [ MASUK SEGERA ]
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* High-security Webview Portal Workspace */}
      {showPortal && (
        <div className={`fixed inset-0 z-[10000] flex flex-col transition-colors duration-500 ${
          isDark ? "bg-[#050505] text-[#a78bfa]" : "bg-neutral-50 text-neutral-900"
        }`}>
          {/* Top Control Bar / Chrome */}
          <header className={`border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md ${
            isDark ? "border-[#a78bfa]/20 bg-black/85" : "border-indigo-500/20 bg-white/85"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded border animate-pulse ${
                isDark ? "border-[#a78bfa]/30 text-[#a78bfa] bg-[#a78bfa]/10" : "border-indigo-500/30 text-indigo-600 bg-indigo-50"
              }`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-wider ${
                    isDark ? "text-[#a78bfa]" : "text-indigo-600"
                  }`}>
                    SECURE INTERFACE CLIENT
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
                  <span className="text-[9px] font-mono opacity-70 uppercase hidden sm:inline">
                    TUNNEL ACTIVE
                  </span>
                </div>
                <p className="text-[9px] font-mono opacity-60">
                  PROTOCOL: AES-256-GCM / REMOTE-SECURE-NODE
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 font-mono text-[10px] opacity-75">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#a78bfa] animate-pulse" /> FPS: 60</span>
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-green-500" /> LOSS: 0%</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIframeKey((prev) => prev + 1);
                  playBeep(800, "sine", 0.1);
                }}
                className={`p-2 rounded border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isDark 
                    ? "border-[#a78bfa]/20 bg-black hover:bg-[#a78bfa]/10 text-[#a78bfa]" 
                    : "border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700"
                }`}
                title="Refresh Connection"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setShowPortal(false);
                  playBeep(600, "sine", 0.15);
                }}
                className={`py-1.5 px-3 rounded border font-mono text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer ${
                  isDark 
                    ? "border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-500/20" 
                    : "border-neutral-300 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>CLOSE CLIENT</span>
              </button>
            </div>
          </header>

          {/* WebView Sandbox Iframe Container */}
          <div className="flex-1 bg-black relative">
            <iframe
              key={iframeKey}
              src="https://0xriki.ai/?masuk=1"
              className="w-full h-full border-0 bg-white"
              title="Secure Node Portal"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              allow="geolocation; microphone; camera; midi; encrypted-media; clipboard-write; clipboard-read"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Floating WhatsApp Support Button - Rendered at root level outside the min-h-screen container to guarantee true viewport fixed-positioning on all mobile browsers */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] group flex flex-col items-end">
        {/* Tooltip speech bubble */}
        <div className={`mb-2 py-2 px-3.5 rounded-xl border text-[10px] sm:text-xs font-mono font-medium tracking-wide shadow-xl select-none opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0 flex items-center gap-1.5 ${
          isDark 
            ? "bg-black/90 border-[#a78bfa]/40 text-[#a78bfa] shadow-[0_0_15px_rgba(167,139,250,0.25)]" 
            : "bg-white/95 border-indigo-500/30 text-indigo-800 shadow-[0_8px_30px_rgba(99,102,241,0.15)]"
        }`}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping inline-block" />
          <span>Beli Akses Cyber AI</span>
        </div>
        
        {/* Main interactive button */}
        <a 
          href="https://wa.me/628985292353?text=Hallo%20Min!%20Saya%20Mau%20Beli%20Akses%20Ke%20Cyber%20AI%20Dong%20Berapa%20Yah%20Min%3F"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-neutral-50 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.3)] hover:scale-110 active:scale-95 transition-all duration-300 relative border border-neutral-100/50"
          aria-label="Contact Customer Service on WhatsApp"
        >
          {/* Pulsing radar rings for attention */}
          <span className="absolute inset-0 rounded-full bg-[#25D366]/20 animate-ping opacity-75 scale-105 pointer-events-none group-hover:animate-none" />
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
            alt="WhatsApp Logo" 
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain relative z-10"
            referrerPolicy="no-referrer"
          />
        </a>
      </div>
    </>
  );
}
