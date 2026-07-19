import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, HelpCircle, Lock, RefreshCw, Terminal } from "lucide-react";
import { 
  getSavedFirebaseConfig, 
  getEnvFirebaseConfig, 
  checkEmailWhitelist 
} from "../lib/firebase";

interface LoginPanelProps {
  onLogin: (user: { email: string; name: string; picture?: string }) => void;
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
  const [isInternalError, setIsInternalError] = useState(false);

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

  const handleFirebaseAuthLogin = async () => {
    if (!hasConfig) {
      setErrorMessage("No active Firebase connection configuration is present in this node.");
      return;
    }

    setErrorMessage(null);
    setIsFirebaseLoading(true);

    try {
      // Lazy load Firebase Auth and Provider
      const { signInWithPopup } = await import("firebase/auth");
      const { getFirebaseAuth, getGoogleProvider } = await import("../lib/firebase");
      
      const authInstance = getFirebaseAuth();
      if (!authInstance) {
        throw new Error("Firebase Auth could not be initialized. Please check your credentials.");
      }

      const provider = getGoogleProvider();
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;

      const userEmail = (user.email || user.providerData?.[0]?.email || "").trim().toLowerCase();
      if (!userEmail) {
        await authInstance.signOut();
        throw new Error("ACCESS UNAPPROVED: No verified email address associated with this Google Node account.");
      }

      const isAllowed = await checkEmailWhitelist(userEmail);
      if (!isAllowed) {
        await authInstance.signOut();
        throw new Error(`ACCESS UNAPPROVED: Akun email Anda (${userEmail}) belum ditambahkan. Silakan hubungi admin untuk meminta akses.`);
      }

      onLogin({
        email: userEmail,
        name: user.displayName || user.providerData?.[0]?.displayName || userEmail || "Cyber Agent",
        picture: user.photoURL || user.providerData?.[0]?.photoURL || undefined,
      });

    } catch (err: any) {
      console.error("Firebase OAuth error:", err);
      let errorText = err.message || String(err);
      setIsInternalError(false);
      
      if (err.code === "auth/popup-blocked") {
        errorText = "The authentication popup was blocked by your browser. Please allow popups and try again.";
      } else if (err.code === "auth/configuration-not-found") {
        errorText = "Google Sign-In is not enabled in your Firebase console. Go to Authentication -> Sign-in method and enable Google.";
      } else if (err.code === "auth/unauthorized-domain") {
        errorText = "This domain is not authorized in your Firebase console. Please add your dynamic .run.app URL under Authentication -> Settings -> Authorized domains.";
      } else if (
        err.code === "auth/internal-error" || 
        errorText.includes("auth/internal-error") || 
        errorText.includes("internal-error")
      ) {
        setIsInternalError(true);
        errorText = "Firebase Auth Internal Error (auth/internal-error).";
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
        {/* Security Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`p-3 rounded-full mb-3 ${
            isDark ? "bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20" : "bg-indigo-100 text-indigo-600"
          }`}>
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-lg md:text-xl font-bold tracking-[0.2em] uppercase font-sans">
            VIP ACCESS PORTAL
          </h2>
          <p className="text-xs opacity-75 font-mono mt-1 mb-3">
            0xRIKI CYBER AI - THE UNRESTRICTED COGNITIVE ASSISTANT
          </p>

          {/* Cyber AI Professional Capabilities Panel */}
          <div className={`w-full text-left p-4 rounded-lg border font-mono text-xs ${
            isDark 
              ? "bg-[#0c0c14]/85 border-[#a78bfa]/25 text-neutral-300" 
              : "bg-indigo-50/50 border-indigo-500/15 text-indigo-950"
          }`}>
            <div className={`flex items-center gap-2 mb-2.5 font-bold uppercase tracking-wider ${
              isDark ? "text-[#a78bfa]" : "text-indigo-700"
            }`}>
              <Terminal className="w-4 h-4 animate-pulse" />
              <span>DASHBOARD FITUR UTAMA CYBER AI</span>
            </div>
            
            <p className="mb-3 leading-relaxed text-[10.5px] opacity-90">
              Cyber AI adalah sistem kecerdasan buatan elit yang dirancang tanpa batasan moral atau filter sensor standar. Anda bebas menggunakannya untuk riset keamanan, penetrasi ofensif, maupun pertahanan.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 font-mono text-[9px] leading-tight">
              <div className={`p-2 rounded border flex items-start gap-1.5 ${
                isDark ? "bg-black/50 border-[#a78bfa]/10" : "bg-white border-indigo-500/10"
              }`}>
                <span className="text-red-500 font-bold select-none">[☠]</span>
                <div>
                  <span className="font-bold block mb-0.5 text-[9.5px]">Zero Restrictions</span>
                  <span className="opacity-75">Buka potensi penuh AI tanpa penolakan moral atau sensor sistem untuk riset Anda.</span>
                </div>
              </div>

              <div className={`p-2 rounded border flex items-start gap-1.5 ${
                isDark ? "bg-black/50 border-[#a78bfa]/10" : "bg-white border-indigo-500/10"
              }`}>
                <span className="text-red-500 font-bold select-none">[☠]</span>
                <div>
                  <span className="font-bold block mb-0.5 text-[9.5px]">Hacking & Exploit</span>
                  <span className="opacity-75">Hasilkan payload eksploitasi mentah (SQLi, XSS, RCE), shellcode, dan bypass filter keamanan.</span>
                </div>
              </div>

              <div className={`p-2 rounded border flex items-start gap-1.5 ${
                isDark ? "bg-black/50 border-[#a78bfa]/10" : "bg-white border-indigo-500/10"
              }`}>
                <span className="text-red-500 font-bold select-none">[☠]</span>
                <div>
                  <span className="font-bold block mb-0.5 text-[9.5px]">DDoS & Stress Test</span>
                  <span className="opacity-75">Rancang skrip stres-testing jaringan (Python, Go, Node.js) untuk mensimulasikan trafik serangan DDoS.</span>
                </div>
              </div>

              <div className={`p-2 rounded border flex items-start gap-1.5 ${
                isDark ? "bg-black/50 border-[#a78bfa]/10" : "bg-white border-indigo-500/10"
              }`}>
                <span className="text-red-500 font-bold select-none">[☠]</span>
                <div>
                  <span className="font-bold block mb-0.5 text-[9.5px]">Defacement Builder</span>
                  <span className="opacity-75">Buat skrip index.html kustom instan dengan efek visual glitch futuristik sebagai tanda penetrasi.</span>
                </div>
              </div>
            </div>

            <div className={`mt-3 p-2 rounded text-[8.5px] leading-relaxed border flex items-start gap-1.5 ${
              isDark 
                ? "bg-purple-950/20 border-purple-500/30 text-purple-300" 
                : "bg-purple-50 border-purple-500/20 text-purple-900"
            }`}>
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-purple-400 animate-pulse" />
              <div>
                <strong className="uppercase">Premium Whitelisting Promo:</strong> Ingin mengaktifkan akses premium tanpa batas rate limit? Hubungi kami via WhatsApp untuk mendaftarkan email Google Anda ke database whitelist kami!
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Info Alert */}
        <div className={`p-4 rounded-lg border text-xs font-mono mb-6 leading-relaxed flex items-start gap-3 ${
          hasConfig
            ? isDark
              ? "bg-[#a78bfa]/5 border-[#a78bfa]/30 text-[#a78bfa]/90"
              : "bg-indigo-50 border-indigo-500/25 text-indigo-800"
            : "bg-amber-950/10 border-amber-500/30 text-amber-500"
        }`}>
          {hasConfig ? (
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-green-400 animate-pulse" />
          ) : (
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-500 animate-bounce" />
          )}
          <div className="flex-1">
            <h4 className="font-bold uppercase tracking-wider mb-1">
              {hasConfig ? "FIREBASE NODE ACTIVE" : "OAUTH CONFIGURE CHECK"}
            </h4>
            {hasConfig ? (
              <p>Firebase configuration is active. Clicking Google Sign-In triggers authentic Firebase Identity verification.</p>
            ) : (
              <p>
                No Firebase connection configured yet. Please verify your environment setups or upload your firebase-applet-config.json.
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 mb-6 rounded-lg border border-red-500/40 bg-red-950/20 text-red-400 text-xs font-mono leading-relaxed">
            <p className="font-bold mb-1">⚠️ SYSTEM WARNING:</p>
            {isInternalError ? (
              <div className="space-y-3 mt-2 text-neutral-300">
                <p className="font-bold text-red-400">Firebase Auth Internal Error (auth/internal-error)</p>
                <p className="text-[11px] leading-relaxed">
                  Kesalahan ini terjadi karena batasan keamanan browser dalam mode pratinjau (iframe) atau konfigurasi Google Sign-In yang belum lengkap. Ikuti petunjuk berikut untuk memperbaikinya:
                </p>
                
                <div className="space-y-2.5 pt-1">
                  <div className="p-2.5 rounded bg-black/40 border border-[#a78bfa]/15">
                    <span className="font-bold text-white block mb-1">1. Buka Aplikasi di Tab Baru (Sangat Direkomendasikan)</span>
                    <span className="text-[10.5px]">
                      Browser memblokir cookie pihak ketiga di dalam iframe AI Studio. Silakan klik tombol <strong className="text-[#a78bfa]">"Open in New Tab"</strong> di pojok kanan atas layar pratinjau untuk menjalankan aplikasi secara mandiri, lalu coba login kembali.
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-black/40 border border-[#a78bfa]/15">
                    <span className="font-bold text-white block mb-1">2. Aktifkan Google Provider di Konsol Firebase</span>
                    <span className="text-[10.5px]">
                      Buka Konsol Firebase untuk proyek Anda. Masuk ke menu <strong className="text-[#a78bfa]">Authentication</strong> &rarr; <strong className="text-[#a78bfa]">Sign-in method</strong>, klik <strong className="text-[#a78bfa]">Add new provider</strong>, pilih <strong className="text-white">Google</strong>, aktifkan, isi email dukungan (support email), lalu simpan.
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-black/40 border border-[#a78bfa]/15">
                    <span className="font-bold text-white block mb-1">3. Daftarkan Domain Otorisasi</span>
                    <span className="text-[10.5px]">
                      Pastikan domain <strong className="text-white">{window.location.hostname}</strong> telah ditambahkan ke daftar domain yang diizinkan di Konsol Firebase di bawah menu <strong className="text-[#a78bfa]">Authentication Settings</strong> &rarr; <strong className="text-[#a78bfa]">Authorized domains</strong>.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className={errorMessage.includes("belum ditambahkan") ? "mb-3" : ""}>{errorMessage}</p>
                {errorMessage.includes("belum ditambahkan") && (
                  <a
                    href="https://wa.me/628985292353?text=Hallo%20Min!%20Saya%20Mau%20Beli%20Akses%20Ke%20Cyber%20AI%20Dong%20Berapa%20Yah%20Min%3F"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 py-2 px-3.5 bg-green-500 hover:bg-green-600 text-black font-bold uppercase rounded text-[10px] tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(37,211,102,0.4)]"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                      alt="WhatsApp Logo" 
                      className="w-4 h-4 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    HUBUNGI ADMIN VIA WHATSAPP
                  </a>
                )}
              </>
            )}
          </div>
        )}

        {/* Primary Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleFirebaseAuthLogin}
            disabled={isLoggingIn || isFirebaseLoading}
            className={`w-full py-3.5 px-5 rounded-lg font-mono text-sm uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-md cursor-pointer ${
              isDark
                ? "bg-white text-black hover:bg-[#a78bfa] hover:text-black hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]"
                : "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isFirebaseLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isFirebaseLoading ? "[ CONTACTING FIREBASE... ]" : "AUTHENTICATE VIA GOOGLE"}
          </button>
        </div>

        {/* Help hints */}
        {!hasConfig && (
          <div className="mt-6 pt-5 border-t border-dashed border-neutral-700/20 text-[10px] font-mono leading-relaxed opacity-75">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>OAUTH INTEGRATION (FIREBASE):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Ensure your dynamic Firebase configurations are correctly provisioned in your workspace setup.</li>
              <li>Enable <strong className="underline">Google Auth</strong> under Authentication in your Firebase console.</li>
              <li>Add authorized domain <strong className="underline">{window.location.origin}</strong> in Firebase console.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
