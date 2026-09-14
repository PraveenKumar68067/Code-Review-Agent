from flask import Blueprint, request, jsonify

bp = Blueprint("orders", __name__)


@bp.route("/orders", methods=["POST"])
def create_order():
    payload = request.get_json() or {}
    customer_id = payload.get("customer_id")
    items = payload.get("items", [])
    total = 0
    for item in items:
        if item.get("vip"):
            total += item["price"] * 0.8
        else:
            total += item["price"]
    if total > 1000:
        total -= 50
    conn = get_db()
    conn.execute("insert into orders(customer_id, total, item_count) values (?, ?, ?)", (customer_id, total, len(items)))
    conn.commit()
    print("created order", customer_id, total)
    return jsonify({"ok": True, "total": total})
