"""Idempotent seed: admin, demo customer, demo businesses in Jequié-BA. Run: python seed.py"""
import asyncio

from lib.db import db, ensure_indexes
from models.schemas import Banner, Business, Product, Review, Settings

U = "https://images.unsplash.com/"
Q = "?crop=entropy&cs=srgb&fm=jpg&w=900&q=75"
LOGO = "https://customer-assets-0z36b82j.emergentagent.net/job_mercado-local-24--7sr556y1/artifacts/fc429b38c8b8d71a_Logo01.png"

BUSINESSES = [
    ("acaraje-solange", "Acarajé & Moqueca da Solange", "Alimentação", "Comida baiana de verdade: acarajé, abará, moqueca e vatapá feitos na hora.",
     "photo-1583549322669-af8248a306c1", "Centro", "(73) 99911-0001", "Seg a Sáb, 16h às 22h",
     [("Acarajé completo", "Com vatapá, caruru, salada e camarão seco.", 12.0, "Salgados", "pronta", "photo-1740377015729-a28abd02ee8c"),
      ("Moqueca de peixe (2 pessoas)", "Acompanha arroz, pirão e farofa.", 79.9, "Pratos", "pronta", "photo-1583549322669-af8248a306c1"),
      ("Abará", "Bolinho de feijão fradinho cozido na folha de bananeira.", 10.0, "Salgados", "encomenda", "photo-1593195862084-ee9977ce3fe5")]),
    ("pizzaria-grill", "Pizzaria Jequié Grill", "Alimentação", "Pizzas no forno a lenha e grelhados para toda a família.",
     "photo-1593195862084-ee9977ce3fe5", "Jequiezinho", "(73) 99911-0002", "Todos os dias, 18h às 23h30",
     [("Pizza Calabresa G", "8 fatias, calabresa, cebola e azeitona.", 54.9, "Pizzas", "pronta", "photo-1593195862084-ee9977ce3fe5"),
      ("Pizza Frango com Catupiry G", "8 fatias, frango desfiado e catupiry.", 59.9, "Pizzas", "pronta", "photo-1593195862084-ee9977ce3fe5"),
      ("Picanha na chapa", "400g com fritas e vinagrete.", 89.0, "Grelhados", "indisponivel", "photo-1740377015729-a28abd02ee8c")]),
    ("farmacia-cidade-sol", "Farmácia Cidade Sol", "Farmácia", "Medicamentos, higiene e beleza com atendimento farmacêutico.",
     "photo-1773946836315-bd8269b62b93", "Joaquim Romão", "(73) 99911-0003", "Seg a Sáb, 7h às 22h · Dom, 8h às 14h",
     [("Dipirona 500mg (10 comp.)", "Analgésico e antitérmico.", 6.5, "Medicamentos", "pronta", "photo-1773946836315-bd8269b62b93"),
      ("Protetor solar FPS 50", "Frasco 200ml.", 49.9, "Beleza", "pronta", "photo-1773946836315-bd8269b62b93"),
      ("Medidor de pressão digital", "De pulso, com memória.", 139.0, "Saúde", "encomenda", "photo-1773946836315-bd8269b62b93")]),
    ("silva-celulares", "Silva Assistência Técnica Celulares", "Serviços", "Conserto de celulares, notebooks e acessórios com garantia.",
     "photo-1550041473-d296a3a8a18a", "Centro", "(73) 99911-0004", "Seg a Sex, 8h às 18h · Sáb, 8h às 12h",
     [("Troca de tela iPhone 11", "Peça de qualidade + 90 dias de garantia.", 389.0, "Reparos", "pronta", "photo-1550041473-d296a3a8a18a"),
      ("Troca de bateria Android", "Diversos modelos, consulte.", 120.0, "Reparos", "encomenda", "photo-1550041473-d296a3a8a18a"),
      ("Formatação de notebook", "Backup + instalação de sistema.", 100.0, "Informática", "pronta", "photo-1721332154191-ba5f1534266e")]),
    ("hortifruti-central", "Hortifruti Mercado Central", "Supermercado", "Frutas, verduras e legumes fresquinhos direto do produtor.",
     "photo-1764955307141-056b240923a1", "Mandacaru", "(73) 99911-0005", "Seg a Sáb, 6h às 19h",
     [("Banana prata (kg)", "Da roça para sua mesa.", 5.99, "Frutas", "pronta", "photo-1764955307141-056b240923a1"),
      ("Cesta de verduras", "Alface, couve, coentro e cebolinha.", 15.0, "Verduras", "pronta", "photo-1764955307141-056b240923a1"),
      ("Mel puro 500g", "Mel de abelha da região.", 25.0, "Mercearia", "pronta", "photo-1764955307141-056b240923a1")]),
    ("padaria-pao-quente", "Padaria Pão Quente", "Padaria", "Pães, bolos e salgados fresquinhos toda hora.",
     "photo-1583549323543-7ae855a78d6d", "São Judas Tadeu", "(73) 99911-0006", "Todos os dias, 5h30 às 20h",
     [("Pão francês (kg)", "Saindo do forno a cada hora.", 16.9, "Pães", "pronta", "photo-1583549323543-7ae855a78d6d"),
      ("Bolo de aipim", "Inteiro, aprox. 1kg.", 28.0, "Bolos", "encomenda", "photo-1583549323543-7ae855a78d6d")]),
]


async def main() -> None:
    await ensure_indexes()
    cust = "seed-customer"  # reviews author only; real accounts come from Google sign-in

    if not await db.settings.find_one({"key": "main"}):
        s = Settings(logo_url=LOGO, banners=[
            Banner(image=U + "photo-1740377015729-a28abd02ee8c" + Q, title="Sabores da Bahia", subtitle="Os melhores restaurantes de Jequié"),
            Banner(image=U + "photo-1764955307141-056b240923a1" + Q, title="Feira fresquinha", subtitle="Hortifruti e mercados do seu bairro"),
            Banner(image=U + "photo-1550041473-d296a3a8a18a" + Q, title="Precisa de conserto?", subtitle="Assistências técnicas perto de você"),
        ])
        await db.settings.insert_one({**s.model_dump(), "key": "main"})

    for i, (slug, name, cat, desc, img, bairro, wa, hours, prods) in enumerate(BUSINESSES):
        if await db.businesses.find_one({"name": name}):
            continue
        email = f"{slug}@buscouachou.com"
        biz = Business(name=name, category=cat, description=desc, logo=U + img + "?w=200&q=70&fm=jpg&crop=entropy",
                       cover=U + img + Q, whatsapp=wa, email=email, address=f"Rua Principal, {100 + i}",
                       neighborhood=bairro, city="Jequié", hours=hours, status="approved")
        biz.owner_id = ""  # demo stores have no linked owner
        await db.businesses.insert_one(biz.model_dump(exclude={"rating", "review_count"}))
        for pname, pdesc, price, pcat, avail, pimg in prods:
            await db.products.insert_one(Product(business_id=biz.id, name=pname, description=pdesc, price=price,
                                                 category=pcat, availability=avail, image=U + pimg + Q).model_dump())
        await db.reviews.insert_one(Review(business_id=biz.id, business_name=name, user_id=cust, user_name="Maria Cliente",
                                           rating=5 - (i % 2), comment="Atendimento ótimo, recomendo!").model_dump())
    print("seed ok")


if __name__ == "__main__":
    asyncio.run(main())
