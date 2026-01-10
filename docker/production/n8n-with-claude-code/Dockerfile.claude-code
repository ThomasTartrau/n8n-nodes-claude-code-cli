FROM debian:bookworm-slim

# Install Node.js LTS and essential tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create workspace directory
WORKDIR /workspace

# Healthcheck to verify Claude Code is installed and working
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD claude --version || exit 1

# Keep container running
CMD ["tail", "-f", "/dev/null"]
