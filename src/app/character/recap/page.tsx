import type { Metadata } from "next";
import { RecapView } from "@/components/character";

export const metadata: Metadata = {
  title: "Your hero — Prompt Quest",
  description: "Recap of the hero you just created.",
};

export default function CharacterRecapPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white">Your Hero</h1>
        </header>
        <RecapView />
      </main>
    </div>
  );
}
