# Week 3 — N8N + Claude Code Exercise

> Submitted by **TungNN** (tungnn-zigexn). Smart Daily Standup Bot — N8N ↔ Claude, both directions.

## Task path

- [x] **Default** — Smart Daily Standup Bot (N8N ↔ Claude both directions)
- [ ] A — My own team tool
- [ ] B — Memory-first workflow

## Setup

- **N8N URL:** local `http://localhost:5678`
- **Integration method used:**
  - [x] `n8n-nodes-claude-code-cli` production Docker stack (`docker/production/n8n-with-claude-code`)
  - [ ] n8n.cloud + alternative LLM
- **Docker auth completed:** [x] Yes — `claude login` succeeded in the `claude-code-runner` container
- **Note:** changed `Dockerfile.claude-code` base image to `debian:trixie-slim` (the default `bookworm-slim` hit a GPG signature issue on this Docker Desktop).

## Explore

- **First prompt to Claude Code about the workflow design:** I had Claude extract the **real parameter schema of the `claudeCode` node** (operations, credential types, the `options.systemPrompt` field, `sessionId` visibility) *before* building, specifically to avoid a hallucinated node config.
- **N8N nodes researched before building:** `claudeCode` (n8n-nodes-claude-code-cli), HTTP Request, Merge, Code, Execute Workflow Trigger, MCP Server Trigger, Call n8n Workflow Tool.
- **Required data sources connected:**
  - [x] GitHub — commits since 24h
  - [x] Redmine — issues assigned to me
  - [ ] Slack — *skipped (see Data sources)*
- **Optional channels added:** none

## Vibe coding log

| Prompt | What Claude generated | Used as-is or edited? |
|--------|-----------------------|----------------------------------|
| "Generate an N8N workflow JSON for a daily standup using n8n-nodes-claude-code-cli" | A full workflow, but with node type `n8n-nodes-claude-code-cli.claudeCodeCli` | **Edited** — that type is hallucinated. The real node type is `claudeCode`. The import produced *"Unrecognized node type"*. Rebuilt node-by-node. |
| "Write a Code node to merge GitHub + Redmine into one activity string" | JS reading sources by node name (`$('GitHub Commits')`, `$('Redmine Issues')`) | Used with small edits (defensive array unwrap + Redmine `{issues:[...]}` handling) |

**Key learning:** the vibe-coded JSON invented a node type (`claudeCodeCli` vs the real `claudeCode`). Always verify generated node types against the actually installed node.

## Build — Part 1 (N8N → Claude)

- **Workflow name in N8N:** `Daily Standup` (see `workflows/daily-standup.workflow.json`)
- **Nodes used:** Manual Trigger, Execute Workflow Trigger, HTTP Request (GitHub Commits), HTTP Request (Redmine Issues), Merge (Append), Code (merge & format), Claude Code (`claudeCode`, Docker exec)
- **Claude Code CLI node prompt:**
  - *System prompt:* `You are a concise daily standup assistant for a software engineer. Summarize activity into Yesterday / Today / Blockers. Be terse and factual.`
  - *User prompt:* `Based on the following activity, write a daily standup in EXACTLY this format: Yesterday / Today / Blockers. Output only the standup. Activity: {{ $json.activity }}`
- **Execution log result:** pass (green)
- **Topology note:** GitHub + Redmine run **in parallel** from the trigger → **Merge** (synchronization barrier) → Code → Claude. Learned that combining parallel branches needs a Merge node — wiring two outputs straight into one input makes the downstream node run twice.

## Data sources — connection details

- **GitHub** — repo: `tungnn-zigexn/react-portfolio-template` (personal **public** repo). The company repo `ZIGExN/tcv-usagi-web` needed a fine-grained token that was **pending org approval**, so I used a personal public repo to prove the integration with real API data. Credential: GitHub API (PAT) via HTTP Request. Query: `GET /repos/{owner}/{repo}/commits?since={{ $now.minus({hours:24}).toISO() }}&author=tungnn-zigexn`.
- **Redmine** — base URL `https://dev.zigexn.vn`. The REST API sits **behind a corporate HTTP Basic Auth gateway**. Solved by sending **both**: Basic Auth (company account) for the gateway **+** an `X-Redmine-API-Key` header for Redmine. [x] configured.
- **Slack** — **not connected.** Creating the Slack app required workspace app-approval + inviting the bot to a channel; skipped for time. The activity string explicitly marks Slack as not connected.
- **Gmail** (optional) — not used.

## Build — Part 2 (Claude → N8N via MCP)

- **MCP tool name configured:** `run_standup_workflow`
- **How:** a second workflow `Standup MCP Server` = **MCP Server Trigger** → **Call n8n Workflow Tool** (named `run_standup_workflow`) → calls the `Daily Standup` workflow (which has an *Execute Workflow Trigger*). Claude Code CLI in the container was connected with:
  `claude mcp add --transport http standup-n8n http://n8n:5678/mcp/<path>` → health check `✓ Connected`.
- **Test prompt used in Claude:** `Run my standup for today using the available n8n tool, then show me the standup result.`
- **Result:** [x] Yes — Claude called the tool; n8n ran `Daily Standup` and returned a standup built from **real GitHub + Redmine data** (the reply contained my actual Redmine issue numbers, which Claude could not have invented).
- **What Claude replied (excerpt):**
  ```
  Yesterday:
  - Merged PR #1 (portfolio-search, week2-claude-code-exercise)
  - Closed Redmine issues (memory-limit investigation + ref_code fix for sell-trade newform)
  Today:
  - No new tasks assigned yet
  Blockers:
  - None
  ```

## Memory verification

- **Session ID used:** fixed UUID `00000000-0000-4000-8000-000000000042`
  - The exercise suggested `standup-tungnn`, but the Claude Code CLI **requires a valid UUID** — an arbitrary string is rejected with *"Invalid session ID. Must be a valid UUID."* I used a fixed UUID + the **Resume Session** operation to achieve the same "persistent fixed session" goal.
- **Approach:** Claude node Operation = **Resume Session** into the fixed UUID. Sessions persist on disk via the `claude-config` volume, so memory survives across runs and container restarts.
- **Second run result:** [x] Yes — resuming the session recalled the previous standup.

## Default path — acceptance criteria

- [x] 1. N8N running with Claude integration
- [x] 2. Workflow executes with Claude Code CLI node (green execution log)
- [x] 3. GitHub commits fetched and included in Claude's prompt
- [x] 4. Redmine issues fetched and included in Claude's prompt
- [ ] 5. Slack messages fetched — *skipped (documented)*
- [ ] 6. (Bonus) Gmail / other optional channel — not done
- [x] 7. MCP tool configured and callable from Claude
- [x] 8. Standup summary generated from real data (not hardcoded)
- [ ] 9. Standup posted to DM/test channel — *not done (no Slack)*
- [x] 10. Memory persists across at least 2 runs
- [x] 11. Both directions tested: N8N→Claude AND Claude→N8N

## Reflection

- **What surprised me:** (1) the vibe-coded JSON hallucinated the node type (`claudeCodeCli` vs `claudeCode`); (2) parallel branches need a **Merge** node or the downstream runs twice; (3) Claude session IDs must be **UUIDs**, so the exercise's `standup-tungnn` doesn't work literally; (4) n8n 2.23 replaced the "Active" toggle with **Publish** and uses a SQLite WAL + published-version model.
- **Which direction felt more natural:** Claude → N8N (MCP) — saying "run my standup" and having the tool fire felt more natural than wiring the N8N → Claude pipeline.
- **What I would still verify manually:** (1) the GitHub `since`/`author` filter really captures the right 24h window; (2) Redmine `assigned_to_id=me` resolves to *my* user under the dual Basic-Auth + API-key setup; (3) the Merge node didn't silently duplicate the Claude call.
- **One thing to explore in Week 4:** connect Slack (read + post) and add a real Schedule trigger for a 9am daily run; revisit the company GitHub repo once the token is approved.

## 60-second share

My workflow: a Daily Standup bot — n8n fetches my GitHub + Redmine activity and Claude writes the standup; I can also trigger it the other way by telling Claude "run my standup" via an MCP tool. **One integration win:** both directions working — n8n calling Claude (`docker exec`) *and* Claude calling n8n (MCP `run_standup_workflow`). **One thing I'd still check by hand:** that the data filters (24h GitHub window, Redmine "assigned to me") actually capture the right items.

---

### Files in this submission

- `workflows/daily-standup.workflow.json` — Part 1 pipeline (importable into n8n)
- `workflows/standup-mcp-server.workflow.json` — Part 2 MCP server exposing `run_standup_workflow`
- `screenshots/` — N8N canvas screenshot(s)

> Credential values are **not** included (n8n exports only credential references). GitHub PAT / Redmine API key / company password are configured locally in n8n only.
