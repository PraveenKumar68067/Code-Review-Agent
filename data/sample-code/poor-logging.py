def sync_invoice(invoice_id, client):
    print("starting sync")
    response = client.fetch(invoice_id)
    if response.status_code != 200:
        print("bad response", response.status_code)
        raise RuntimeError("sync failed")
    print("finished sync")
    return response.json()
