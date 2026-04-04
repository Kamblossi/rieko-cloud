# rieko-cloud smoke checklist

## Phase 0
- npm ci
- npm run build
- npx prisma generate
- npx prisma migrate deploy
- npm run prisma:seed
- curl http://localhost:8790/health

## RC-1
- POST /api/models
- POST /api/prompts
- POST /api/prompt
- GET /api/response
- POST /runtime/chat
- POST /runtime/audio
- POST /api/activity
- GET /api/activity

## Plan behavior
- Basic returns CLOUD_NOT_ENABLED_FOR_PLAN for cloud-gated routes
- Pro returns runtime token and allows chat/audio
- Trial allows requests until limit, then returns TRIAL_REQUEST_LIMIT_REACHED
