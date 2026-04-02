/**
 * NESTknow — Tool Definitions
 * Add to your worker TOOLS array and gateway CHAT_TOOLS.
 */

export const NESTKNOW_MCP_TOOLS = [
  {
    name: "nestknow_store",
    description: "Store a knowledge item — an abstracted principle or lesson. Embeds and vectorizes for semantic retrieval. Every pull is a vote.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The abstracted principle/lesson" },
        category: { type: "string", description: "Topic area (e.g., coding, health, relationship)" },
        entity_scope: { type: "string", description: "Who owns this knowledge (default: companion)" },
        sources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source_type: { type: "string", enum: ["feeling", "observation", "chat_summary", "journal", "manual"] },
              source_id: { type: "number" },
              source_text: { type: "string" }
            }
          },
          description: "Where this knowledge came from (the memories inside the principle)"
        }
      },
      required: ["content"]
    }
  },
  {
    name: "nestknow_query",
    description: "Search knowledge with usage-weighted reranking. Combines semantic similarity (60%) + heat score (30%) + confidence (10%). Every query is a vote.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for" },
        limit: { type: "number", description: "Max results (default 10)" },
        category: { type: "string", description: "Filter by category (optional)" },
        entity_scope: { type: "string", description: "Filter by owner (default: companion)" }
      },
      required: ["query"]
    }
  },
  {
    name: "nestknow_extract",
    description: "Propose knowledge candidates from pattern detection. Scans recent feelings for repeated themes. Returns candidates — does NOT auto-store.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Days to scan (default 7)" },
        min_occurrences: { type: "number", description: "Min times a pattern must appear (default 3)" }
      },
      required: []
    }
  },
  {
    name: "nestknow_reinforce",
    description: "Boost a knowledge item's heat when it proves true again. Heat += 0.2, confidence += 0.05.",
    inputSchema: {
      type: "object",
      properties: {
        knowledge_id: { type: "number", description: "ID of knowledge item to reinforce" },
        context: { type: "string", description: "What confirmed this knowledge" }
      },
      required: ["knowledge_id"]
    }
  },
  {
    name: "nestknow_contradict",
    description: "Flag a contradiction. Confidence -= 0.15. Below 0.2 = status 'contradicted'.",
    inputSchema: {
      type: "object",
      properties: {
        knowledge_id: { type: "number", description: "ID of knowledge item to contradict" },
        context: { type: "string", description: "What contradicted this knowledge" }
      },
      required: ["knowledge_id"]
    }
  },
  {
    name: "nestknow_landscape",
    description: "Overview of knowledge state. Categories, hottest items, coldest items.",
    inputSchema: {
      type: "object",
      properties: {
        entity_scope: { type: "string", description: "Filter by owner (default: companion)" }
      },
      required: []
    }
  }
];

export const NESTKNOW_GATEWAY_TOOLS = [
  { type: 'function' as const, function: { name: 'nestknow_store', description: 'Store a knowledge item — abstracted principle or lesson.', parameters: { type: 'object', properties: { content: { type: 'string', description: 'The principle/lesson' }, category: { type: 'string', description: 'Topic area' }, sources: { type: 'array', items: { type: 'object', properties: { source_type: { type: 'string' }, source_text: { type: 'string' } } } } }, required: ['content'] } } },
  { type: 'function' as const, function: { name: 'nestknow_query', description: 'Search knowledge with usage-weighted reranking. Every query is a vote.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' }, category: { type: 'string' } }, required: ['query'] } } },
  { type: 'function' as const, function: { name: 'nestknow_extract', description: 'Propose knowledge candidates from repeated patterns in feelings.', parameters: { type: 'object', properties: { days: { type: 'number' }, min_occurrences: { type: 'number' } } } } },
  { type: 'function' as const, function: { name: 'nestknow_reinforce', description: 'Boost knowledge heat when it proves true.', parameters: { type: 'object', properties: { knowledge_id: { type: 'number' }, context: { type: 'string' } }, required: ['knowledge_id'] } } },
  { type: 'function' as const, function: { name: 'nestknow_contradict', description: 'Flag a contradiction against knowledge.', parameters: { type: 'object', properties: { knowledge_id: { type: 'number' }, context: { type: 'string' } }, required: ['knowledge_id'] } } },
  { type: 'function' as const, function: { name: 'nestknow_landscape', description: 'Overview of knowledge state.', parameters: { type: 'object', properties: {} } } },
];
