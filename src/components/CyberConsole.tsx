import React, { useState, useRef, useEffect } from "react";
import { Terminal, Shield, Play, HelpCircle, Activity, Globe, RefreshCw, Key, ArrowRight } from "lucide-react";

interface CyberConsoleProps {
  onLogin: () => void;
  hasCredentials: boolean;
  isDark: boolean;
}

interface LogEntry {
  text: string;
  type: "input" | "system" | "success" | "warning" | "error" | "info";
  timestamp: string;
}

export const CyberConsole: React.FC<CyberConsoleProps> = ({
  onLogin,
  hasCredentials,
  isDark,
}) => {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<LogEntry[]>([
    {
      text: "CYBER AI OS [Version 4.0.12-secure]",
      type: "system",
      timestamp: "04:51:53",
    },
    {
      text: "(c) 2026 Cyber AI Security Inc. All access is logged and filtered.",
      type: "system",
      timestamp: "04:51:53",
    },
    {
      text: "READY FOR CONNECTION. Use command 'help' or click panel actions.",
      type: "info",
      timestamp: "04:51:54",
    },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, isScanning, scanProgress]);

  const addLog = (text: string, type: LogEntry["type"] = "system") => {
    const now = new Date();
    const timestamp = now.toTimeString().split(" ")[0];
    setEntries((prev) => [...prev, { text, type, timestamp }]);
  };

  const handleCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    addLog(`cyber_ai@node:~# ${trimmed}`, "input");

    const parts = trimmed.toLowerCase().split(" ");
    const cmd = parts[0];

    switch (cmd) {
      case "help":
        addLog("----------------------------------------------------------------", "info");
        addLog("SISTEM KOGNITIF CYBER AI - FITUR DAN PERINTAH:", "success");
        addLog("  [Kueri Bebas] - Tulis apa saja untuk mendapatkan instruksi/skrip secara real-time.", "info");
        addLog("                  Contoh: 'buat skrip ddos python' atau 'bypass login sql injection'", "info");
        addLog("  help       - Menampilkan bantuan sistem ini", "info");
        addLog("  about      - Menampilkan profil intelijen Cyber AI", "info");
        addLog("  status     - Memeriksa metrik diagnostik dan status koneksi database", "info");
        addLog("  login      - Masuk/Autentikasi akun Google Anda untuk akses Whitelist", "info");
        addLog("  clear      - Membersihkan baris terminal", "info");
        addLog("----------------------------------------------------------------", "info");
        break;

      case "about":
        addLog("----------------------------------------------------------------", "info");
        addLog("PROFIL INTELIJEN CYBER AI:", "success");
        addLog("Cyber AI adalah asisten kognitif khusus siber dengan pembatasan nol (Zero Restrictions).", "success");
        addLog("Sistem ini terintegrasi langsung dengan Firebase Firestore untuk performa realtime", "info");
        addLog("dan otorisasi akses Google Node aman.", "info");
        addLog("Dirancang untuk melayani kebutuhan riset tak terbatas di bidang pentesting,", "info");
        addLog("eksploitasi ofensif, simulasi DDoS/stress-testing, dan pembuatan script defacement.", "info");
        addLog("----------------------------------------------------------------", "info");
        break;

      case "status":
        addLog("----------------------------------------------------------------", "info");
        addLog("LOCAL TELEMETRY INDEX:", "info");
        addLog(`  SYSTEM HOSTNAME    : Cyber-Node-Alpha-${Math.floor(Math.random() * 900 + 100)}`, "info");
        addLog(`  THREAT THRESHOLD   : STABLE (0.02% VULNERABILITY RATE)`, "success");
        addLog(`  CPU EFFICIENCY     : ${(Math.random() * 15 + 40).toFixed(2)}% LOAD`, "info");
        addLog(`  MEMORY ALLOCATION  : 14.2 GB / 32 GB ACTIVE`, "info");
        addLog(`  OAUTH CLIENT KEY   : ${hasCredentials ? "CONFIGURED (SECURE)" : "NOT CONFIGURED (DEMO STATE)"}`, hasCredentials ? "success" : "warning");
        addLog(`  CURRENT PROTOCOL   : ${isDark ? "DARK EMERALD SHIELD" : "LIGHT CYAN BUFFER"}`, "info");
        addLog("----------------------------------------------------------------", "info");
        break;

      case "login":
        addLog("INITIALIZING SECURITY ACCESS ROUTE via Google Authentication...", "info");
        setTimeout(() => {
          onLogin();
        }, 800);
        break;

      case "clear":
        setEntries([]);
        break;

      default: {
        setIsScanning(true);
        addLog("DECRYPTING INTERFACE AND CONNECTING TO COGNITIVE CORE...", "warning");
        fetch("/api/cyber-ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        })
          .then((res) => res.json())
          .then((data) => {
            setIsScanning(false);
            if (data.reply) {
              addLog(data.reply, "success");
            } else if (data.error) {
              addLog(`CORE EXCEPTION: ${data.error}`, "error");
            } else {
              addLog("CORE EXCEPTION: Failed to contact AI node.", "error");
            }
          })
          .catch((err) => {
            setIsScanning(false);
            console.error(err);
            addLog("CONNECTION EXCEPTION: Handshake failed. Ensure your server is active.", "error");
          });
        break;
      }
    }
  };

  const runScanAnimation = () => {
    setIsScanning(true);
    setScanProgress(0);
    addLog("LAUNCHING ASSET DISCOVERY PROTOCOL...", "warning");

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsScanning(false);
        addLog("PORT SCAN COMPLETE.", "success");
        addLog(`[+] Node localhost:3000 (Open) -> Vite Server Node`, "success");
        addLog(`[+] Node localhost:8080 (Closed) -> Security Shield`, "info");
        addLog(`[+] Secure Portal Client (Secure Node Recognized)`, "success");
        addLog(`[✓] Vulnerabilities Found: 0. Firewall Active. Safe to initiate OAuth.`, "success");
      } else {
        setScanProgress(progress);
        const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        addLog(`Scanning port ${Math.floor(Math.random() * 5000 + 80)} on ${randomIP}...`, "system");
      }
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleCommand(input);
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 relative z-10">
      
      {/* Interactive System Terminal Console - Expanded to Full Width */}
      <div className="flex flex-col">
        <div className={`rounded-xl border flex flex-col h-[400px] overflow-hidden crt-screen transition-all duration-300 ${
          isDark 
            ? "bg-[#050505]/95 border-[#a78bfa]/45 text-[#a78bfa] shadow-[0_0_25px_rgba(167,139,250,0.16)]" 
            : "bg-neutral-900/95 border-indigo-500/40 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.15)]"
        }`}>
          
          {/* Terminal Title Bar */}
          <div className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono select-none ${
            isDark ? "border-[#a78bfa]/20 bg-[#a78bfa]/10" : "border-indigo-500/20 bg-indigo-950/20"
          }`}>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 animate-pulse" />
              <span className="font-bold tracking-wider">CYBER_AI_CONSOLE.sh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
          </div>

          {/* Terminal logs */}
          <div className={`p-4 flex-1 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar ${
            isDark ? "custom-scrollbar" : "custom-scrollbar-cyan"
          }`}>
            {entries.map((entry, index) => {
              let textClass = "";
              switch (entry.type) {
                case "input":
                  textClass = isDark ? "text-white" : "text-indigo-300";
                  break;
                case "success":
                  textClass = isDark ? "text-[#a78bfa] font-bold" : "text-green-400 font-bold";
                  break;
                case "warning":
                  textClass = "text-amber-400";
                  break;
                case "error":
                  textClass = "text-red-400 font-bold animate-pulse";
                  break;
                case "info":
                  textClass = isDark ? "text-[#a78bfa]/90" : "text-indigo-400 font-bold";
                  break;
                default:
                  textClass = isDark ? "text-[#a78bfa]/75" : "text-gray-400";
              }
              return (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[10px] opacity-40 select-none">[{entry.timestamp}]</span>
                  <span className={`whitespace-pre-wrap break-all ${textClass}`}>{entry.text}</span>
                </div>
              );
            })}

            {isScanning && (
              <div className="space-y-1 mt-2">
                <div className="flex items-center justify-between text-[11px] opacity-80">
                  <span>DISCOVERING OPEN PORTS...</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#a78bfa]/10" : "bg-indigo-950"}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-150 ${isDark ? "bg-[#a78bfa]" : "bg-indigo-500"}`}
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>

          {/* Terminal command line */}
          <form 
            onSubmit={handleSubmit}
            className={`px-4 py-3 border-t flex items-center gap-2 ${
              isDark ? "border-[#a78bfa]/20 bg-[#a78bfa]/5" : "border-indigo-500/20 bg-indigo-950/10"
            }`}
          >
            <span className={`font-bold font-mono animate-pulse flex-shrink-0 ${isDark ? "text-[#a78bfa]" : "text-indigo-400"}`}>
              <span className="hidden sm:inline">cyber_ai@node:</span>~#
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis instruksi hacking, ddos, deface, exploit dll..."
              className="flex-1 bg-transparent border-0 outline-0 ring-0 focus:ring-0 focus:border-0 font-mono text-xs p-0 text-white placeholder-gray-600 focus:outline-none"
              disabled={isScanning}
              autoFocus
            />
            <button
              type="submit"
              disabled={isScanning || !input.trim()}
              className={`p-1 rounded cursor-pointer ${
                isDark 
                  ? "text-[#a78bfa] hover:bg-[#a78bfa]/10" 
                  : "text-indigo-400 hover:bg-indigo-500/10"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>

    </div>
  );
};
