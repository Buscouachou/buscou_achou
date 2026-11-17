"""Roles live in our `users` collection keyed by the Clerk user id (`id`). Clerk owns identity."""
import os

import requests
from fastapi import Depends, HTTPException, Request
from pymongo import ReturnDocument
from starlette.concurrency import run_in_threadpool

from clerk_auth import require_user
from lib.db import db
from models.schemas import User

# Role list is code (ships on every publish). Highest first; keep `admin`.
ROLES = ["admin", "business", "customer"]
DEFAULT_ROLE = "customer"
RETIRED_ROLES: dict[str, str] = {}
RANK = {r: len(ROLES) - i for i, r in enumerate(ROLES)}

ENV = "live" if os.environ.get("CLERK_PUBLISHABLE_KEY", "").startswith("pk_live_") else "preview"
IN_ENV = {"env": {"$in": [ENV, None]}}


def effective_role(role) -> str:
    role = RETIRED_ROLES.get(role, role)
    return role if role in ROLES else DEFAULT_ROLE


def _clerk_profile(user_id: str) -> dict:
    """One Clerk lookup on first sign-in: name, primary email, and whether it's an ADMIN_EMAIL."""
    admins = {e.strip().lower() for e in os.environ.get("ADMIN_EMAIL", "").split(",") if e.strip()}
    r = requests.get(f"https://api.clerk.com/v1/users/{user_id}", timeout=10,
                     headers={"Authorization": f"Bearer {os.environ['CLERK_SECRET_KEY']}", "User-Agent": "emergent-app"})
    r.raise_for_status()
    u = r.json()
    emails = u.get("email_addresses") or []
    primary = next((e for e in emails if e["id"] == u.get("primary_email_address_id")), emails[0] if emails else None)
    email = primary["email_address"].lower() if primary else ""
    name = " ".join(x for x in [u.get("first_name"), u.get("last_name")] if x) or email.split("@")[0] or "Usuário"
    is_admin = any(e["email_address"].lower() in admins and (e.get("verification") or {}).get("status") == "verified" for e in emails)
    return {"email": email, "name": name, "is_admin": is_admin}


async def current_user(user: dict = Depends(require_user)) -> User:
    uid = user["user_id"]
    member = await db.users.find_one({"id": uid}, {"_id": 0})
    if member is None or not member.get("role"):  # first sign-in
        p = await run_in_threadpool(_clerk_profile, uid)
        role = "admin" if p["is_admin"] else DEFAULT_ROLE
        member = await db.users.find_one_and_update(
            {"id": uid},
            {"$set": {"role": role, "email": p["email"], "name": p["name"]}, "$setOnInsert": {"id": uid, "business_id": None}},
            upsert=True, projection={"_id": 0}, return_document=ReturnDocument.AFTER,
        )
    if member.get("env") != ENV:
        await db.users.update_one({"id": uid}, {"$set": {"env": ENV}})
    return User(**{**member, "role": effective_role(member.get("role"))})


async def optional_user(request: Request) -> User | None:
    if not request.headers.get("authorization") and not request.cookies.get("__session"):
        return None
    try:
        return await current_user(require_user(request))
    except HTTPException:
        return None


def require_role(*roles: str):
    async def dep(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, "Sem permissão")
        return user

    return dep
