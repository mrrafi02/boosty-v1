import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-7 w-fit"><Logo /></div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">Social Growth <span className="text-boosty-500">Made Simple.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">A clean, fast and transparent SMM panel for managing your social growth orders.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2">Create Free Account <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/services" className="btn-secondary">Browse Services</Link>
          </div>
        </div>
        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {[
            ["Simple ordering", "Choose a platform, service, quantity and place your order in seconds.", Zap],
            ["Transparent manual flow", "Orders are submitted to Boosty and handled manually by the admin.", CheckCircle2],
            ["Secure accounts", "Supabase authentication and database policies protect user data.", ShieldCheck]
          ].map(([title, text, Icon]) => (
            <div className="card p-6" key={title as string}><Icon className="h-6 w-6 text-boosty-400" /><h3 className="mt-5 font-bold text-white">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text as string}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}