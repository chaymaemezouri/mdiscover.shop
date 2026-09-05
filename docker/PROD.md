# Production Docker notes (mdiscover.shop / Kamira)
#
# Applied after first OVH deploy — keep in sync with CI.
#
# Ports on host (avoid conflict with other projects e.g. mdiscover.ma):
#   API   4010 → 4000
#   Web   3010 → 3000
#   Admin 3012 → 3001
# Postgres / Redis / MinIO: internal network only
#
# Containers: kamira-postgres-prod, kamira-redis-prod, kamira-minio-prod,
#             kamira-api-prod, kamira-web-prod, kamira-admin-prod
#
# Secrets: docker/.env on the VPS only (see docker/.env.example)
#
# Migrations: API container runs `prisma migrate deploy` on start.
# NEVER auto-seed in CI/CD.
#
# Images: MinIO stays internal. Set S3_PUBLIC_URL=https://api.mdiscover.shop/uploads
# The API proxies GET /uploads/* → MinIO bucket. If old rows still use
# http://minio:9000/kamira-assets/..., rewrite them once:
#   UPDATE media_assets SET url = REPLACE(url, 'http://minio:9000/kamira-assets', 'https://api.mdiscover.shop/uploads');
#   (same REPLACE on product_images.url / categories.image_url if needed)
#
# Seed carousel categories (safe — no products / no password reset):
#   docker exec -w /app kamira-api-prod node -e '...'  (or after pull: ts-node prisma/seed-categories.ts)
# Prefer: copy seed-categories into image via deploy, then:
#   docker exec -e APP_URL=https://mdiscover.shop -w /app/apps/api kamira-api-prod \
#     npx --yes ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-categories.ts
# If ts-node fails (no typescript in prod image), use the node one-liner in chat / PROD notes.
#
# Key Dockerfile fixes:
# - API: openssl + bcrypt rebuild from source on Alpine
# - Prisma binaryTargets: native + linux-musl-openssl-3.0.x
# - Web/Admin: Next standalone CMD is `node server.js` at /app root
