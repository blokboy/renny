import type { Metadata } from "next";
import { GuardianBattle } from "@/components/guardian/GuardianBattle";

export const metadata: Metadata = {
  title: "Threshold Guardian - Prompt Quest",
  description: "Fight the shrine's final gate and break its convergence shield.",
};

export default function GuardianPage() {
  return <GuardianBattle />;
}
