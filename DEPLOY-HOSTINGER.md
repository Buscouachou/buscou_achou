# Publicar o Buscou Achou na Hostinger

## 1. Plano necessário
O site tem **backend Python (FastAPI) + banco MongoDB**. Hospedagem compartilhada/Premium/Business da Hostinger **não roda isso**.
Use um **VPS da Hostinger** (KVM 1 ou 2) com o template **"Ubuntu 24.04 com Docker"**.

## 2. Login com Google (Clerk) — conta própria
O Clerk que vinha no projeto era gerenciado pela plataforma onde ele foi criado e **não acompanha o código**. Crie o seu:
1. Crie uma conta grátis em https://clerk.com e um aplicativo; ative **Google** em *User & authentication > Social connections*.
2. Crie a instância de **Produção** e informe seu domínio. Em produção o Google exige credenciais OAuth próprias (Google Cloud Console); o Clerk mostra o passo a passo e a *redirect URI*.
3. Copie `pk_live_...` e `sk_live_...` (Configure > API keys) para o `.env`.
4. Ative o **proxy do Frontend API** do Clerk apontando para `https://SEU-DOMINIO/api/__clerk` (o backend já faz esse relay).

## 3. Domínio
No DNS da Hostinger, crie um registro **A** do domínio (e `www`, se quiser) apontando para o **IP do VPS**.

## 4. Subir o site (no VPS, via SSH)
```bash
# envie a pasta (scp/SFTP ou git) e entre nela
cd buscou-achou
cp .env.example .env && nano .env     # DOMAIN, chaves do Clerk, ADMIN_EMAIL
docker compose up -d --build
docker compose exec backend python seed.py   # opcional: 6 empresas de exemplo
```
O HTTPS (Let's Encrypt) é emitido automaticamente pelo Caddy quando o DNS já aponta para o VPS.

## 5. Permissões (iguais ao original)
- **admin**: e-mails em `ADMIN_EMAIL` viram admin no 1º login com Google (e-mail verificado). Acessa `/admin`: empresas, identidade visual, avaliações, usuários e acessos.
- **business**: quem envia `/cadastro-empresa` vira dono; a empresa fica *pendente* até o admin aprovar. Painel em `/painel-empresa`.
- **customer**: padrão no 1º login; pode avaliar (1 avaliação por loja).

## 6. Antes de divulgar
- **Logo/favicon**: ainda apontam para um endereço de arquivo da plataforma antiga (`emergentagent.net`). Hospede a logo no seu domínio (ou outro serviço) e troque em `/admin > Identidade visual`, em `frontend/index.html` e em `frontend/src/lib/hooks.ts`.
- **Backup**: `docker compose exec mongo mongodump --archive > backup.archive` (agende semanalmente).
- Atualizar o site: envie o código novo e rode `docker compose up -d --build`.
