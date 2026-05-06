"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fn = mode === "login" ? "signInWithPassword" : "signUp";
    const { error } = await supabase.auth[fn]({ email, password });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    if (mode === "signup") { setMsg("Account created! Logging in..."); }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handle}>
        <h1>📋 Task Tracker</h1>
        <p className="sub">{mode === "login" ? "Sign in to your account" : "Create a new account"}</p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
        </button>
        {msg && <div className="msg">{msg}</div>}
        <div className="toggle" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "No account? Create one" : "Have an account? Sign in"}
        </div>
      </form>
    </div>
  );
}
