import { runtimeCapabilities, settings } from "@/config/settings";
import { systemPrompt } from "@/config/prompts";

export class LlmAdapter {
  isAvailable() {
    return runtimeCapabilities.llmEnabled;
  }

  async generate(prompt: string) {
    if (!this.isAvailable()) {
      return "";
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.groqApiKey}`,
        },
        body: JSON.stringify({
          model: settings.llmModel,
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        return "";
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return payload.choices?.[0]?.message?.content ?? "";
    } catch {
      return "";
    }
  }
}
