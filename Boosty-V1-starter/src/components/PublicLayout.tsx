import { Link, Outlet } from "react-router-dom";
import Logo from "./Logo";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Boosty. Social Growth Made Simple.
      </footer>
    </div>
  );
}