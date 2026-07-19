import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ExternalLink, 
  LogOut, 
  RefreshCw, 
  Shield, 
  Mail, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { 
  getWhitelistedEmails, 
  addWhitelistedEmail, 
  removeWhitelistedEmail,
  getFirebaseAuth
} from "../lib/firebase";

interface WhitelistManagerProps {
  user: { email: string; name: string; picture?: string };
  onLogout: () => void;
  onProceedToRedirect: () => void;
  isDark: boolean;
}

export const WhitelistManager: React.FC<WhitelistManagerProps> = ({
  user,
  onLogout,
  onProceedToRedirect,
  isDark,
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Fetch whitelisted emails
  const fetchEmails = async () => {
    const admins = ["s.a.ghozi@gmail.com", "sulthanalighozi@gmail.com"];
    if (!admins.includes(user.email)) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const list = await getWhitelistedEmails();
      setEmails(list);
    } catch (err: any) {
      console.error("Error fetching whitelist:", err);
      setMessage({
        text: `Failed to fetch whitelist: ${err.message || String(err)}`,
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const admins = ["s.a.ghozi@gmail.com", "sulthanalighozi@gmail.com"];
    if (admins.includes(user.email)) {
      fetchEmails();
    }
  }, [user.email]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToTrim = newEmail.trim().toLowerCase();
    
    if (!emailToTrim) return;
    
    // Quick regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToTrim)) {
      setMessage({ text: "Invalid email address format.", isError: true });
      return;
    }

    if (emails.includes(emailToTrim)) {
      setMessage({ text: "Email is already authorized in the whitelist.", isError: true });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await addWhitelistedEmail(emailToTrim);
      setNewEmail("");
      setMessage({ text: `Successfully whitelisted node: ${emailToTrim}`, isError: false });
      
      // Sound cue
      playTone(600, "sine", 0.1);
      
      // Refresh list
      await fetchEmails();
    } catch (err: any) {
      setMessage({
        text: `Access grant failed: ${err.message || String(err)}`,
        isError: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    const admins = ["s.a.ghozi@gmail.com", "sulthanalighozi@gmail.com"];
    if (admins.includes(emailToRemove)) {
      setMessage({ text: "Cannot delete the primary owner administrator node.", isError: true });
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke access for ${emailToRemove}?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await removeWhitelistedEmail(emailToRemove);
      setMessage({ text: `Revoked access for node: ${emailToRemove}`, isError: false });
      
      // Sound cue
      playTone(300, "sawtooth", 0.15);
      
      // Refresh list
      await fetchEmails();
    } catch (err: any) {
      setMessage({
        text: `Access revocation failed: ${err.message || String(err)}`,
        isError: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const playTone = (freq: number, type: OscillatorType, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  const handleFirebaseAuthLogout = async () => {
    try {
      const authInstance = getFirebaseAuth();
      if (authInstance) {
        await authInstance.signOut();
      }
    } catch (err) {
      console.error("Firebase logout error:", err);
    }
    onLogout();
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 relative z-10 mb-12">
      <div className={`p-6 md:p-8 rounded-xl border crt-screen transition-all duration-300 ${
        isDark 
          ? "bg-[#0a0a0a]/95 border-[#a78bfa]/40 text-[#a78bfa] shadow-[0_0_30px_rgba(167,139,250,0.2)]" 
          : "bg-white/95 border-indigo-500/40 text-indigo-800 shadow-[0_8px_30px_rgba(99,102,241,0.15)]"
      }`}>
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 mb-6 border-neutral-700/30 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${
              isDark ? "border-[#a78bfa]/30 bg-[#a78bfa]/5 text-[#a78bfa]" : "border-indigo-500/30 bg-indigo-50 text-indigo-600"
            }`}>
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-widest uppercase font-sans flex items-center gap-2">
                NODE CENTRAL STATION
              </h2>
              <p className="text-[10px] font-mono opacity-75 uppercase">
                Access Authorization Control Console
              </p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className={`p-2 rounded-lg border flex items-center gap-3 font-mono text-xs ${
            isDark ? "bg-black/60 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-neutral-800"
          }`}>
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-neutral-700/50" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-sm uppercase">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="font-bold text-[11px] truncate max-w-[150px]">{user.name}</p>
              <p className="text-[9px] opacity-65 truncate max-w-[150px]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Actions / Proceed Box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8">
          <div className="md:col-span-8 flex flex-col justify-center">
            <h3 className="font-bold text-sm tracking-wider uppercase font-sans mb-1">
              PROCEED TO SECURE ENVIRONMENT
            </h3>
            <p className="text-xs opacity-75 font-mono mb-3 leading-relaxed">
              Launch the automated decryption and cryptographic tunneling sequence to access the primary dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onProceedToRedirect}
                className={`py-3 px-6 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  isDark
                    ? "bg-[#a78bfa] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                [ RUN REDIRECT TUNNEL ]
              </button>

              <button
                onClick={handleFirebaseAuthLogout}
                className="py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-wider font-bold border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                [ LOGOUT ]
              </button>
            </div>
          </div>

          <div className={`md:col-span-4 p-4 rounded-lg border font-mono text-xs flex flex-col justify-center items-center text-center ${
            isDark ? "bg-[#a78bfa]/5 border-[#a78bfa]/20" : "bg-indigo-50 border-indigo-100"
          }`}>
            <Users className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-xl font-black">{emails.length}</div>
            <div className="text-[10px] tracking-widest opacity-60 uppercase mt-0.5">WHITELISTED NODES</div>
            <p className="text-[9px] opacity-75 mt-2 leading-tight">Only listed terminals are granted decryption access.</p>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className={`p-4 mb-6 rounded-lg border text-xs font-mono flex items-start gap-3 ${
            message.isError 
              ? "bg-red-950/20 border-red-500/40 text-red-400" 
              : "bg-green-950/20 border-green-500/40 text-green-400"
          }`}>
            {message.isError ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
            <div>
              <p className="font-bold uppercase mb-0.5">{message.isError ? "SYSTEM ALERT" : "TRANSACTION CONFIRMED"}</p>
              <p>{message.text}</p>
            </div>
          </div>
        )}

        {/* whitelist management layout */}
        {(user.email === "s.a.ghozi@gmail.com" || user.email === "sulthanalighozi@gmail.com") ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Add user form */}
            <div className="space-y-4">
              <h4 className="font-bold font-sans text-xs uppercase tracking-widest border-b pb-2 border-neutral-700/20 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> AUTHORIZE NEW USER EMAIL
              </h4>

              <form onSubmit={handleAddEmail} className="space-y-4 font-mono text-xs">
                <p className="opacity-75 leading-relaxed">
                  Add an email address below to immediately authorize them to bypass the login portal and gain access.
                </p>
                
                <div className="space-y-1.5">
                  <label className="block opacity-80 font-bold uppercase tracking-wider">EMAIL ADDRESS:</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="user@example.com"
                        disabled={actionLoading}
                        className={`w-full p-2.5 pl-9 rounded border font-mono text-xs bg-black/60 outline-none transition-all ${
                          isDark 
                            ? "border-[#a78bfa]/20 text-[#a78bfa] focus:border-[#a78bfa]" 
                            : "border-indigo-500/20 text-indigo-800 focus:border-indigo-500"
                        }`}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className={`py-2.5 px-4 rounded font-bold uppercase transition-all cursor-pointer ${
                        isDark
                          ? "bg-[#a78bfa] text-black hover:bg-white"
                          : "bg-indigo-600 text-white hover:bg-indigo-500"
                      } disabled:opacity-50`}
                    >
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "GRANT"}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded text-[10px] opacity-75 space-y-1 leading-normal">
                  <p className="font-bold">🔒 SECURITY WARNING:</p>
                  <p>Only authorize individuals you completely trust. Authorized emails can access the dynamic redirection flow without restriction.</p>
                </div>
              </form>
            </div>

            {/* List of Whitelisted Users */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-neutral-700/20">
                <h4 className="font-bold font-sans text-xs uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" /> ACTIVE AUTHORIZED LIST
                </h4>
                <button
                  onClick={fetchEmails}
                  disabled={isLoading}
                  className="p-1 rounded hover:bg-neutral-800/30 transition-all text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  title="Refresh Whitelist"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  SYNC
                </button>
              </div>

              <div className={`border rounded-lg max-h-[220px] overflow-y-auto custom-scrollbar font-mono text-xs ${
                isDark ? "border-neutral-800 bg-black/40" : "border-neutral-200 bg-neutral-50/50"
              }`}>
                {isLoading && emails.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center gap-2 opacity-60">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>SYNCHRONIZING TERMINAL DIRECTORY...</span>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="p-8 text-center opacity-60">
                    NO ACTIVE AUTHORIZED EMAILS FOUND.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/40">
                    {emails.map((email) => {
                      const isOwner = email === "s.a.ghozi@gmail.com" || email === "sulthanalighozi@gmail.com";
                      return (
                        <div key={email} className="p-3 flex items-center justify-between hover:bg-neutral-800/10 transition-colors gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${isOwner ? "bg-amber-400" : "bg-indigo-400 animate-pulse"}`} />
                            <span className="truncate font-medium text-[11px] text-white" title={email}>{email}</span>
                          </div>

                          {isOwner ? (
                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 select-none">
                              ADMIN OWNER
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRemoveEmail(email)}
                              disabled={actionLoading}
                              className="p-1.5 rounded text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className={`p-4 rounded-lg border text-xs font-mono mt-6 leading-relaxed ${
            isDark ? "bg-[#a78bfa]/5 border-[#a78bfa]/20 text-[#a78bfa]/90" : "bg-indigo-50 border-indigo-500/20 text-indigo-800"
          }`}>
            <p className="font-bold uppercase tracking-wider mb-1">
              AUTHORIZED CLIENT MODE
            </p>
            <p>Your email address is whitelisted on this secure gateway. You have permission to proceed to the secure environment. Whitelist management operations are restricted to the system administrator (s.a.ghozi@gmail.com).</p>
          </div>
        )}

      </div>
    </div>
  );
};
