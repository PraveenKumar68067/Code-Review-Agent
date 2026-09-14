import { describe, expect, it } from "vitest";

import { parseCode } from "@/lib/parser";

describe("parseCode", () => {
  it("detects heavy route smells", () => {
    const code = `
@bp.route("/orders", methods=["POST"])
def create_order():
    payload = request.get_json()
    total = 0
    for item in payload["items"]:
        total += item["price"]
    repo.insert(total)
`;
    const result = parseCode(code, "python");
    expect(result.routeHandlers).toBeGreaterThanOrEqual(1);
    expect(result.hasBusinessLogicInRoute).toBe(true);
    expect(result.hasDbCalls).toBe(true);
  });
});
