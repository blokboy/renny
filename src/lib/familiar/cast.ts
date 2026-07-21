import { generateText } from "ai";
import { getFamiliarModel, type ClassName } from "./router";

/**
 * The player's prompt is sent to the familiar verbatim — the prompt itself
 * is the entire "spell." No puzzle context is injected on their behalf;
 * crafting that context is the player's job.
 */
export async function castFamiliar(
  prompt: string,
  className?: ClassName,
): Promise<string> {
  const { text } = await generateText({
    model: getFamiliarModel(className),
    prompt,
  });

  return text;
}
