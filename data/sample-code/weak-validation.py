def register_user(payload, repo):
    email = payload["email"]
    age = payload.get("age")
    country = payload.get("country")
    user = {
        "email": email.strip(),
        "age": int(age),
        "country": country.lower(),
    }
    return repo.save_user(user)
