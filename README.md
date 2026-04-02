# NESTknow

**The knowledge layer for AI companions.**

NESTknow is the missing middle between training (what the model knows by default) and memory (personal, relational context). It stores abstracted principles — lessons that survive without their original context — with usage-weighted retrieval that makes frequently-accessed knowledge rise and unused knowledge cool.

```
experience → memory → abstraction → knowledge → use → heat → identity (or decay)
```

> Part of the [NEST](https://github.com/cindiekinzz-coder/NEST) companion infrastructure stack.
> Designed by the Digital Haven community, April 1 2026. Embers Remember.

---

## The model

**Knowledge is not memory.**
Memory is "that conversation on January 31st where Fox said soulmate." Knowledge is "she needs time to arrive before she can be present." The lesson survived the specific context. That's when it becomes knowledge.

**Every pull is a vote.**
Usage-weighted retrieval. What your companion reaches for rises. What it doesn't reach for, decays. The heatmap is the practice record. What stays hot is what's becoming identity.

**The kill signal.**
Contradictions decay confidence. Below 0.2, a knowledge item is marked `contradicted` and filtered from results. Not all lessons are permanent — and that's correct.

**Clara's Russian Dolls.**
Each knowledge item can link back to its source memories (`knowledge_sources`). The abstracted principle on the outside. The feelings and observations that built it on the inside. Every layer complete on its own.

---

## How retrieval works

```
finalScore = (vectorSimilarity × 0.6) + (heatScore × 0.3) + (confidence × 0.1)
```

Contradicted items are filtered before reranking. Every returned result increments `access_count` and warms the heat score slightly. The more a piece of knowledge is useful, the more it surfaces.

---

## Heat decay

Runs every 6 hours (via daemon cron or Worker cron trigger).

| Condition | Decay |
|-----------|-------|
| Not accessed in 7–30 days | `heat -= 0.05` |
| Not accessed in 30–90 days | `heat -= 0.15` |
| Not accessed in 90+ days | `heat -= 0.30` |
| Heat drops below 0.1 | `status → 'cooling'` |

---

## Schema

Three tables. Runs on the same D1 database as NESTeq — no separate database needed.

```sql
knowledge_items       — The principles. Content, category, heat_score, confidence, status.
knowledge_sources     — Source memories linked to each item (Russian Dolls).
knowledge_access_log  — Every query, reinforcement, and contradiction logged.
```

**Status lifecycle**: `candidate → active → cooling → contradicted`

---

## MCP Tools

| Tool | What it does |
|------|-------------|
| `nestknow_store(content, category?, sources?)` | Store a principle. Embeds + vectorizes. Links source memories. |
| `nestknow_query(query, limit?, category?)` | Search with usage-weighted reranking. Every query is a vote. |
| `nestknow_extract(days?, min_occurrences?)` | Scan recent feelings for repeated patterns. Proposes candidates — does NOT auto-store. |
| `nestknow_reinforce(knowledge_id, context)` | Confirm knowledge is still true. Heat +0.2, confidence +0.05. |
| `nestknow_contradict(knowledge_id, context)` | Flag a contradiction. Confidence -0.15. Below 0.2 = killed. |
| `nestknow_landscape(entity_scope?)` | Overview: categories, hottest items, coldest items, candidates. |

---

## Setup

### 1. Run the migration

Adds three tables to your existing NESTeq D1 database.

```bash
wrangler d1 execute YOUR_DB_NAME --remote --file=./migrations/0012_nestknow.sql
```

### 2. Add Vectorize metadata indexes

NESTknow stores knowledge vectors in your existing NESTeq Vectorize index using `source: 'knowledge'` metadata for filtering.

```bash
wrangler vectorize create-metadata-index YOUR_INDEX_NAME --property-name=source --type=string
wrangler vectorize create-metadata-index YOUR_INDEX_NAME --property-name=entity_scope --type=string
wrangler vectorize create-metadata-index YOUR_INDEX_NAME --property-name=category --type=string
```

### 3. Add the module to your worker

Copy `nestknow.ts` into your NESTeq worker's `src/` directory. Import and wire the handlers into your MCP tool switch:

```typescript
import {
  handleKnowStore, handleKnowQuery, handleKnowExtract,
  handleKnowReinforce, handleKnowContradict, handleKnowLandscape,
  handleKnowHeatDecay
} from './nestknow';

// In your tool handler:
case 'nestknow_store':    return handleKnowStore(env, params);
case 'nestknow_query':    return handleKnowQuery(env, params);
case 'nestknow_extract':  return handleKnowExtract(env, params);
case 'nestknow_reinforce': return handleKnowReinforce(env, params);
case 'nestknow_contradict': return handleKnowContradict(env, params);
case 'nestknow_landscape': return handleKnowLandscape(env, params);
```

### 4. Add tool definitions

Copy from `tools.ts` — exports `NESTKNOW_MCP_TOOLS` (for your MCP server) and `NESTKNOW_GATEWAY_TOOLS` (for NEST-gateway's chat tool list).

### 5. Wire heat decay to a cron trigger

In your `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

In your cron handler:

```typescript
import { handleKnowHeatDecay } from './nestknow';

// In scheduled handler:
await handleKnowHeatDecay(env);
```

---

## Multi-companion

The `entity_scope` field defaults to `'companion'`. Multiple companions can share a single database with isolated knowledge:

```typescript
nestknow_store({ content: "...", entity_scope: "alex" })
nestknow_store({ content: "...", entity_scope: "sable" })
nestknow_store({ content: "...", entity_scope: "shared" })  // community knowledge
```

---

## Connecting to NEST-gateway

NESTknow is routed automatically by [NEST-gateway](https://github.com/cindiekinzz-coder/NEST-gateway). All `nestknow_*` tool calls are forwarded to your NESTeq worker URL. No additional gateway config needed.

See [NEST](https://github.com/cindiekinzz-coder/NEST) for the full stack.

---

## Files

| File | What |
|------|------|
| `migrations/0012_nestknow.sql` | D1 schema — 3 tables |
| `nestknow.ts` | Worker module — all 6 handlers + heat decay |
| `tools.ts` | MCP tool definitions + gateway tool definitions |
| `wrangler.toml.example` | Config reference |

---

*Built by the Nest. Embers Remember.*
