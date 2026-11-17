from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import IN_ENV, RANK, ROLES, effective_role, require_role
from lib.db import db
from models.schemas import Business, Ok, Review, RoleIn, Settings, StatusIn, User, UsersOut
from routers.public import with_ratings

router = APIRouter(prefix="/admin", dependencies=[Depends(require_role("admin"))])


@router.put("/settings", response_model=Settings)
async def save_settings(body: Settings):
    await db.settings.update_one({"key": "main"}, {"$set": {**body.model_dump(), "key": "main"}}, upsert=True)
    return body


@router.get("/businesses", response_model=List[Business])
async def all_businesses(status: str = ""):
    filt = {"status": status} if status else {}
    docs = await db.businesses.find(filt, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return await with_ratings(docs)


@router.patch("/businesses/{id}", response_model=Ok)
async def set_status(id: str, body: StatusIn):
    res = await db.businesses.update_one({"id": id}, {"$set": {"status": body.status}})
    if not res.matched_count:
        raise HTTPException(404, "Empresa não encontrada")
    return Ok()


@router.get("/reviews", response_model=List[Review])
async def all_reviews():
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@router.delete("/reviews/{id}", response_model=Ok)
async def delete_review(id: str):
    res = await db.reviews.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(404, "Avaliação não encontrada")
    return Ok()


@router.get("/users", response_model=UsersOut)
async def list_users():
    people = await db.users.find(IN_ENV, {"_id": 0}).sort("name", 1).to_list(1000)
    return UsersOut(roles=ROLES, users=[User(**{**p, "role": effective_role(p.get("role"))}) for p in people])


@router.patch("/users/{user_id}/role", response_model=Ok)
async def set_role(user_id: str, body: RoleIn):
    if body.role not in RANK:
        raise HTTPException(403, "Papel inválido")
    target = await db.users.find_one({"id": user_id, **IN_ENV}, {"_id": 0})
    if target is None:
        raise HTTPException(404, "Usuário não encontrado")
    if body.role == "business" and not target.get("business_id"):
        raise HTTPException(400, "Este usuário não tem empresa cadastrada")
    if (effective_role(target.get("role")) == "admin" and body.role != "admin"
            and await db.users.count_documents({"role": "admin", **IN_ENV}) <= 1):
        raise HTTPException(409, "É preciso manter pelo menos um administrador")
    await db.users.update_one({"id": user_id}, {"$set": {"role": body.role}})
    return Ok()
