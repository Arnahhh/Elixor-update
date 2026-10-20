"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, Wallet } from "ethers";
import { api, setToken, setUser as persistUser, getUser as getPersistedUser } from "../lib/api";

export interface AuthedUser {
  id: string;
  role: "patient" | "doctor" | "admin";
  full_name: string;
  wallet_address: string;
}

/**
 * Client-side half of Workflow 1 — Blockchain Authentication.
 * Supports:
 *   1. MetaMask / Injected EIP-1193 Provider
 *   2. In-browser Burner Wallet (signs via Ethers without any extension)
 *   3. 1-Click Demo Login (Instant Patient, Doctor, Admin access)
 */
export function useWalletAuth() {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getPersistedUser();
    if (existing) setUser(existing);
  }, []);

  const connectAndSignIn = useCallback(async (adminKey?: string) => {
    setError(null);
    setLoading(true);
    try {
      if (!(window as any).ethereum) {
        throw new Error("No Ethereum wallet found. Use the Demo Login options below or install MetaMask.");
      }
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const wallet_address = await signer.getAddress();

      const { message } = await api.getNonce(wallet_address);
      const signature = await signer.signMessage(message);

      const { token, user: authedUser } = await api.verify(wallet_address, message, signature, adminKey);
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

  // In-browser burner wallet: generates a random Ethereum keypair in memory and signs the challenge
  const connectWithBurnerWallet = useCallback(async (adminKey?: string) => {
    setError(null);
    setLoading(true);
    try {
      const burner = Wallet.createRandom();
      const wallet_address = burner.address;

      const { message } = await api.getNonce(wallet_address);
      const signature = await burner.signMessage(message);

      const { token, user: authedUser } = await api.verify(wallet_address, message, signature, adminKey);
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

  // 1-Click Demo Login to seeded roles
  const loginWithDemoRole = useCallback(async (role: "patient" | "doctor" | "admin") => {
    setError(null);
    setLoading(true);
    try {
      const { token, user: authedUser } = await api.demoLogin(role);
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

  return { user, loading, error, connectAndSignIn, connectWithBurnerWallet, loginWithDemoRole };
}

