import type { Metadata } from "next";
import { randomInt } from "node:crypto";
import { LoadingTransition } from "@/components/loading/LoadingTransition";

export const metadata: Metadata = {
  title: "The Convocation awaits — Prompt Queen",
  description: "Prepare to enter the Convocation Trial.",
};

// A fresh request gets a fresh guide. Keeping the random choice on the server
// also means the first rendered frame and the hydrated client always agree.
export const dynamic = "force-dynamic";

export default function LoadingPage() {
  const wraithNumber = randomInt(1, 4);

  return <LoadingTransition wraithNumber={wraithNumber} />;
}
