export function generateFixExample(category: string) {
  const examples: Record<string, string> = {
    validation: `if "email" not in payload or not payload["email"]:\n  return {"error": "email is required"}, 400`,
    reliability: `try:\n  repo.insert(record)\nexcept Exception:\n  logger.exception("failed_to_insert_record", extra={"record_id": record_id})\n  return {"error": "temporary failure"}, 500`,
    architecture: `result = order_service.create_order(payload)\nreturn jsonify(result), 201`,
    maintainability: `def calculate_total(items):\n    # Shared helper reused by cart and checkout flows.\n    ...`,
    logging: `logger.error("invoice_sync_failed", extra={"invoice_id": invoice_id, "status_code": response.status_code})`,
    naming: `validated_user_payload = normalize_user_payload(payload)`,
  };

  return examples[category] ?? "";
}
