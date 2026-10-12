# sim.starshard.net — Forge (headless AI-vs-AI) + a small Node API/UI.
FROM node:20-bookworm-slim

# Java 17 for Forge, xvfb as a safety net (Forge's desktop jar touches AWT
# even in sim mode on some builds), bzip2 to unpack the release.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless xvfb xauth bzip2 curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Pin a release. FORGE_VERSION comes from docker-compose.yml, which reads it from
# .env, so updating Forge is one line in .env plus a rebuild (the page says when a
# newer release is out). FORGE_URL can still point at a daily snapshot instead.
ARG FORGE_VERSION=2.0.15
ARG FORGE_URL=https://github.com/Card-Forge/forge/releases/download/forge-${FORGE_VERSION}/forge-installer-${FORGE_VERSION}.tar.bz2
RUN mkdir -p /opt/forge \
 && curl -fL "$FORGE_URL" -o /tmp/forge.tar.bz2 \
 && tar -xjf /tmp/forge.tar.bz2 -C /opt/forge \
 && rm /tmp/forge.tar.bz2 \
 && ls /opt/forge/*.jar

WORKDIR /app
COPY server.js forge.js meta.js sideboard.js realdata.js calib.js claude.js codex.js terms.js coach.js cardstats.js usage.js score.js ./
COPY public ./public

ENV PORT=8088 \
    FORGE_DIR=/opt/forge \
    DATA_DIR=/data \
    FORGE_XMX=3g
VOLUME ["/data"]
EXPOSE 8088
CMD ["node", "server.js"]
