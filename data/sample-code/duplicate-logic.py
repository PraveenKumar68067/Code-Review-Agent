def calculate_cart_total(items):
    total = 0
    for item in items:
        if item.get("discount"):
            total += item["price"] - item["discount"]
        else:
            total += item["price"]
    if total > 200:
        total -= 20
    return total


def calculate_checkout_total(items):
    total = 0
    for item in items:
        if item.get("discount"):
            total += item["price"] - item["discount"]
        else:
            total += item["price"]
    if total > 200:
        total -= 20
    return total
