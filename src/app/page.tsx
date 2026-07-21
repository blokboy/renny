import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-50">
      <h1 className="text-4xl font-bold tracking-tight">Prompt Quest</h1>
      <p className="text-zinc-400">App shell online. Combat coming soon.</p>
      <Link
        href="/character/create"
        className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
      >
        Create your hero
      </Link>
    </div>
  );
}
