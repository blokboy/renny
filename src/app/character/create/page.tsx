import type { Metadata } from "next";
import { CreationWizard } from "@/components/character";

export const metadata: Metadata = {
  title: "Create your hero — Prompt Quest",
  description: "Name your hero and choose your look.",
};

export default function CharacterCreatePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white">Character Creation</h1>
          <p className="text-zinc-400">
            Name your hero and choose your look. You&apos;ll pick a class later.
          </p>
        </header>
        <CreationWizard />
      </main>
    </div>
  );
}
