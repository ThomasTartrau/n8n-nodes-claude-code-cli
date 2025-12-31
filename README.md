<div align="center">

```
   _____ _                 _         _____          _
  / ____| |               | |       / ____|        | |
 | |    | | __ _ _   _  __| | ___  | |     ___   __| | ___
 | |    | |/ _` | | | |/ _` |/ _ \ | |    / _ \ / _` |/ _ \
 | |____| | (_| | |_| | (_| |  __/ | |___| (_) | (_| |  __/
  \_____|_|\__,_|\__,_|\__,_|\___|  \_____\___/ \__,_|\___|

           ⚡ for n8n ⚡
```

# n8n-nodes-claude-code-cli

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![n8n](https://img.shields.io/badge/n8n-community_node-FF6D5A?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io)

**🤖 Bring the power of Claude Code AI directly into your n8n workflows**

*Automate code reviews • Generate documentation • Fix bugs • Build coding bots*

[Getting Started](#-quick-start) •
[Use Cases](#-use-cases) •
[Documentation](#-node-operations)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🐳 Multiple Connection Modes
Execute Claude Code locally, via SSH, or inside Docker containers

### 🔄 Session Management
Maintain multi-turn conversations across workflow executions

### 🎯 Tool Permissions
Fine-grained control over which tools Claude Code can use

</td>
<td width="50%">

### 📁 Context File Support
Include files and directories as context for code analysis

### 🧠 Multiple Models
Support for Opus, Sonnet, Haiku and specific versions

### 📊 Rich Output
Detailed metadata including costs, tokens, and session IDs

</td>
</tr>
</table>

---

## ⚡ Quick Start

```
1️⃣ Install  →  2️⃣ Setup Claude Code  →  3️⃣ Authenticate  →  4️⃣ Create Workflow  →  5️⃣ Run!
```

<details>
<summary><b>📋 Step-by-step guide</b></summary>

### 1️⃣ Install the node


#### **Install the node in n8n community nodes**

Search for "n8n-nodes-claude-code-cli" in the n8n community nodes interface.
Then install the node.


#### **Install the node locally with git:**

I recommend using git to install the node locally.
*If there is a supply chain attack, you will not be affected by the automatic updates of the community nodes of n8n. And therefore your service will not be corrupted. Supply chain attacks are very dangerous, more and more frequent and can compromise your service. It is therefore recommended to use git to install the node locally.*

```bash
git clone https://github.com/n8n-io/n8n-nodes-claude-code-cli.git
cd n8n-nodes-claude-code-cli
npm install
npm run build
```


#### **Install locally with npm:**

```bash
npm install n8n-nodes-claude-code-cli
```

**For local installation you need to add the environment variable `- N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom` in your n8n configuration file.**

### 2️⃣ Set up Claude Code

Choose your deployment method (see [Installation](#-installation--deployment))

### 3️⃣ Authenticate with Claude

```bash
# For Docker
docker exec -it your-container-name claude login

# For SSH or Local
claude login
```

### 4️⃣ Create credentials in n8n

Go to **Settings → Credentials → Add Credential** and select your connection type

### 5️⃣ Add the node and run!

Search for "Claude Code" in the node panel, configure, and execute

</details>

### 🐳 Docker (Recommended)

> **Why Docker?** Isolation, easy setup, portability, and security.

<details>
<summary><b>Option 1: Node.js Container (Lightweight)</b></summary>

Best for code analysis without system tools:

```dockerfile
FROM node:24-slim

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Set up workspace
WORKDIR /workspace

# Keep container running
CMD ["tail", "-f", "/dev/null"]
```

```yaml
# docker-compose.yml
services:
  claude-code-runner:
    build: .
    volumes:
      - ./workspace:/workspace
```

</details>

<details>
<summary><b>Option 2: Debian Container (Full Tooling)</b></summary>

Best when Claude Code needs system tools (git, build tools, etc.):

```dockerfile
FROM debian:bookworm-slim

# Install Node.js and common tools
RUN apt-get update && apt-get install -y \
    curl git build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace
CMD ["tail", "-f", "/dev/null"]
```

</details>

**🔑 Authenticate:**
```bash
docker exec -it claude-code-runner claude login
```

**⚙️ n8n Credentials:**
| Parameter | Value |
|-----------|-------|
| Container Name | `claude-code-runner` |
| Working Directory | `/workspace` |

---

### 🔐 SSH (Alternative)

> **Why SSH?** Full system access and dedicated resource isolation.

<details>
<summary><b>Setup Instructions</b></summary>

1. **Set up a VM** (AWS EC2, GCP, DigitalOcean, etc.)

2. **Install Claude Code:**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install Claude Code
   npm install -g @anthropic-ai/claude-code

   # Authenticate
   claude login
   ```

3. **Configure SSH** with key-based authentication

</details>

**⚙️ n8n Credentials:**
| Parameter | Value |
|-----------|-------|
| Host | Your VM IP/hostname |
| Port | `22` |
| Auth Method | `privateKey` |

---

### 💻 Local (Not Recommended)

> ⚠️ **Security concerns** - Claude Code runs in the same context as n8n

<details>
<summary><b>Why not recommended?</b></summary>

- Security risks (shared execution context)
- Resource contention
- Harder to manage and update

**If you must use local:**
1. Install Claude Code inside your n8n container
2. Run `claude login`
3. Use "Local" connection mode

</details>

---

## 🔑 Authentication

### Recommended: Claude Login (Subscription)

> 💰 **Cheaper!** Claude Code subscription costs less than API usage.

```bash
# Docker
docker exec -it container_name claude login

# SSH (on remote server)
claude login

# Local
claude login
```

Follow the browser prompts to authenticate.

### Alternative: API Key

<details>
<summary><b>Using ANTHROPIC_API_KEY (not recommended)</b></summary>

> ⚠️ More expensive than subscription pricing

Set via environment variable:
```bash
export ANTHROPIC_API_KEY="your-api-key"
```

Or in Docker Compose:
```yaml
environment:
  - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

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

Build AI coding assistants on any platform:

<table>
<tr>
<td align="center" width="25%">

**📱 Telegram**

```
User ──▶ Bot ──▶ Claude
              ──▶ Reply
```

</td>
<td align="center" width="25%">

**💬 Slack**

```
@bot ──▶ Fetch ──▶ Claude
              ──▶ Thread
```

</td>
<td align="center" width="25%">

**🎮 Discord**

```
!help ──▶ Parse ──▶ Claude
               ──▶ Embed
```

</td>
<td align="center" width="25%">

**🦊 GitLab/GitHub**

```
Comment ──▶ API ──▶ Claude
                ──▶ Reply
```

</td>
</tr>
</table>

<details>
<summary><b>Example: Telegram Bot</b></summary>

1. **Trigger**: Telegram trigger on new message
2. **Process**: Claude Code handles coding question
3. **Reply**: Send response via Telegram node

</details>

<details>
<summary><b>Example: Slack Bot</b></summary>

1. **Trigger**: Slack mention or slash command
2. **Context**: Fetch relevant code from repos (optional)
3. **Respond**: Post response to channel

</details>

<details>
<summary><b>Example: GitLab/GitHub Bot</b></summary>

1. **Trigger**: Issue comment with keyword (e.g., `/claude`)
2. **Analyze**: Fetch issue context and code
3. **Comment**: Post Claude's analysis

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

<table>
<tr>
<td width="50%">

### 🛡️ Tool Permissions

Control what Claude Code can do:

```
✅ Allowed: Read, Glob, Grep
❌ Blocked: Bash(rm:*), Write(.env)
```

</td>
<td width="50%">

### 🐳 Isolation

- Use Docker containers
- Mount only needed directories
- Read-only mounts when possible

</td>
</tr>
</table>

<details>
<summary><b>🔐 Recommended Security Settings</b></summary>

**Disallow dangerous operations:**
- `Bash(rm:*)` - Prevent file deletion
- `Bash(sudo:*)` - No sudo access
- `Write(.env)` - Protect secrets
- `Bash(curl:*)` - Block network (if not needed)

**Isolation best practices:**
- Always set specific working directory
- Avoid `/` or home directories
- Create dedicated workspace per project

</details>

---

## 🤝 Contributing

Contributions welcome!

```bash
# 1. Fork the repo
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Commit changes
git commit -m 'feat: add amazing feature'

# 4. Push & create PR
git push origin feature/amazing-feature
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[GitHub](https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli)** •
<!-- **[npm](https://www.npmjs.com/package/n8n-nodes-claude-code-cli)** • -->
**[n8n Community](https://community.n8n.io/)**

---

Made with ❤️ for the n8n community

</div>
