"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Menu,
  Play,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useState, type CSSProperties } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";

const NAV_LINKS = [
  { label: "Create Hero", href: "/character/create" },
  { label: "Convocation", href: "/convocation" },
  { label: "Your Character", href: "/character/recap" },
  { label: "Guardian", href: "/guardian" },
  { label: "The Realm", href: "/dev/assets" },
] as const;

function delay(milliseconds: number): CSSProperties {
  return { animationDelay: `${milliseconds}ms` };
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="font-deltarune relative isolate flex h-svh flex-col overflow-hidden bg-black text-white">
      <video
        className="fixed inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

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

        <div className="hidden items-center gap-7 lg:flex xl:gap-10">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              className="animate-blur-fade-up text-sm text-white transition-colors hover:text-gray-300"
              style={delay(100 + index * 50)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="liquid-glass animate-blur-fade-up hidden items-center gap-2 rounded-full px-4 py-2 text-sm transition-transform hover:scale-[1.03] sm:flex md:px-6"
            style={delay(350)}
          >
            <span>Search</span>
            <Search size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="liquid-glass animate-blur-fade-up hidden h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105 sm:flex"
            style={delay(400)}
            aria-label="Open profile"
          >
            <User size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="liquid-glass animate-blur-fade-up relative flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
            style={delay(350)}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <Menu
              size={20}
              className={`absolute transition-all duration-500 ease-out ${
                menuOpen ? "rotate-180 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
              }`}
              aria-hidden="true"
            />
            <X
              size={20}
              className={`absolute transition-all duration-500 ease-out ${
                menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-50 opacity-0"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={`absolute top-[72px] inset-x-0 z-40 border-y border-gray-800 bg-gray-900/95 px-4 py-4 shadow-2xl backdrop-blur-lg transition-all duration-500 ease-out lg:hidden ${
          menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-3 py-3 text-sm transition-all duration-500 hover:bg-gray-800/50 ${
                menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex gap-3 border-t border-gray-800 pt-4 sm:hidden">
          <button type="button" className="liquid-glass flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm">
            Search <Search size={18} aria-hidden="true" />
          </button>
          <button type="button" className="liquid-glass flex h-10 w-10 items-center justify-center rounded-full" aria-label="Open profile">
            <User size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <section className="relative z-10 flex flex-1 flex-col justify-end px-4 pb-8 sm:px-6 md:px-12 md:pb-16">
        <div className="flex flex-col items-end gap-8 md:flex-row">
          <div className="min-w-0 flex-1">
            <div
              className="animate-blur-fade-up mb-6 flex flex-wrap items-center gap-3 text-xs sm:mb-8 sm:gap-6 sm:text-sm"
              style={delay(300)}
            >
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 fill-white sm:h-5 sm:w-5" aria-hidden="true" />
                Prompt-powered
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                Your pace
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                Begin now
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
              Cross the Convocation and challenge the shrine&rsquo;s final gate.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/character/create"
                className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-medium text-black transition-colors hover:bg-gray-200 sm:px-8 sm:py-3"
                style={delay(600)}
              >
                <Play size={18} fill="black" aria-hidden="true" />
                Create your hero
              </Link>
              <Link
                href="/convocation"
                className="liquid-glass animate-blur-fade-up rounded-full px-6 py-2.5 font-medium transition-transform hover:scale-[1.03] sm:px-8 sm:py-3"
                style={delay(700)}
              >
                Enter the Convocation
              </Link>
            </div>
          </div>

          <div className="flex w-full gap-3 md:w-auto md:justify-end">
            <button
              type="button"
              className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2.5 transition-transform hover:scale-[1.03] sm:px-6 sm:py-3"
              style={delay(800)}
              aria-label="Previous scene"
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              type="button"
              className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2.5 transition-transform hover:scale-[1.03] sm:px-6 sm:py-3"
              style={delay(900)}
              aria-label="Next scene"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
