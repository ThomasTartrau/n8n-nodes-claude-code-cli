<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/logo/claude-code-cli-logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="./assets/logo/claude-code-cli-logo-light.png">
  <img alt="n8n-nodes-claude-code-cli" src="./assets/logo/claude-code-cli-banner.png" width="560">
</picture>

[![CI](https://img.shields.io/github/actions/workflow/status/ThomasTartrau/n8n-nodes-claude-code-cli/ci.yml?style=for-the-badge&logo=github&label=CI)](https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/n8n-nodes-claude-code-cli?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/n8n-nodes-claude-code-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![n8n](https://img.shields.io/badge/n8n-community_node-FF6D5A?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io)

**🤖 Bring the power of Claude Code AI directly into your n8n workflows**

*Automate code reviews • Generate documentation • Fix bugs • Build coding bots*

[Getting Started](#-quick-start) •
[Use Cases](#-use-cases) •
[Documentation](#%EF%B8%8F-node-operations)

</div>

---

## ✨ Features

| | |
|---|---|
| **🐳 Docker Execution** - Run Claude Code in isolated containers | **🔄 Session Management** - Multi-turn conversations across executions |
| **🎯 Tool Permissions** - Fine-grained control over allowed tools | **📁 Context Files** - Include files and directories for analysis |
| **🧠 Multiple Models** - Opus, Sonnet, Haiku support | **📊 Rich Output** - Costs, tokens, and session IDs |

---

## ⚡ Quick Start

### 1. Install the n8n node

In n8n: **Settings > Community Nodes > Install > `n8n-nodes-claude-code-cli`**

### 2. Deploy Claude Code Runner

**n8n installed on host (not in Docker)?** Use the standalone setup:

```bash
mkdir -p claude-code-runner && cd claude-code-runner && \
curl -fsSL https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/docker/production/claude-code/docker-compose.yml -o docker-compose.yml && \
curl -fsSL https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/docker/production/claude-code/Dockerfile -o Dockerfile && \
docker compose up -d --build
```

<details>
<summary><b>n8n also running in Docker?</b> Use the complete stack instead</summary>

The node uses `docker exec` to communicate with claude-code-runner. This requires:
1. **Docker CLI** installed inside the n8n container
2. **Docker socket** mounted to access the Docker daemon

The standard `n8nio/n8n` image doesn't include Docker CLI, so we provide a custom setup:

```bash
mkdir -p n8n-claude-code && cd n8n-claude-code && \
curl -fsSL https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/docker/production/n8n-with-claude-code/docker-compose.yml -o docker-compose.yml && \
curl -fsSL https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/docker/production/n8n-with-claude-code/Dockerfile.n8n -o Dockerfile.n8n && \
curl -fsSL https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/docker/production/n8n-with-claude-code/Dockerfile.claude-code -o Dockerfile.claude-code && \
docker compose up -d --build
```

This builds a custom n8n image with Docker CLI and deploys both n8n and claude-code-runner together. Access n8n at http://localhost:5678

**Already have n8n running in Docker?** You can modify your existing setup:

1. Create a custom Dockerfile for n8n:
```dockerfile
FROM docker:29-cli AS docker-cli
FROM n8nio/n8n
USER root
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
RUN chmod +x /usr/local/bin/docker
USER node
```

2. Update your docker-compose.yml:
```yaml
services:
  n8n:
    build: .  # Use the custom Dockerfile above
    user: root  # Required for Docker socket access
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      # ... your other volumes
```

3. Deploy claude-code-runner separately using the standalone setup above

**Important:** Both containers must be managed by the same Docker daemon.

</details>

### 3. Authenticate

```bash
docker exec -it claude-code-runner claude login
```

Follow the browser prompts to complete authentication.

### 4. Configure n8n credentials

| Parameter | Value |
|-----------|-------|
| Connection Type | Docker |
| Container Name | `claude-code-runner` |
| Working Directory | `/workspace` |

### 5. Start automating 🚀

Search "Claude Code" in n8n node panel and create your first workflow.

---

## 🐳 Configuration

### Workspace Setup

You have two options to work with your code:

**Option 1: Clone repos inside container** (recommended for isolation)
```bash
docker exec -it claude-code-runner git clone <repo-url>
# Or use git worktree for multiple branches
```

**Option 2: Mount existing projects**
```yaml
volumes:
  - /path/to/your/project:/workspace/project-name
```

### MCP Servers

Mount your MCP configuration to enable additional tools:

```yaml
volumes:
  # MCP servers directory
  - ./mcp-servers:/root/.mcp
  # Or mount your local .mcp.json (avoids versioning credentials)
  - ~/.mcp.json:/root/.mcp.json:ro
```

<details>
<summary><b>🔐 Alternative: SSH deployment</b></summary>

For dedicated VM deployments (AWS EC2, GCP, etc.):

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git
npm install -g @anthropic-ai/claude-code
claude login
```

**n8n Credentials:**
| Parameter | Value |
|-----------|-------|
| Connection Type | SSH |
| Host | Your VM IP |
| Port | `22` |
| Auth Method | `privateKey` |

</details>

---

## ⚙️ Node Operations

| Operation | Description | Use Case |
|-----------|-------------|----------|
| **Execute Prompt** | Send a prompt and get a response | Direct AI interaction |
| **Execute with Context** | Include files as context | Code review, analysis |
| **Continue Session** | Continue last conversation | Multi-turn interactions |
| **Resume Session** | Resume specific session by ID | Continue after interruption |

<details>
<summary><b>📝 Detailed Parameters</b></summary>

### Execute Prompt
- **Prompt** (required): Instruction for Claude Code
- **Model**: Claude model to use
- **Options**: Working directory, timeout, system prompt

### Execute with Context
- **Prompt** (required): Instruction for Claude Code
- **Context Files**: File paths to include
- **Additional Directories**: Directory paths

### Continue / Resume Session
- **Prompt** (required): Follow-up message
- **Session ID** (resume only): Previous session ID

</details>

---

## 💡 Use Cases

### 🔍 MR/PR Code Review Agent

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   GitLab    │────▶│  Get Diff &  │────▶│ Claude Code │────▶│    Post      │
│   Webhook   │     │    Files     │     │   Review    │     │   Comments   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

<details>
<summary><b>Workflow Steps</b></summary>

1. **Trigger**: GitLab/GitHub webhook on new MR/PR
2. **Fetch**: Get changed files and diff via API
3. **Review**: Claude Code with `executeWithContext`
   - *"Review this code. Check for bugs, security issues, suggest improvements."*
4. **Post**: Send review comments back to GitLab/GitHub
5. **Notify**: Alert team via Slack/Discord (optional)

</details>

---

### 🎧 Support Assistant

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Support   │────▶│   Analyze    │────▶│ Claude Code │────▶│   Respond    │
│   Ticket    │     │    Issue     │     │   Solution  │     │   or Route   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

<details>
<summary><b>Workflow Steps</b></summary>

1. **Trigger**: Webhook from support system (Zendesk, Intercom)
2. **Analyze**: Claude Code understands the issue
   - *"User reports: [issue]. Analyze and suggest solution."*
3. **Respond**: Send AI response back via API
4. **Escalate**: Route complex issues to humans

</details>

---

### 📚 Auto Documentation

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│    Code     │────▶│  Get Changed │────▶│ Claude Code │────▶│   Commit     │
│    Push     │     │    Files     │     │  Gen Docs   │     │    Docs      │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

<details>
<summary><b>Workflow Steps</b></summary>

1. **Trigger**: Webhook on code push to main
2. **Identify**: Get list of changed files
3. **Generate**: Claude Code generates documentation
   - *"Generate docs for this code. Include descriptions, params, examples."*
4. **Commit**: Create commit with updated docs
5. **PR**: Optionally create a PR for review

</details>

---

### 🐛 Auto Bug Fixing

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Sentry    │────▶│    Parse     │────▶│ Claude Code │────▶│  Create PR   │
│   Alert     │     │ Stack Trace  │     │   Fix Bug   │     │   + Notify   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

<details>
<summary><b>Workflow Steps</b></summary>

1. **Trigger**: Webhook from error monitoring (Sentry, Datadog)
2. **Analyze**: Parse error stack trace
3. **Fix**: Claude Code analyzes and fixes
   - *"Error: [stack trace]. Analyze code and provide a fix."*
4. **Test**: Run tests to validate
5. **PR**: Create pull request with fix
6. **Notify**: Alert team about automated fix

</details>

---

### 🤖 Cloud Coding Bots

Build AI coding assistants on Telegram, Slack, Discord, or GitLab/GitHub.

<details>
<summary><b>Examples</b></summary>

**📱 Telegram Bot**
1. Trigger: Telegram trigger on new message
2. Process: Claude Code handles coding question
3. Reply: Send response via Telegram node

**💬 Slack Bot**
1. Trigger: Slack mention or slash command
2. Context: Fetch relevant code from repos (optional)
3. Respond: Post response to channel

**🦊 GitLab/GitHub Bot**
1. Trigger: Issue comment with keyword (e.g., `/claude`)
2. Analyze: Fetch issue context and code
3. Comment: Post Claude's analysis

</details>

---

## 📤 Output Structure

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "output": "Here's my analysis of the code...",
  "exitCode": 0,
  "duration": 15234,
  "cost": 0.0523,
  "numTurns": 3,
  "usage": {
    "inputTokens": 1250,
    "outputTokens": 890
  }
}
```

| Field | Description |
|-------|-------------|
| `success` | ✅ Execution completed successfully |
| `sessionId` | 🔗 ID for continuing conversations |
| `output` | 📝 Response text from Claude Code |
| `cost` | 💰 Estimated cost in USD |
| `usage` | 📊 Token breakdown |

---

## 🔒 Security

### 🛡️ Tool Permissions

Control what Claude Code can do:

```
✅ Allowed: Read, Glob, Grep
❌ Blocked: Bash(rm:*), Write(.env)
```

### 🐳 Isolation Best Practices

- Always set specific working directory
- Avoid `/` or home directories
- Create dedicated workspace per project

<details>
<summary><b>🔐 Recommended Security Settings</b></summary>

**Disallow dangerous operations:**
- `Bash(rm:*)` - Prevent file deletion
- `Bash(sudo:*)` - No sudo access
- `Write(.env)` - Protect secrets
- `Bash(curl:*)` - Block network (if not needed)

</details>

---

## 🤝 Contributing

### Development Setup

```bash
git clone https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli.git
cd n8n-nodes-claude-code-cli
npm install && npm run build

# Start n8n + claude-code-runner for testing
docker compose -f docker/development/docker-compose.yml up -d --build

# Authenticate claude-code-runner
docker exec -it claude-code-runner claude login

# Access n8n at http://localhost:5678
```

### Docker Files Structure

```
docker/
├── development/
│   ├── Dockerfile          # n8n with docker CLI (dev)
│   └── docker-compose.yml  # n8n + claude-code-runner (mounts dist/)
└── production/
    ├── claude-code/
    │   ├── Dockerfile          # Standalone claude-code-runner
    │   └── docker-compose.yml  # For n8n on host (not Docker)
    └── n8n-with-claude-code/
        ├── Dockerfile.n8n          # n8n with Docker CLI
        ├── Dockerfile.claude-code  # claude-code-runner
        └── docker-compose.yml      # Complete stack (both services)
```

### Submit Changes

```bash
git checkout -b feature/amazing-feature
git commit -m 'feat: add amazing feature'
git push origin feature/amazing-feature
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[GitHub](https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli)** •
**[npm](https://www.npmjs.com/package/n8n-nodes-claude-code-cli)** •
**[n8n Community](https://community.n8n.io/)**

---

Made with ❤️ for the n8n community

</div>
