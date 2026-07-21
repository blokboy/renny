import type { Metadata } from "next";
import { AssetDemo } from "@/components/assets/AssetDemo";

export const metadata: Metadata = {
  title: "Asset system demo — Prompt Quest",
  description:
    "Debug page for the shared sprite composition and background/tileset asset system.",
};

export default function AssetsDemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white">Asset system</h1>
          <p className="text-zinc-400">
            Debug/demo page for the shared visual asset system (see{" "}
            <code>docs/adr/0001-shared-asset-system.md</code>) that Character Creation, the
            Convocation, and the Town Hub build on top of.
          </p>
        </header>
        <AssetDemo />
      </main>
    </div>
  );
}
