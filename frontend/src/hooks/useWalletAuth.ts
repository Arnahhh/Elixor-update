"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { api, setToken, setUser as persistUser, getUser as getPersistedUser } from "../lib/api";

export interface AuthedUser {
  id: string;
  role: "patient" | "doctor" | "admin";
  full_name: string;
  wallet_address: string;
}

/**
 * Client-side half of Workflow 1 — Blockchain Authentication.
 * connectAndSignIn(): connect MetaMask -> request nonce -> sign the
 * returned message -> POST to /api/auth/verify -> store JWT -> return user.
 */
export function useWalletAuth() {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getPersistedUser();
    if (existing) setUser(existing);
  }, []);

  const connectAndSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!(window as any).ethereum) {
        throw new Error("No Ethereum wallet found. Install MetaMask.");
      }
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const wallet_address = await signer.getAddress();

      const { message } = await api.getNonce(wallet_address);
      const signature = await signer.signMessage(message);

      const { token, user: authedUser } = await api.verify(wallet_address, message, signature);
      setToken(token);
      persistUser(authedUser);
      setUser(authedUser);
      return authedUser;
    } catch (e: any) {

      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, connectAndSignIn };
}
