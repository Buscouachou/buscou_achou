"""Business owner panel — every query is scoped to the caller's own business_id."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_role
from lib.db import db
from models.schemas import (
    AvailabilityRequest,
    Business,
    BusinessBase,
    Ok,
    Product,
    ProductIn,
    RequestReply,
    User,
)

router = APIRouter(prefix="/me")
owner = require_role("business", "admin")


def bid(user: User) -> str:
    if not user.business_id:
        raise HTTPException(403, "Conta sem empresa vinculada")
    return user.business_id


@router.get("/business", response_model=Business)
async def my_business(user: User = Depends(owner)):
    doc = await db.businesses.find_one({"id": bid(user)}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Empresa não encontrada")
    return Business(**doc)


@router.put("/business", response_model=Business)
async def update_business(body: BusinessBase, user: User = Depends(owner)):
    await db.businesses.update_one({"id": bid(user)}, {"$set": body.model_dump()})
    return await my_business(user)


@router.get("/products", response_model=List[Product])
async def my_products(user: User = Depends(owner)):
    return await db.products.find({"business_id": bid(user)}, {"_id": 0}).sort("name", 1).to_list(1000)


@router.post("/products", response_model=Product)
async def add_product(body: ProductIn, user: User = Depends(owner)):
    p = Product(**body.model_dump(), business_id=bid(user))
    await db.products.insert_one(p.model_dump())
    return p


@router.put("/products/{id}", response_model=Product)
async def edit_product(id: str, body: ProductIn, user: User = Depends(owner)):
    res = await db.products.update_one({"id": id, "business_id": bid(user)}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(404, "Produto não encontrado")
    return Product(**body.model_dump(), id=id, business_id=bid(user))


@router.delete("/products/{id}", response_model=Ok)
async def delete_product(id: str, user: User = Depends(owner)):
    res = await db.products.delete_one({"id": id, "business_id": bid(user)})
    if not res.deleted_count:
        raise HTTPException(404, "Produto não encontrado")
    return Ok()


@router.get("/requests", response_model=List[AvailabilityRequest])
async def my_requests(user: User = Depends(owner)):
    return await db.requests.find({"business_id": bid(user)}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.patch("/requests/{id}", response_model=AvailabilityRequest)
async def reply_request(id: str, body: RequestReply, user: User = Depends(owner)):
    res = await db.requests.update_one({"id": id, "business_id": bid(user)}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(404, "Pedido não encontrado")
    doc = await db.requests.find_one({"id": id}, {"_id": 0})
    return AvailabilityRequest(**doc)
