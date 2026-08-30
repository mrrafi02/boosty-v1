import { ArrowUpRight } from "lucide-react";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-boosty-500 to-violet-500 shadow-lg shadow-boosty-600/20">
        <ArrowUpRight className="h-6 w-6 text-white" strokeWidth={2.5} />
      </div>
      {!compact && <span className="text-xl font-extrabold tracking-tight text-white">Boosty</span>}
    </div>
  );
}