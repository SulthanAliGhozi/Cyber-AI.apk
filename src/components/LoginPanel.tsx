import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, HelpCircle, Lock, RefreshCw, Terminal, Mail, Key } from "lucide-react";
import { 
  getSavedFirebaseConfig, 
  getEnvFirebaseConfig, 
  getUserRole 
} from "../lib/firebase";

interface LoginPanelProps {
  onLogin: (user: { email: string; name: string; picture?: string; role?: string }) => void;
  isDark: boolean;
  isLoggingIn: boolean;
  onConfigChange: (hasConfig: boolean) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({
  onLogin,
  isDark,
  isLoggingIn,
  onConfigChange,
}) => {
  const [hasConfig, setHasConfig] = useState(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const config = getSavedFirebaseConfig() || getEnvFirebaseConfig();
    if (config) {
      setHasConfig(true);
      onConfigChange(true);
    } else {
      setHasConfig(false);
      onConfigChange(false);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!hasConfig) {
      setErrorMessage("No active Firebase connection configuration is present in this node.");
      return;
    }

    setErrorMessage(null);
    setIsFirebaseLoading(true);

    try {
      const { signInWithPopup } = await import("firebase/auth");
      const { getFirebaseAuth, getGoogleProvider } = await import("../lib/firebase");
      
      const authInstance = getFirebaseAuth();
      if (!authInstance) throw new Error("Firebase Auth could not be initialized.");

      const provider = getGoogleProvider();
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;

      const userEmail = (user.email || user.providerData?.[0]?.email || "").trim().toLowerCase();
      if (!userEmail) {
        await authInstance.signOut();
        throw new Error("ACCESS UNAPPROVED: No verified email address associated with this Google Node account.");
      }

      const userName = user.displayName || user.providerData?.[0]?.displayName || userEmail;
      
      // Get or assign role
      const role = await getUserRole(userEmail, userName);
      
      onLogin({
        email: userEmail,
        name: userName,
        picture: user.photoURL || user.providerData?.[0]?.photoURL || undefined,
        role: role
      });

    } catch (err: any) {
      console.error("Firebase OAuth error:", err);
      let errorText = err.message || String(err);
      if (err.code === "auth/popup-blocked") {
        errorText = "Popup login diblokir oleh browser. Izinkan popup lalu coba lagi.";
      }
      setErrorMessage(errorText);
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConfig) {
      setErrorMessage("No active Firebase connection configuration.");
      return;
    }
    if (!email || !password) {
      setErrorMessage("Email dan password harus diisi.");
      return;
    }

    setErrorMessage(null);
    setIsFirebaseLoading(true);

    try {
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../lib/firebase");
      
      const authInstance = getFirebaseAuth();
      if (!authInstance) throw new Error("Firebase Auth could not be initialized.");

      let result;
      if (isRegisterMode) {
        result = await createUserWithEmailAndPassword(authInstance, email.trim(), password);
      } else {
        result = await signInWithEmailAndPassword(authInstance, email.trim(), password);
      }
      
      const user = result.user;
      const userEmail = (user.email || "").trim().toLowerCase();
      const userName = userEmail.split("@")[0]; // default name
      
      // Get or assign role
      const role = await getUserRole(userEmail, userName);
      
      onLogin({
        email: userEmail,
        name: userName,
        role: role
      });

    } catch (err: any) {
      console.error("Email auth error:", err);
      let errorText = err.message || String(err);
      if (err.code === "auth/email-already-in-use") {
        errorText = "Email sudah terdaftar. Silakan gunakan menu Login.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        errorText = "Email atau password salah.";
      } else if (err.code === "auth/weak-password") {
         errorText = "Password terlalu lemah (minimal 6 karakter).";
      }
      setLocalError(`ERROR: ${errorText}`);
    } finally {
      setLocalLoading(false);
    }
  };

  if (!hasConfig) {
    return (
      <div className="max-w-md mx-auto w-full px-4 relative z-10">
        <div className={`p-6 rounded-xl border text-center ${
          isDark ? "bg-[#0a0a0a]/90 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "bg-white/90 border-red-500/30 shadow-[0_8px_30px_rgba(239,68,68,0.1)]"
        }`}>
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3 animate-pulse" />
          <h2 className={`text-lg font-bold font-sans uppercase mb-2 ${isDark ? "text-red-400" : "text-red-600"}`}>
            Sistem Terkunci
          </h2>
          <p className={`text-xs font-mono mb-4 ${isDark ? "text-red-300/70" : "text-red-700/70"}`}>
            Kredensial Firebase belum dikonfigurasi. Anda harus mengatur API Key terlebih dahulu.
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="py-2.5 px-6 rounded border font-mono text-[10px] uppercase tracking-widest font-bold bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer"
          >
            Buka Pengaturan Sistem
          </button>
        </div>
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onSave={handleSaveConfig}
            isDark={isDark}
            initialConfig={getSavedFirebaseConfig()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full px-4 relative z-10 mb-12">
      <div className={`p-6 md:p-8 rounded-xl border crt-screen transition-all duration-300 ${
        isDark 
          ? "bg-[#0a0a0a]/95 border-[#a78bfa]/30 shadow-[0_0_30px_rgba(167,139,250,0.15)]" 
          : "bg-white/95 border-indigo-500/30 shadow-[0_8px_30px_rgba(99,102,241,0.15)]"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded border ${
              isDark ? "border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]" : "border-indigo-500/30 bg-indigo-50 text-indigo-600"
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-bold font-sans tracking-widest uppercase text-sm ${isDark ? "text-[#a78bfa]" : "text-indigo-900"}`}>
                VIP ACCESS PORTAL
              </h2>
              <p className={`text-[9px] font-mono tracking-widest uppercase ${isDark ? "opacity-50" : "text-indigo-600/60"}`}>
                SECURE AUTHENTICATION GATEWAY
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className={`p-1.5 rounded transition-colors ${
              isDark ? "hover:bg-neutral-800 text-neutral-500 hover:text-[#a78bfa]" : "hover:bg-neutral-100 text-neutral-400 hover:text-indigo-600"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {localError && (
          <div className="mb-5 p-3 rounded border border-red-500/30 bg-red-950/20 text-red-500 text-[10px] font-mono flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{localError}</p>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div>
            <label className={`block text-[10px] font-mono tracking-widest uppercase mb-1.5 ${isDark ? "text-[#a78bfa]/70" : "text-indigo-700/70"}`}>
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs font-mono outline-none transition-colors ${
                  isDark 
                    ? "bg-black/50 border-neutral-800 focus:border-[#a78bfa]/50 text-white placeholder-neutral-700" 
                    : "bg-neutral-50 border-neutral-200 focus:border-indigo-500/50 text-neutral-900 placeholder-neutral-400"
                }`}
                placeholder="agent@cyber.ai"
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-[10px] font-mono tracking-widest uppercase mb-1.5 ${isDark ? "text-[#a78bfa]/70" : "text-indigo-700/70"}`}>
              PASSWORD
            </label>
            <div className="relative">
              <Key className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs font-mono outline-none transition-colors ${
                  isDark 
                    ? "bg-black/50 border-neutral-800 focus:border-[#a78bfa]/50 text-white placeholder-neutral-700" 
                    : "bg-neutral-50 border-neutral-200 focus:border-indigo-500/50 text-neutral-900 placeholder-neutral-400"
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || localLoading}
            className={`w-full py-3 px-4 rounded-lg font-mono text-[11px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              isDark
                ? "bg-[#a78bfa]/10 border border-[#a78bfa]/30 text-[#a78bfa] hover:bg-[#a78bfa] hover:text-black hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]"
                : "bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            } ${(isLoggingIn || localLoading) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {(isLoggingIn || localLoading) ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> MENGOTENTIKASI...</>
            ) : (
              isRegisterMode ? "DAFTAR SEKARANG" : "LOGIN TO TERMINAL"
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className={`text-[10px] font-mono tracking-wider transition-colors cursor-pointer ${
              isDark ? "text-neutral-400 hover:text-[#a78bfa]" : "text-neutral-500 hover:text-indigo-600"
            }`}
          >
            {isRegisterMode ? "Sudah punya akses? Login di sini" : "Belum punya akses? Daftar di sini"}
          </button>
        </div>

        {!isNative && (
          <>
            <div className="relative my-6 flex items-center justify-center">
              <div className={`absolute inset-0 flex items-center`}>
                <div className={`w-full border-t ${isDark ? "border-neutral-800" : "border-neutral-200"}`}></div>
              </div>
              <div className={`relative px-4 text-[9px] font-mono tracking-widest uppercase ${isDark ? "bg-[#0a0a0a] text-neutral-600" : "bg-white text-neutral-400"}`}>
                OR
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn || localLoading}
              className={`w-full py-3 px-4 rounded-lg border font-mono text-[11px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer ${
                isDark
                  ? "bg-black border-neutral-800 text-white hover:border-neutral-600 hover:bg-neutral-900"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
              } ${(isLoggingIn || localLoading) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              LOGIN VIA GOOGLE
            </button>
          </>
        )}
      </div>
    </div>
  );
};
