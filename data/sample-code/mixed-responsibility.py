class UserController:
    def create_user(self, payload, repo, email_client, audit_client):
        if "email" not in payload:
            return {"error": "email required"}, 400
        existing = repo.find_by_email(payload["email"])
        if existing:
            return {"error": "exists"}, 409
        user = {
            "email": payload["email"].strip().lower(),
            "role": payload.get("role", "viewer"),
        }
        repo.insert(user)
        email_client.send_welcome(user["email"])
        audit_client.track("user_created", {"email": user["email"], "role": user["role"]})
        return {"ok": True, "user": user}, 201
