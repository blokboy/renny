"use client";

import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { BackgroundVideo } from "@/components/BackgroundVideo";

function delay(milliseconds: number): CSSProperties {
  return { animationDelay: `${milliseconds}ms` };
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.28-1.29-5.28-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.72 5.39-5.3 5.68.42.36.79 1.06.79 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="font-deltarune relative isolate flex h-svh flex-col overflow-hidden bg-black text-white">
      <BackgroundVideo />

      <div className="bottom-blur-mask fixed inset-0 z-[1] pointer-events-none" aria-hidden="true" />

      <nav className="relative z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 md:py-6">
        <Link
          href="/"
          className="font-grape-soda animate-blur-fade-up text-4xl leading-none text-[#fff6d5] drop-shadow-[0_2px_0_#713c91] md:text-5xl"
          style={delay(0)}
          aria-label="Prompt Queen home"
        >
          PQ
        </Link>

        <a
          href="https://github.com/blokboy/renny"
          target="_blank"
          rel="noreferrer"
          className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-transform hover:scale-[1.03] md:px-6"
          style={delay(350)}
        >
          <span>GitHub</span>
          <GitHubMark />
        </a>
      </nav>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-6 md:items-stretch md:justify-end md:px-12 md:pb-16 md:text-left">
        <div className="flex min-w-0 flex-col items-center md:items-start">
          <div
            className="animate-blur-fade-up mb-6 flex flex-wrap items-center gap-3 text-xs sm:mb-8 sm:gap-6 sm:text-sm"
            style={delay(300)}
          >
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 fill-white sm:h-5 sm:w-5" aria-hidden="true" />
              Prompt-powered
            </span>
          </div>

          <h1
            className="font-grape-soda animate-blur-fade-up mb-4 max-w-5xl text-6xl leading-[0.82] font-normal tracking-[-0.04em] text-[#fff6d5] drop-shadow-[0_4px_0_#713c91] sm:text-7xl md:mb-6 md:text-8xl lg:text-[8.5rem]"
            style={delay(400)}
          >
            Prompt Queen
          </h1>

          <p
            className="animate-blur-fade-up mb-6 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg md:mb-12 md:text-xl"
            style={delay(500)}
          >
            Solo or Multiplayer Prompt Puzzle Platformer
          </p>

          <Link
            href="/loading"
            className="liquid-glass animate-blur-fade-up flex w-fit items-center gap-2 rounded-full px-6 py-2.5 font-medium hover:scale-[1.03] sm:px-8 sm:py-3"
            style={delay(600)}
          >
            <Play size={18} aria-hidden="true" />
            Begin your trial
          </Link>
        </div>
      </section>
    </main>
  );
}
