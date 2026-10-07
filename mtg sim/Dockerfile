# sim.starshard.net — Forge (headless AI-vs-AI) + a small Node API/UI.
FROM node:20-bookworm-slim

# Java 17 for Forge, xvfb as a safety net (Forge's desktop jar touches AWT
# even in sim mode on some builds), bzip2 to unpack the release.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless xvfb xauth bzip2 curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Pin a release by default; override with --build-arg FORGE_URL=... to take a
# daily snapshot (newest sets land there first).
ARG FORGE_URL=https://github.com/Card-Forge/forge/releases/download/forge-2.0.15/forge-installer-2.0.15.tar.bz2
RUN mkdir -p /opt/forge \
 && curl -fL "$FORGE_URL" -o /tmp/forge.tar.bz2 \
 && tar -xjf /tmp/forge.tar.bz2 -C /opt/forge \
 && rm /tmp/forge.tar.bz2 \
 && ls /opt/forge/*.jar

WORKDIR /app
COPY server.js forge.js meta.js sideboard.js realdata.js calib.js claude.js codex.js terms.js ./
COPY public ./public

ENV PORT=8088 \
    FORGE_DIR=/opt/forge \
    DATA_DIR=/data \
    FORGE_XMX=3g
VOLUME ["/data"]
EXPOSE 8088
CMD ["node", "server.js"]
