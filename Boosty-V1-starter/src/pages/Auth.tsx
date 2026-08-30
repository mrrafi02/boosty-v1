import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Logo from "../components/Logo";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message); else navigate("/dashboard");
    setBusy(false);
  };

  return <AuthCard title="Welcome back" subtitle="Sign in to your Boosty account">
    <form onSubmit={submit} className="space-y-4">
      <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
      <div className="flex justify-between text-sm"><Link className="text-boosty-300" to="/forgot-password">Forgot password?</Link><Link className="text-slate-400" to="/register">Create account</Link></div>
    </form>
  </AuthCard>;
}

export function Register() {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { name: form.name, username: form.username } } });
    if (error) setError(error.message);
    else if (data.session) navigate("/dashboard");
    else setError("Registration successful. Check your email to confirm your account.");
    setBusy(false);
  };
  return <AuthCard title="Create your Boosty account" subtitle="Start with a free account">
    <form onSubmit={submit} className="space-y-4">
      {(["name","username","email","password","confirm"] as const).map(key => <input key={key} className="input" type={key === "email" ? "email" : key.includes("password") || key === "confirm" ? "password" : "text"} placeholder={key === "confirm" ? "Confirm Password" : key[0].toUpperCase()+key.slice(1)} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />)}
      {error && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating..." : "Create Account"}</button>
      <div className="text-center text-sm text-slate-400">Already registered? <Link className="text-boosty-300" to="/login">Login</Link></div>
    </form>
  </AuthCard>;
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="grid min-h-[calc(100vh-150px)] place-items-center px-4 py-12"><div className="w-full max-w-md"><div className="mb-8 flex justify-center"><Logo /></div><div className="card p-7 md:p-8"><h1 className="text-2xl font-bold text-white">{title}</h1><p className="mt-2 text-sm text-slate-400">{subtitle}</p><div className="mt-7">{children}</div></div></div></div>;
}

export function ForgotPassword() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(""); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) setError(error.message); else setMessage("Password reset email sent."); };
  return <AuthCard title="Reset password" subtitle="We'll send you a secure reset link"><form onSubmit={submit} className="space-y-4"><input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />{message && <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}{error && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}<button className="btn-primary w-full">Send reset link</button><Link className="block text-center text-sm text-boosty-300" to="/login">Back to login</Link></form></AuthCard>;
}