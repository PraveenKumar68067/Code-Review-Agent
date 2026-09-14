import { runtimeCapabilities, settings } from "@/config/settings";

export class HindsightAdapter {
  private bankId = settings.hindsightBankId;

  isAvailable() {
    return runtimeCapabilities.hindsightEnabled;
  }

  async retrieve(query: Record<string, unknown>) {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await fetch(
        `${settings.hindsightBaseUrl.replace(/\/$/, "")}/v1/default/banks/${this.bankId}/memories/recall`,
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.hindsightApiKey}`,
        },
          body: JSON.stringify({
            query: query.query ?? "",
            budget: "mid",
            max_tokens: 1200,
          }),
        },
      );

      if (!response.ok) {
        return [];
      }
      const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
      return payload.results ?? [];
    } catch {
      return [];
    }
  }

  async save(item: Record<string, unknown>) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const content =
        typeof item.content === "string"
          ? item.content
          : typeof item.notes === "string"
            ? item.notes
            : typeof item.issueTitle === "string"
              ? item.issueTitle
              : JSON.stringify(item);

      const response = await fetch(
        `${settings.hindsightBaseUrl.replace(/\/$/, "")}/v1/default/banks/${this.bankId}/memories`,
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.hindsightApiKey}`,
        },
          body: JSON.stringify({
            items: [
              {
                content,
                metadata: item,
              },
            ],
          }),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
