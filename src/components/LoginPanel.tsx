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
      setErrorMessage(errorText);
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-4 relative z-10 mb-12">
      <div className={`p-6 md:p-8 rounded-xl border crt-screen transition-all duration-300 relative ${
        isDark 
          ? "bg-[#0a0a0a]/90 border-[#a78bfa]/40 text-[#a78bfa] shadow-[0_0_20px_rgba(167,139,250,0.15)]" 
          : "bg-white/95 border-indigo-500/40 text-indigo-800 shadow-[0_4px_30px_rgba(99,102,241,0.1)]"
      }`}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`p-3 rounded-full mb-3 ${
            isDark ? "bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20" : "bg-indigo-100 text-indigo-600"
          }`}>
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-lg md:text-xl font-bold tracking-[0.2em] uppercase font-sans">
            VIP ACCESS PORTAL
          </h2>
          <p className="text-xs opacity-75 font-mono mt-1 mb-4">
            SECURE AUTHENTICATION GATEWAY
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 mb-6 rounded-lg border border-red-500/40 bg-red-950/20 text-red-400 text-xs font-mono leading-relaxed">
            <p className="font-bold mb-1">⚠️ SYSTEM WARNING:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Auth Forms */}
        <div className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-3 font-mono">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-2.5 pl-9 rounded border text-xs bg-black/60 outline-none transition-all ${
                    isDark ? "border-[#a78bfa]/30 text-white focus:border-[#a78bfa]" : "border-indigo-500/30 text-indigo-900 focus:border-indigo-500"
                  }`}
                  placeholder="agent@cyber.ai"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">PASSWORD</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-2.5 pl-9 rounded border text-xs bg-black/60 outline-none transition-all ${
                    isDark ? "border-[#a78bfa]/30 text-white focus:border-[#a78bfa]" : "border-indigo-500/30 text-indigo-900 focus:border-indigo-500"
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoggingIn || isFirebaseLoading}
              className={`w-full py-3 px-5 mt-2 rounded-lg text-sm uppercase tracking-wider font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                isDark
                  ? "bg-[#a78bfa] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              } disabled:opacity-50`}
            >
              {isFirebaseLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {isRegisterMode ? "REGISTER NEW AGENT" : "LOGIN TO TERMINAL"}
            </button>
          </form>

          <div className="text-center text-[10px] font-mono opacity-80">
            {isRegisterMode ? "Sudah punya akses?" : "Belum punya akses?"}
            <button 
              type="button" 
              onClick={() => setIsRegisterMode(!isRegisterMode)} 
              className={`ml-2 font-bold cursor-pointer underline ${isDark ? "text-[#a78bfa]" : "text-indigo-600"}`}
            >
              {isRegisterMode ? "Login di sini" : "Daftar di sini"}
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-700/30"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] uppercase font-mono opacity-50">OR</span>
            <div className="flex-grow border-t border-neutral-700/30"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || isFirebaseLoading}
            type="button"
            className={`w-full py-3 px-5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-3 border cursor-pointer ${
              isDark
                ? "bg-black/50 border-[#a78bfa]/40 text-white hover:bg-[#a78bfa]/10"
                : "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            } disabled:opacity-50`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            LOGIN VIA GOOGLE
          </button>
        </div>
      </div>
    </div>
  );
};
