import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import current_user, optional_user, require_role
from lib.db import db
from models.schemas import (
    AvailabilityRequest,
    Business,
    BusinessBase,
    Product,
    ProductHit,
    RequestIn,
    Review,
    ReviewIn,
    SearchOut,
    Settings,
    User,
    _id,
)

router = APIRouter()


async def get_settings() -> Settings:
    doc = await db.settings.find_one({"key": "main"})
    return Settings(**doc) if doc else Settings()


async def with_ratings(docs: list[dict]) -> List[Business]:
    ids = [d["id"] for d in docs]
    agg = await db.reviews.aggregate([
        {"$match": {"business_id": {"$in": ids}}},
        {"$group": {"_id": "$business_id", "avg": {"$avg": "$rating"}, "n": {"$sum": 1}}},
    ]).to_list(None)
    stats = {a["_id"]: a for a in agg}
    out = []
    for d in docs:
        s = stats.get(d["id"])
        out.append(Business(**{**d, "rating": round(s["avg"], 1) if s else 0, "review_count": s["n"] if s else 0}))
    return out


@router.get("/settings", response_model=Settings)
async def settings():
    return await get_settings()


@router.get("/businesses", response_model=List[Business])
async def list_businesses(q: str = "", category: str = "", city: str = ""):
    filt: dict = {"status": "approved"}
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        filt["$or"] = [{"name": rx}, {"description": rx}, {"category": rx}, {"neighborhood": rx}]
    if category:
        filt["category"] = category
    if city:
        filt["city"] = {"$regex": re.escape(city), "$options": "i"}
    docs = await db.businesses.find(filt, {"_id": 0}).sort("name", 1).to_list(500)
    return await with_ratings(docs)


@router.get("/search", response_model=SearchOut)
async def search(q: str = ""):
    businesses = await list_businesses(q=q)
    hits: List[ProductHit] = []
    if q:
        approved = {b["id"]: b["name"] async for b in db.businesses.find({"status": "approved"}, {"id": 1, "name": 1})}
        rx = {"$regex": re.escape(q), "$options": "i"}
        prods = await db.products.find(
            {"business_id": {"$in": list(approved)}, "$or": [{"name": rx}, {"description": rx}, {"category": rx}]},
            {"_id": 0},
        ).to_list(100)
        hits = [ProductHit(**p, business_name=approved[p["business_id"]]) for p in prods]
    return SearchOut(businesses=businesses, products=hits)


@router.get("/businesses/{id}", response_model=Business)
async def get_business(id: str, user: Optional[User] = Depends(optional_user)):
    doc = await db.businesses.find_one({"id": id}, {"_id": 0})
    visible = doc and (
        doc["status"] == "approved" or (user and (user.role == "admin" or user.business_id == id))
    )
    if not visible:
        raise HTTPException(404, "Empresa não encontrada")
    return (await with_ratings([doc]))[0]


@router.get("/businesses/{id}/products", response_model=List[Product])
async def business_products(id: str):
    return await db.products.find({"business_id": id}, {"_id": 0}).sort("category", 1).to_list(500)


@router.get("/businesses/{id}/reviews", response_model=List[Review])
async def business_reviews(id: str):
    return await db.reviews.find({"business_id": id}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.post("/businesses/{id}/reviews", response_model=Review)
async def add_review(id: str, body: ReviewIn, user: User = Depends(require_role("customer", "admin"))):
    biz = await db.businesses.find_one({"id": id, "status": "approved"})
    if not biz:
        raise HTTPException(404, "Empresa não encontrada")
    review = Review(**body.model_dump(), business_id=id, business_name=biz["name"], user_id=user.id, user_name=user.name)
    # one review per customer per store: re-submitting updates it
    await db.reviews.delete_many({"business_id": id, "user_id": user.id})
    await db.reviews.insert_one(review.model_dump())
    return review


@router.post("/businesses/apply", response_model=Business)
async def apply(body: BusinessBase, user: User = Depends(current_user)):
    """A signed-in (Google) user requests a business listing; they become its owner."""
    if user.business_id or user.role == "business":
        raise HTTPException(409, "Sua conta já possui uma empresa cadastrada")
    biz = Business(**body.model_dump(), owner_id=user.id)
    if not biz.email:
        biz.email = user.email
    await db.businesses.insert_one(biz.model_dump(exclude={"rating", "review_count"}))
    new_role = "admin" if user.role == "admin" else "business"
    await db.users.update_one({"id": user.id}, {"$set": {"business_id": biz.id, "role": new_role}})
    return biz


@router.post("/requests", response_model=AvailabilityRequest)
async def create_request(body: RequestIn):
    biz = await db.businesses.find_one({"id": body.business_id, "status": "approved"})
    if not biz:
        raise HTTPException(404, "Empresa não encontrada")
    product_name = ""
    if body.product_id:
        p = await db.products.find_one({"id": body.product_id, "business_id": body.business_id})
        if not p:
            raise HTTPException(404, "Produto não encontrado")
        product_name = p["name"]
    req = AvailabilityRequest(**body.model_dump(), product_name=product_name)
    await db.requests.insert_one(req.model_dump())
    return req
