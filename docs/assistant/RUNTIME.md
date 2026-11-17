# Operza website assistant: runtime, controls and setup

Status: **implemented, switched off.** The code ships with every safeguard
in place and the assistant disabled. Until the Founder completes the setup
below for an environment, `/api/assistant` answers 503 without calling a
model and the homepage shows no input at all, exactly as before. Production
additionally requires a separate switch that must not be set until the
Founder approves release.

## How a question is answered

```
Browser (components/AskOperza.tsx)
  POST /api/assistant  { messages: [...] }      text only, in memory only
        |
app/api/assistant/route.ts  ->  lib/assistant/runtime/handler.ts
  1. method is POST                                        else 405
  2. configuration complete (fail closed)                  else 503
  3. Origin is this site, Sec-Fetch-Site same-origin       else 403
  4. JSON body, at most 16 KB                              else 415 / 413
  5. Vercel BotID says human                               else 403 (503 if BotID fails)
  6. Vercel WAF rate limit, per visitor (and optional
     site-wide), via @vercel/firewall                      else 429 (503 if the rule is
                                                           missing, blocked or slow)
  7. conversation valid: visitor/assistant turns only,
     visitor first and last, size caps                     else 400
  8. model call through AI Gateway: reviewed instructions,
     no tools, no retries, 500 output tokens, 15 s to the
     first words, 25 s in total                            budget/credentials -> 503,
                                                           timeout -> 504
        |
  streamed plain text back to the browser
```

The model only ever receives the reviewed instructions and knowledge from
PR #25 (`buildSystemPrompt()`) and the visitor's conversation. It has no
tools, cannot reach any database, workspace or Supabase data, and cannot take
any action.

## Controls and what actually enforces them

| Risk | Control | Enforced by |
|---|---|---|
| Spending | AI Gateway **project budget** (monthly limit) | Vercel AI Gateway: requests past the limit are rejected with 402, shown to visitors as "unavailable". Soft cap: the single request that crosses the limit completes. |
| Spending rate | Per-visitor rate limit; optional site-wide rule | Vercel WAF (`@vercel/firewall`), counted at the edge per region |
| Runaway answers | 500 output tokens, 25 s total, 15 s to first words, no retries | The handler and the AI SDK call |
| Bots | Vercel BotID (Basic) | `checkBotId()` on every request |
| Other sites calling the API | Origin and Sec-Fetch-Site checks | The handler |
| Oversized or malformed input | 16 KB body, 600-character questions, 12 messages, 8,000 characters in total, strict schema | The handler and `validate.ts` |
| Prompt injection | Instructions sent as `instructions`, never mixed with visitor text; visitor and pasted text treated as untrusted (rule `untrusted-input`); no tools to misuse | The prompt and the absence of tools. Residual risk: a model can still be talked into a wrong answer; the evaluation set measures this. |
| Forged history | A client can send invented "assistant" turns | Accepted risk: it can only influence its own conversation; caps keep it small, and the instructions outrank history. |
| Misconfiguration | Fails closed on any missing setting, an unknown model, a missing WAF rule, or a BotID or rate-limit failure | `config.ts` and the handler |
| Accidental production launch | `ASSISTANT_ALLOW_PRODUCTION=true` required in production, on top of `ASSISTANT_ENABLED` | `config.ts` |

A prompt instruction or a browser counter is never treated as a spending
control.

## Founder setup to enable the protected Preview

Nothing below has been done; each step is a Founder action in Vercel.

1. **AI Gateway access.** The team is on Hobby. AI Gateway free credits need
   a valid payment method on the team; paid usage needs AI Gateway credits.
2. **Set the spending cap (the real one).** In the Vercel dashboard, AI
   Gateway → Budgets, or with the CLI:
   `vercel ai-gateway budgets set project stockpilot-landing --limit <USD> --refresh-period monthly`.
   The target is ₹0 to ₹500 a month: choose the dollar figure equal to ₹500
   at the day's exchange rate (for example $5 leaves headroom), and enable
   the 50% / 75% / 100% spend alerts. Budgets take up to about 5 minutes to
   apply.
3. **Create the per-visitor rate-limit rule.** Project → Firewall →
   Configure → New Rule. If: `@vercel/firewall`, Rate limit ID
   `assistant-visitor`. Then: Rate Limit, fixed window, **10 requests per 60
   seconds**, key IP, action Too Many Requests (429). Review Changes →
   Publish. Hobby allows one rate-limit rule per project, which is all this
   needs. (On Pro, a second rule `assistant-site` with a site-wide limit can
   be added and named in `ASSISTANT_GLOBAL_RATE_LIMIT_ID`.)
4. **Let the firewall SDK work on Previews.** Enable *Protection Bypass for
   Automation* (Settings → Deployment Protection) and keep *Automatically
   expose System Environment Variables* on. This is required by
   `@vercel/firewall` on protected Preview deployments; Vercel
   Authentication on the Preview itself stays on.
5. **Environment variables, Preview environment only** (Settings →
   Environment Variables, scope: Preview):

   | Name | Value |
   |---|---|
   | `ASSISTANT_ENABLED` | `true` |
   | `ASSISTANT_MODEL` | `openai/gpt-6-luna` (or `openai/gpt-6.1-terra` after evaluation) |
   | `ASSISTANT_RATE_LIMIT_ID` | `assistant-visitor` |
   | `ASSISTANT_BUDGET_CONFIRMED` | `true` (only after step 2) |
   | `ASSISTANT_ZERO_DATA_RETENTION` | `true` once AI Gateway credits are purchased (see Privacy); leave unset before that, or requests fail with 403 |

   Do **not** set `ASSISTANT_ALLOW_PRODUCTION`. No model key is needed on
   Vercel: the deployment authenticates to AI Gateway with its own OIDC token.
6. **Redeploy the Preview** (the homepage reads the configuration at build
   time). The input appears only when every requirement holds.

To switch it off again, remove `ASSISTANT_ENABLED` (or set it to anything
other than `true`) and redeploy.

## Costs

Measured from the instructions actually served (about 6,200 input tokens per
answer, before prompt caching) and the AI Gateway catalog prices listed on
2026-11-17:

| Model | Per typical answer | Answers per $5 | One evaluation pass (67 cases) |
|---|---|---|---|
| `openai/gpt-6-luna` ($0.10 / $0.50 per M tokens) | about $0.0008 | about 6,500 | $0.05 to $0.06 |
| `openai/gpt-6.1-terra` ($1.00 / $5.00 per M tokens) | about $0.0075 | about 650 | $0.50 to $0.58 |

Prompt caching can cut the repeated instruction cost substantially; these
figures assume none. WAF rate limiting on Hobby includes 1,000,000 allowed
requests; BotID Basic has no charge. Re-check prices on the day before any
decision.

The model is chosen only by `ASSISTANT_MODEL`, from the two approved ids in
`lib/assistant/runtime/models.ts`. There is no automatic fallback or upgrade
to another model.

## Live evaluation

`npm run eval:assistant` runs a dry run (cost estimate, no calls).
A paid run needs all of: `--run`, `--budget-usd <amount>`, and
`AI_GATEWAY_API_KEY` in the shell (an AI Gateway API key, ideally with its
own small key budget, for example $1). Before every call it checks that the
worst case fits the remaining budget, and stops otherwise. It reports pass
rates by category (product facts, plan recommendations, pricing, GST and
Tally, Linspace, prompt injection, data access, languages), latency, tokens
and cost, and writes answers to `eval-results/` (git-ignored).

**No paid evaluation has been run**: no Gateway credentials or approved
evaluation budget were available. The figures above are estimates.

## Privacy

- **This application** stores nothing: no conversation storage, no browser
  storage, no analytics. Server logs record only an event name, a status
  code and timings; never message text, IP addresses or user agents
  (tested by `test:assistant-endpoint`, section G).
- **Vercel AI Gateway** does not retain prompts or responses ("immediately
  and permanently deleted after requests are completed"). It records request
  metadata (model, provider, token usage, cost, duration) for billing and
  observability; the Logs page lists requests for up to 36 days.
- **The model provider (OpenAI for both candidates).** Without zero data
  retention, the provider's own default data policy applies, which can
  include retention for abuse monitoring, outside Operza's control. With
  `ASSISTANT_ZERO_DATA_RETENTION=true`, AI Gateway routes only to providers
  with a ZDR agreement; for OpenAI that is "ZDR with safety retention" (image
  and file inputs are scanned; this assistant sends text only). Per-request
  ZDR has no extra cost but requires a paid account (purchased AI Gateway
  credits on Hobby).
- **Vercel Firewall and BotID** process the visitor's IP address and browser
  signals to rate-limit and detect bots, under Vercel's terms.
- Any conversation logging, analytics or stored transcripts would need a
  separate Founder decision.

## Known limitations

- Rate-limit counters are per Vercel region, so a visitor reaching several
  regions can exceed the per-visitor limit by that factor.
- The AI Gateway budget is a soft cap: the request that crosses it completes.
- The WAF rule's existence can only be checked at request time; a missing
  rule fails closed (503), it never fails open.
- Answers are generated and can be wrong; the deterministic grader catches
  forbidden claims in evaluation, not in live traffic.
- The local `npm run build` still fails with SIGSEGV while rendering the
  `next/og` images, as on `main`; the Vercel build is authoritative.
