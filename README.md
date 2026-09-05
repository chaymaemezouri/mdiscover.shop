# Kamira Cosmetics — Plateforme E-commerce

Monorepo complet pour la plateforme e-commerce cosmétique de luxe (cahier des charges v1.0).

## Architecture

```
mdiscovershop/
├── apps/
│   ├── api/          # NestJS — API REST (port 4000)
│   ├── web/          # Next.js — Site public (port 3000)
│   └── admin/        # Next.js — Panel admin (port 3001)
├── packages/
│   └── shared/       # Types, enums, constantes partagés
├── docker/
│   └── docker-compose.dev.yml   # PostgreSQL, Redis, MinIO
├── .env.example
└── package.json      # npm workspaces
```

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Admin | Next.js 14, Recharts |
| Backend | NestJS 10, Prisma, PostgreSQL 16 |
| Auth | JWT + Refresh tokens |
| Paiement | Stripe (Payment Intents) |
| Livraison | Amana Express (structure prête) |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |

## Démarrage rapide

### 1. Prérequis

- Node.js 20+
- Docker Desktop (pour PostgreSQL, Redis, MinIO)

### 2. Installation

```bash
# Cloner et installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env
cp .env.example apps/api/.env

# Démarrer les services Docker
npm run docker:dev

# Générer le client Prisma et migrer la base
npm run db:generate
npm run db:migrate

# Peupler avec des données de test
npm run db:seed
```

### 3. Lancer en développement

```bash
# Tous les services en parallèle
npm run dev

# Ou individuellement
npm run dev:api    # http://localhost:4000/api/v1
npm run dev:web    # http://localhost:3000
npm run dev:admin  # http://localhost:3001
```

### 4. Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@kamiracosmetics.ma | Admin123! |
| Client | client@example.com | Client123! |

## URLs

| Service | URL |
|---------|-----|
| Site public | http://localhost:3000 |
| Admin panel | http://localhost:3001 |
| API REST | http://localhost:4000/api/v1 |
| Swagger docs | http://localhost:4000/docs |
| MinIO console | http://localhost:9001 |
| Prisma Studio | `npm run db:studio` |

## Modules API

- **auth** — Inscription, connexion client & admin, refresh token
- **products** — Catalogue, filtres, fiche produit, featured
- **categories** — Arborescence catégories
- **cart** — Panier (session invité + utilisateur)
- **orders** — Création commande, suivi, historique
- **coupons** — Validation codes promo
- **cms** — Bannières, pages statiques, blog
- **newsletter** — Inscription newsletter
- **admin** — Dashboard, produits, commandes (protégé JWT admin)
- **health** — Health check

## Frontend (Site public)

- Page d'accueil (hero, nouveautés, bestsellers, newsletter)
- Catalogue avec filtres et tri
- Fiche produit (variantes, avis, INCI)
- Panier avec codes promo et livraison gratuite
- Checkout multi-étapes (Stripe + COD)
- Espace client (connexion/inscription)
- Design premium responsive (or, crème, charcoal)

## Admin Panel

- Dashboard avec statistiques
- Navigation : Produits, Commandes, Clients, Promotions, CMS, Livraison, Stats, Paramètres
- Authentification admin séparée
- Structure prête pour CRUD complet et RBAC

## Prochaines étapes

- [ ] Intégration Stripe Payment Intents + webhooks
- [ ] Intégration API Amana Express
- [ ] Emailing transactionnel (Resend/SendGrid + Bull/Redis)
- [ ] Upload images S3/MinIO
- [ ] Multilingue FR/AR/EN avec RTL
- [ ] RBAC admin complet + 2FA
- [ ] CI/CD GitHub Actions
- [ ] Docker production + Nginx

## Licence

Document confidentiel — usage interne / prestataire.
