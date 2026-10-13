"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "../hooks/useWalletAuth";

export default function LoginPage() {
  const { connectAndSignIn, loading, error } = useWalletAuth();
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const router = useRouter();

  const handleConnect = async () => {
    const keyToPass = showAdminInput && adminKey.trim() ? adminKey.trim() : undefined;
    const user = await connectAndSignIn(keyToPass).catch(() => null);
    if (!user) return;
    if (user.role === "doctor") router.push("/doctor");
    else if (user.role === "admin") router.push("/admin");
    else router.push("/patient");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12 bg-slate-50">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold mb-3">
          <span>⛓️ Web3 Decoupled Healthcare Identity</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">HealthChain</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Sign in with your Ethereum wallet. No passwords — your cryptographic signature proves who you are, verified
          against a single-use nonce for database-level Row-Level Security.
        </p>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-white font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Waiting for Wallet Signature...</span>
            </>
          ) : (
            <>
              <span>Connect Wallet & Sign In</span>
              <span>🦊</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Collapsible Admin Setup Passcode Section (Method 2) */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowAdminInput(!showAdminInput)}
            className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center justify-between w-full font-medium"
          >
            <span>🔐 Admin Registration / Setup</span>
            <span className="text-[11px] text-indigo-600">{showAdminInput ? "Hide ▲" : "Enter Passcode ▼"}</span>
          </button>

          {showAdminInput && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">
                Admin Registration Passcode:
              </label>
              <input
                type="password"
                placeholder="Enter ADMIN_REGISTRATION_KEY"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                If provided, matching the backend <code className="bg-slate-200 px-1 rounded">ADMIN_REGISTRATION_KEY</code> assigns or elevates your wallet to the <span className="font-semibold text-indigo-700">admin</span> role. Leave blank for standard patient/doctor access.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md w-full text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <p className="font-semibold text-slate-700 mb-2">How Authentication Works:</p>
        <ol className="space-y-1.5 list-decimal list-inside text-slate-600">
          <li>Connect MetaMask (reads public address)</li>
          <li>Sign an off-chain EIP-4361 challenge statement (free, no gas)</li>
          <li>Backend recovers address via <code className="text-slate-700">ethers.verifyMessage</code> and consumes nonce</li>
          <li>Issues role-scoped JWT matching Supabase RLS policies</li>
        </ol>
      </div>
    </main>
  );
}
