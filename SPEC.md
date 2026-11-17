# Buscou Achou — SPEC

Marketplace/catálogo local (Jequié-BA, multi-cidade via campo `city`). Sem checkout/pagamento: conversão via WhatsApp.

## Roles (Google login via Emergent-managed Clerk; frontend sends Bearer token from useAuth().getToken)
Users stored in `users` keyed by Clerk id (`id`), with role/name/email/env. Role list in backend/lib/auth.py ROLES = admin, business, customer.
- customer: default on first Google sign-in; can review stores (1 per store).
- business: a signed-in user submits /cadastro-empresa (POST /api/businesses/apply) → business `pending`, user becomes business owner; panel /painel-empresa.
- admin: emails in ADMIN_EMAIL become admin on first sign-in; /admin → Empresas, Identidade visual, Avaliações, Usuários e acessos (GET /api/admin/users, PATCH /api/admin/users/{id}/role; keeps ≥1 admin → 409).

## Data (Mongo, string uuid ids)
users, businesses(status pending|approved|rejected), products(availability pronta|encomenda|indisponivel), requests(status pending|available|unavailable), reviews, settings(key="main").
Only approved businesses appear publicly. Imagens = URLs.

## Key flows
Home busca (/search?q → empresas+produtos), chips de categoria, banners → /loja/:id → "Consultar disponibilidade" (POST /api/requests, sem login) → sucesso com link WhatsApp → loja responde no painel (marca status + abre wa.me do cliente).
Admin muda cores → CSS vars --brand-primary/--brand-secondary aplicadas no Layout.

## Seed (`cd backend && python seed.py`, idempotent)
6 empresas aprovadas (Acarajé & Moqueca da Solange, Pizzaria Jequié Grill, Farmácia Cidade Sol, Silva Assistência Técnica Celulares, Hortifruti Mercado Central, Padaria Pão Quente), 2-3 produtos cada, 1 review cada (Maria Cliente), 3 banners. Seed has no user accounts. Credentials: memory/test_credentials.md
