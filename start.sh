
#!/bin/bash

IS_PROD="$1"
MEDIAMTX_SCRIPT="./dist/mediamtx/run.sh"
DB_PATH="./db/prismaSqlite.db"

echo "installing MediaMTX..."
chmod +x "$MEDIAMTX_SCRIPT"
"$MEDIAMTX_SCRIPT" --install-only
STATUS=$?

if [ $STATUS != 0 ]; then
    echo "MediaMTX installation failed. Exiting."
    exit 1
fi
bun prisma migrate dev && bun prisma generate
STATUS=$?

if [ $STATUS != 0 ]; then
    echo "Database migration failed. Exiting."
    exit 1
fi
sqlite3 "$DB_PATH" "PRAGMA journal_mode=WAL;"

if ([ "$IS_PROD" == "production" ]); then
    echo "starting in production mode..."
    bun run build
    bun run preview
else
    echo "starting in development mode..."
    bun run dev
fi