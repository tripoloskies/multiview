FROM oven/bun:1.3.10 as builder

WORKDIR /app
COPY package.json bun.lock turbo.json ./
COPY app/package.json ./app/
COPY services/package.json ./services/
COPY shared/database/package.json ./shared/database/
COPY shared/utils/package.json ./shared/utils/
COPY shared/types/package.json ./shared/types/
COPY shared/schema/package.json ./shared/schema/
COPY shared/config/package.json ./shared/config/

RUN bun install --frozen-lockfile


FROM oven/bun:1.3.10

RUN apt update && apt install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    chromium \
    pipx \
    python3-pip \
    python3 \
    mbuffer \
    traceroute \
    ffmpeg \
    libnss3 \
    libgbm1 \
    git \
    fonts-liberation \
    btop \
    && rm -rf /var/lib/apt/lists/*


RUN pipx ensurepath --global

RUN pipx install yt-dlp[default] streamlink --global

ENV RECORD_PATH=/recordings
ENV TURBO_TELEMETRY_DISABLED=1
ENV DO_NOT_TRACK=1

RUN mkdir -p /recordings

WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/app/node_modules app/node_modules
COPY --from=builder /app/services/node_modules services/node_modules
COPY --from=builder /app/shared/database/node_modules shared/database/node_modules
COPY --from=builder /app/shared/types/node_modules shared/types/node_modules
COPY --from=builder /app/shared/utils/node_modules shared/utils/node_modules
COPY --from=builder /app/shared/schema/node_modules shared/schema/node_modules
COPY --from=builder /app/shared/config/node_modules shared/config/node_modules
COPY . .

WORKDIR /app/app

RUN bun prepare

WORKDIR /app
