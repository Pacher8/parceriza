#!/bin/sh
set -e
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts
exec node dist/index.js
