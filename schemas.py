import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


def _id() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


Role = Literal["admin", "business", "customer"]
BizStatus = Literal["pending", "approved", "rejected"]
Availability = Literal["pronta", "encomenda", "indisponivel"]
ReqStatus = Literal["pending", "available", "unavailable"]


# ---------- auth ----------
class User(BaseModel):
    id: str
    email: str
    name: str
    role: Role
    business_id: Optional[str] = None


class RoleIn(BaseModel):
    role: str


class UsersOut(BaseModel):
    roles: List[str]
    users: List[User]


# ---------- settings ----------
class Banner(BaseModel):
    id: str = Field(default_factory=_id)
    image: str
    title: str = ""
    subtitle: str = ""


class Settings(BaseModel):
    platform_name: str = "Buscou Achou"
    logo_url: str = ""
    primary_color: str = "#0B5CA8"
    secondary_color: str = "#F5F0E6"
    city: str = "Jequié - BA"
    hero_title: str = "Tudo o que você procura em Jequié, num só lugar."
    hero_subtitle: str = "Encontre lojas, produtos e serviços da sua cidade e fale direto pelo WhatsApp."
    hero_image: str = ""
    banners: List[Banner] = []


# ---------- businesses ----------
class BusinessBase(BaseModel):
    name: str = Field(min_length=2)
    category: str
    description: str = ""
    logo: str = ""
    cover: str = ""
    whatsapp: str = Field(min_length=8)
    email: str = ""
    address: str = ""
    neighborhood: str = ""
    city: str = "Jequié"
    hours: str = ""


class Business(BusinessBase):
    id: str = Field(default_factory=_id)
    status: BizStatus = "pending"
    owner_id: str = ""
    created_at: datetime = Field(default_factory=_now)
    rating: float = 0
    review_count: int = 0


class StatusIn(BaseModel):
    status: BizStatus


# ---------- products ----------
class ProductIn(BaseModel):
    name: str = Field(min_length=2)
    description: str = ""
    price: float = Field(ge=0)
    image: str = ""
    category: str = "Geral"
    availability: Availability = "pronta"


class Product(ProductIn):
    id: str = Field(default_factory=_id)
    business_id: str


class ProductHit(Product):
    business_name: str = ""


class SearchOut(BaseModel):
    businesses: List[Business]
    products: List[ProductHit]


# ---------- availability requests ----------
class RequestIn(BaseModel):
    business_id: str
    product_id: Optional[str] = None
    customer_name: str = Field(min_length=2)
    customer_whatsapp: str = Field(min_length=8)
    customer_email: str = ""
    quantity: int = Field(default=1, ge=1)
    notes: str = ""


class AvailabilityRequest(RequestIn):
    id: str = Field(default_factory=_id)
    product_name: str = ""
    status: ReqStatus = "pending"
    reply: str = ""
    created_at: datetime = Field(default_factory=_now)


class RequestReply(BaseModel):
    status: ReqStatus
    reply: str = ""


# ---------- reviews ----------
class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class Review(ReviewIn):
    id: str = Field(default_factory=_id)
    business_id: str
    business_name: str = ""
    user_id: str
    user_name: str
    created_at: datetime = Field(default_factory=_now)


class Ok(BaseModel):
    ok: bool = True
