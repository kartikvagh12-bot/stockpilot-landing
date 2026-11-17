// ---------------------------------------------------------------------------
// ASSISTANT CONVERSATION RECOVERY TESTS (offline)
//
//   npm run test:assistant-conversation
//
// Drives the browser's real conversation state machine
// (lib/assistant/client/conversation.ts) and its real streaming client
// (lib/assistant/client/stream.ts) through fake fetch responses: a refusal
// before streaming, Stop before the first word, Stop mid-answer, a stream that
// breaks after partial output, a network failure, retries, and long
// histories. Every history the client would send is checked with the SERVER's
// own validator, and a seeded random walk of thousands of events checks the
// invariant: history never has two visitor turns in a row and never contains
// an unfinished answer.
//
// Section H runs the component's real request runner
// (lib/assistant/client/requests.ts) against a hand-driven fake network, so
// overlapping requests (New conversation during an answer, then an immediate
// question; retry while the old request is still winding down; events that
// arrive late from an abandoned request) are replayed deterministically.
// ---------------------------------------------------------------------------
const { reduce, initialConversation, requestMessages, pendingRequest, isBusy, canRetry } = await import("../lib/assistant/client/conversation.ts");
const { createRequestRunner } = await import("../lib/assistant/client/requests.ts");
const { streamAnswer, STREAM_ERROR_MARKER } = await import("../lib/assistant/client/stream.ts");
const { validateConversation } = await import("../lib/assistant/runtime/validate.ts");

let checks = 0;
let failures = 0;
const ok = (label, cond, detail = "") => {
  checks++;
  if (!cond) failures++;
  if (!cond || process.env.VERBOSE) console.log(`  ${cond ? "✓" : "✗"} ${label}${!cond && detail ? `\n      ${detail}` : ""}`);
};
const section = (t) => console.log(`\n---- ${t} ----`);

/* -------------------------------------------------------- fake network */
const enc = new TextEncoder();
const tick = () => new Promise((r) => setTimeout(r, 0));

/** A fake fetch. `script` is a list of chunks, or "WAIT" to block until the
 *  request is aborted (like a real fetch body), or "THROW" to fail. */
function fakeFetch({ status = 200, script = [], rejectWith } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    if (rejectWith) throw rejectWith;
    const signal = init.signal;
    const abortErr = () => Object.assign(new Error("aborted"), { name: "AbortError" });
    if (signal.aborted) throw abortErr();
    if (status !== 200) return new Response(JSON.stringify({ error: "x" }), { status });
    let i = 0;
    const body = new ReadableStream({
      async pull(c) {
        if (i >= script.length) return c.close();
        const step = script[i++];
        if (step === "WAIT") {
          await new Promise((_, rej) => signal.addEventListener("abort", () => rej(abortErr()), { once: true }));
        } else if (step === "THROW") {
          throw new TypeError("network");
        } else {
          await tick();
          c.enqueue(enc.encode(step));
        }
      },
    });
    signal.addEventListener("abort", () => body.cancel().catch(() => {}), { once: true });
    return new Response(body, { status: 200 });
  };
  return { impl, calls };
}

/** Run one request for the waiting exchange; returns the final state. */
async function send(state, fetchSpec, { abortAfterMs } = {}) {
  const { messages, requestId } = pendingRequest(state);
  const controller = new AbortController();
  let s = state;
  const { impl, calls } = fakeFetch(fetchSpec);
  if (abortAfterMs !== undefined) setTimeout(() => controller.abort(), abortAfterMs);
  await streamAnswer(messages, { fetchImpl: impl, signal: controller.signal, emit: (e) => (s = reduce(s, { ...e, requestId })) });
  return { state: s, sent: calls[0]?.body?.messages ?? messages };
}

const historyIsValid = (msgs) => validateConversation({ messages: msgs }).ok;
const last = (s) => s.exchanges[s.exchanges.length - 1];

/* ========================================================================= */
section("A. A REFUSAL BEFORE STREAMING");
/* ========================================================================= */
for (const [status, problem] of [[503, "unavailable"], [429, "rate_limited"], [400, "too_long"], [500, "failed"]]) {
  let s = reduce(initialConversation, { type: "ask", question: "How much does it cost?" });
  ({ state: s } = await send(s, { status }));
  ok(`(A-${status}) becomes a visible '${problem}' failure with no answer text`,
     last(s).status === "failed" && last(s).problem === problem && last(s).answer === "");
  ok(`(A-${status}) ...retry is offered only when it can help`, canRetry(s) === (problem !== "too_long"));
  s = reduce(s, { type: "ask", question: "Then what plans are there?" });
  const msgs = requestMessages(s);
  ok(`(A-${status}) ...and the next question is sent alone, not after the failed one`,
     msgs.length === 1 && msgs[0].content === "Then what plans are there?" && historyIsValid(msgs));
}

/* ========================================================================= */
section("B. STOP BEFORE THE FIRST WORD");
/* ========================================================================= */
{
  let s = reduce(initialConversation, { type: "ask", question: "Tell me about Tally" });
  ({ state: s } = await send(s, { script: ["WAIT"] }, { abortAfterMs: 5 }));
  ok("(B1) the exchange is marked stopped, with no answer", last(s).status === "stopped" && last(s).answer === "");
  ok("(B2) the conversation is no longer busy", !isBusy(s));
  s = reduce(s, { type: "ask", question: "Does it sync with Tally?" });
  const msgs = requestMessages(s);
  ok("(B3) the next question is not sent after the stopped one (no two visitor turns)",
     msgs.length === 1 && historyIsValid(msgs), JSON.stringify(msgs));
}

/* ========================================================================= */
section("C. STOP DURING A PARTIAL ANSWER");
/* ========================================================================= */
{
  let s = reduce(initialConversation, { type: "ask", question: "Explain Operza Complete" });
  ({ state: s } = await send(s, { script: ["Operza Complete ", "connects the ", "WAIT"] }, { abortAfterMs: 30 }));
  ok("(C1) the partial answer stays visible, marked stopped",
     last(s).status === "stopped" && last(s).answer === "Operza Complete connects the ");
  s = reduce(s, { type: "ask", question: "And Factory?" });
  const msgs = requestMessages(s);
  ok("(C2) the partial answer is never sent back as history",
     msgs.length === 1 && !JSON.stringify(msgs).includes("connects the") && historyIsValid(msgs));
  ok("(C3) the stopped exchange is still on screen after the new question",
     s.exchanges.length === 2 && s.exchanges[0].answer === "Operza Complete connects the ");
}

/* ========================================================================= */
section("D. THE STREAM BREAKS AFTER PARTIAL OUTPUT");
/* ========================================================================= */
{
  let s = reduce(initialConversation, { type: "ask", question: "What is Linspace?" });
  ({ state: s } = await send(s, { script: ["Operza Linspace is ", `in devel${STREAM_ERROR_MARKER}`] }));
  ok("(D1) a server-marked break is a visible failure keeping the words before it",
     last(s).status === "failed" && last(s).answer === "Operza Linspace is in devel");
  ok("(D2) the break marker is never shown as text", !last(s).answer.includes("\u001E"));

  let split = reduce(initialConversation, { type: "ask", question: "What is Linspace?" });
  ({ state: split } = await send(split, { script: ["Operza Linspace ", "\u001E", "error"] }));
  ok("(D3) ...even when the marker is split across two chunks",
     last(split).status === "failed" && last(split).answer === "Operza Linspace " && !last(split).answer.includes("\u001E"));

  let net = reduce(initialConversation, { type: "ask", question: "What is Linspace?" });
  ({ state: net } = await send(net, { script: ["Operza ", "THROW"] }));
  ok("(D4) a network break mid-answer is a visible failure", last(net).status === "failed" && last(net).answer === "Operza ");

  s = reduce(s, { type: "ask", question: "When is it launching?" });
  const msgs = requestMessages(s);
  ok("(D5) the interrupted answer is never sent back as history",
     msgs.length === 1 && !JSON.stringify(msgs).includes("in devel") && historyIsValid(msgs));

  let frag = reduce(initialConversation, { type: "ask", question: "What is Linspace?" });
  ({ state: frag } = await send(frag, { script: ["Operza Linspace", "\u001Eer", "THROW"] }));
  ok("(D4b) a marker fragment just before a network break is never shown",
     last(frag).status === "failed" && last(frag).answer === "Operza Linspace");

  const empty = await send(reduce(initialConversation, { type: "ask", question: "Hi" }), { script: [] });
  ok("(D6) a stream that ends with no words is a failure, not an empty answer", last(empty.state).status === "failed");

  const offline = await send(reduce(initialConversation, { type: "ask", question: "Hi" }), { rejectWith: new TypeError("offline") });
  ok("(D7) a failed request (offline) is a failure, not a stop", last(offline.state).status === "failed");
}

/* ========================================================================= */
section("E. RETRY AND FOLLOW-UPS");
/* ========================================================================= */
{
  let s = reduce(initialConversation, { type: "ask", question: "Which plan has accounting?" });
  ({ state: s } = await send(s, { script: ["Operza Books ", "and Operza Complete."] }));
  ok("(E1) a finished answer is done", last(s).status === "done");
  s = reduce(s, { type: "ask", question: "Which one has stock too?" });
  const before = requestMessages(s);
  ok("(E2) a follow-up sends the finished exchange as history",
     before.length === 3 && before[1].role === "assistant" && before[2].content === "Which one has stock too?" && historyIsValid(before));
  ({ state: s } = await send(s, { status: 503 }));
  s = reduce(s, { type: "retry" });
  const retried = requestMessages(s);
  ok("(E3) retrying re-sends exactly the same valid history, without duplicating the question",
     JSON.stringify(retried) === JSON.stringify(before) && historyIsValid(retried));
  ok("(E4) asking while an answer is in progress is ignored", reduce(s, { type: "ask", question: "x" }) === s);
  let tooLong = reduce(initialConversation, { type: "ask", question: "q" });
  ({ state: tooLong } = await send(tooLong, { status: 400 }));
  ok("(E5) a too-long refusal is not retried", reduce(tooLong, { type: "retry" }) === tooLong);
  const stopped = (await send(reduce(initialConversation, { type: "ask", question: "q" }), { script: ["WAIT"] }, { abortAfterMs: 5 })).state;
  const again = reduce(stopped, { type: "retry" });
  ok("(E6) a stopped question can be asked again", last(again).status === "waiting" && last(again).answer === "");
  ok("(E7) reset clears everything", reduce(s, { type: "reset" }).exchanges.length === 0);
}

/* ========================================================================= */
section("F. LONG CONVERSATIONS STAY WITHIN THE SERVER'S LIMITS");
/* ========================================================================= */
{
  let s = initialConversation;
  for (let i = 0; i < 20; i++) {
    s = reduce(s, { type: "ask", question: `Question ${i} ${"q".repeat(200)}` });
    ({ state: s } = await send(s, { script: [`Answer ${i} ${"a".repeat(900)}`] }));
  }
  s = reduce(s, { type: "ask", question: "Final question" });
  const msgs = requestMessages(s);
  ok(`(F1) the newest finished exchanges are kept and the server accepts them (${msgs.length} messages)`,
     historyIsValid(msgs) && msgs.at(-1).content === "Final question" && msgs[msgs.length - 2].content.startsWith("Answer 19"));
}

/* ========================================================================= */
section("G. RANDOM WALK: HISTORY IS ALWAYS VALID");
/* ========================================================================= */
{
  // Seeded, so a failure is reproducible.
  let seed = 20261117;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  let s = initialConversation;
  // Network events mostly carry the current request's id, sometimes a stale
  // one (an abandoned request reporting late), which must change nothing.
  const id = () => (rand() < 0.8 ? s.exchanges.at(-1)?.requestId ?? 0 : Math.floor(rand() * (s.lastRequestId + 1)));
  const EVENTS = [
    () => ({ type: "ask", question: `q${Math.floor(rand() * 1000)}` }),
    () => ({ type: "chunk", text: rand() < 0.2 ? "" : `w${Math.floor(rand() * 100)} `, requestId: id() }),
    () => ({ type: "finished", requestId: id() }),
    () => ({ type: "failed", problem: ["rate_limited", "unavailable", "too_long", "failed"][Math.floor(rand() * 4)], requestId: id() }),
    () => ({ type: "stopped", requestId: id() }),
    () => ({ type: "retry" }),
    () => ({ type: "reset" }),
  ];
  let requests = 0;
  let staleIgnored = 0;
  let bad = null;
  for (let i = 0; i < 20000 && !bad; i++) {
    const e = EVENTS[Math.floor(rand() * EVENTS.length)]();
    const current = s.exchanges.at(-1)?.requestId;
    const next = reduce(s, e);
    if ("requestId" in e && e.requestId !== current) {
      staleIgnored++;
      if (next !== s) bad = { i, msgs: ["stale event changed state", e] };
    }
    s = next;
    const msgs = requestMessages(s);
    if (!msgs) continue;
    requests++;
    const finished = new Set(s.exchanges.filter((x) => x.status === "done").map((x) => x.answer));
    const assistantOk = msgs.filter((m) => m.role === "assistant").every((m) => finished.has(m.content));
    if (!historyIsValid(msgs) || !assistantOk) bad = { i, msgs, s };
  }
  ok(`(G1) every one of ${requests} requests in a 20,000-event random walk is valid and uses finished answers only`,
     !bad && requests > 1000, bad ? JSON.stringify(bad.msgs).slice(0, 300) : "");
  ok(`(G2) none of the ${staleIgnored} events from stale requests changed anything`, !bad && staleIgnored > 500);
  ok("(G3) request ids are never reused, not even after New conversation",
     (() => { let t = reduce(initialConversation, { type: "ask", question: "a" }); const a = t.exchanges[0].requestId;
              t = reduce(reduce(t, { type: "reset" }), { type: "ask", question: "b" }); return t.exchanges[0].requestId > a; })());
}

/* ========================================================================= */
section("H. OVERLAPPING REQUESTS, DRIVEN BY HAND THROUGH THE REAL RUNNER");
/* ========================================================================= */
{
  const abortError = () => Object.assign(new Error("aborted"), { name: "AbortError" });
  const flush = async () => { for (let i = 0; i < 5; i++) await tick(); };

  /** A network whose every request is driven step by step by the test.
   *  `honorAbort: false` models a request that keeps delivering after it was
   *  abandoned, so only the request identity can keep it out. */
  function network() {
    const calls = [];
    const fetchImpl = (url, init) => {
      const call = { body: JSON.parse(init.body), signal: init.signal, honorAbort: true, controller: null };
      call.promise = new Promise((resolve, reject) => { call.resolveFetch = resolve; call.rejectFetch = reject; });
      init.signal.addEventListener("abort", () => {
        if (!call.honorAbort) return;
        if (!call.controller) call.rejectFetch(abortError());
        else { try { call.controller.error(abortError()); } catch {} }
      }, { once: true });
      call.respond = (status = 200) => {
        if (status !== 200) return call.resolveFetch(new Response("{}", { status }));
        const body = new ReadableStream({ start: (c) => { call.controller = c; } });
        call.resolveFetch(new Response(body, { status: 200 }));
      };
      // After an abort the body is errored; further sends are simply lost.
      call.push = (t) => { try { call.controller.enqueue(enc.encode(t)); } catch {} };
      call.end = () => { try { call.controller.close(); } catch {} };
      calls.push(call);
      return call.promise;
    };
    return { calls, fetchImpl };
  }

  /** The component's wiring: reducer + runner, the runner synced after every
   *  state change (as the component's effect does). `afterEvent` lets a test
   *  act at the exact moment an event lands, before any cleanup has run. */
  function app({ afterEvent } = {}) {
    const net = network();
    const h = { state: initialConversation, ...net };
    const dispatch = (e) => {
      h.state = reduce(h.state, e);
      h.runner.sync(h.state);
      afterEvent?.(e, h);
    };
    h.runner = createRequestRunner({ fetchImpl: net.fetchImpl, dispatch });
    h.dispatch = dispatch;
    h.ask = (q) => dispatch({ type: "ask", question: q });
    h.reset = () => { h.runner.abort(); dispatch({ type: "reset" }); };
    h.stop = () => h.runner.abort();
    return h;
  }

  // H1: New conversation during an answer, then a question at once.
  {
    const a = app();
    a.ask("Old question");
    a.calls[0].respond();
    a.calls[0].push("Old answer, part ");
    await flush();
    a.reset();
    a.ask("New question");
    ok("(H1) after New conversation, the next question starts its own request at once",
       a.calls.length === 2 && a.calls[0].signal.aborted && !a.calls[1].signal.aborted);
    ok("(H1b) ...sending only the new question",
       a.calls[1].body.messages.length === 1 && a.calls[1].body.messages[0].content === "New question");
    await flush(); // the abandoned request reports its partial text and "stopped" now
    ok("(H1c) the abandoned request's late 'stopped' and text do not touch the new conversation",
       a.state.exchanges.length === 1 && last(a.state).question === "New question" && last(a.state).status === "waiting" && last(a.state).answer === "");
    a.calls[1].respond();
    a.calls[1].push("New answer.");
    a.calls[1].end();
    await flush();
    ok("(H1d) ...and the new answer completes normally", last(a.state).status === "done" && last(a.state).answer === "New answer.");
  }

  // H2: the abandoned request keeps streaming and even finishes afterwards.
  {
    const a = app();
    a.ask("Old question");
    a.calls[0].honorAbort = false;
    a.calls[0].respond();
    a.calls[0].push("Old ");
    await flush();
    a.reset();
    a.ask("New question");
    a.calls[1].respond();
    a.calls[0].push("LATE WORDS FROM THE OLD ANSWER");
    a.calls[0].end();
    await flush();
    ok("(H2) words and a finish from an abandoned request never reach the new conversation",
       a.state.exchanges.length === 1 && last(a.state).status === "waiting" && !last(a.state).answer.includes("LATE"));
    a.calls[1].push("Fresh.");
    a.calls[1].end();
    await flush();
    ok("(H2b) ...and the new request still completes", last(a.state).status === "done" && last(a.state).answer === "Fresh.");
  }

  // H3: New conversation before the old request even got a response, which
  // then arrives late (a fetch that ignores the abort).
  {
    const a = app();
    a.ask("Old question");
    a.calls[0].honorAbort = false;
    a.reset();
    a.ask("New question");
    a.calls[0].respond(503);
    await flush();
    ok("(H3) a late refusal for an abandoned request does not fail the new question",
       a.calls.length === 2 && last(a.state).status === "waiting" && last(a.state).question === "New question");
  }

  // H4: Retry clicked the instant a failure lands, before the failed
  // request's own cleanup has run.
  {
    let retried = false;
    const a = app({ afterEvent: (e, h) => { if (e.type === "failed" && !retried) { retried = true; h.dispatch({ type: "retry" }); } } });
    a.ask("Which plan has accounting?");
    a.calls[0].respond(503);
    await flush();
    ok("(H4) a retry during the failed request's cleanup starts a new request at once (never stranded)",
       a.calls.length === 2 && last(a.state).status === "waiting" && JSON.stringify(a.calls[1].body) === JSON.stringify(a.calls[0].body));
    a.calls[1].respond();
    a.calls[1].push("Operza Books and Operza Complete.");
    a.calls[1].end();
    await flush();
    ok("(H4b) ...and the retried answer completes", last(a.state).status === "done");
  }

  // H5: Stop, then Ask again at once; the stopped request reports late.
  {
    const b = app();
    b.ask("Explain Operza Complete");
    b.calls[0].respond();
    b.calls[0].push("Operza Complete connects the ");
    await flush();
    b.stop();
    await flush();
    ok("(H5b) Stop keeps the partial answer, marked stopped (unchanged)",
       last(b.state).status === "stopped" && last(b.state).answer === "Operza Complete connects the ");
    b.dispatch({ type: "retry" });
    ok("(H5c) Ask again starts a fresh request with the same question",
       b.calls.length === 2 && b.calls[1].body.messages.at(-1).content === "Explain Operza Complete" && last(b.state).answer === "");
    await flush();
    b.calls[1].respond();
    b.calls[1].push("Operza Complete joins the floor and the books.");
    b.calls[1].end();
    await flush();
    ok("(H5d) ...which completes without any of the stopped answer mixed in",
       last(b.state).status === "done" && last(b.state).answer === "Operza Complete joins the floor and the books.");
    b.ask("And Factory?");
    const msgs = b.calls[2].body.messages;
    ok("(H5e) follow-ups send only finished exchanges (unchanged)",
       msgs.length === 3 && msgs[1].content === "Operza Complete joins the floor and the books." && historyIsValid(msgs));
  }

  // H6: an interrupted answer (server break marker) is unchanged.
  {
    const a = app();
    a.ask("What is Linspace?");
    a.calls[0].respond();
    a.calls[0].push(`Operza Linspace is in devel${STREAM_ERROR_MARKER}`);
    await flush();
    ok("(H6) an interrupted answer stays visible as a failure (unchanged)",
       last(a.state).status === "failed" && last(a.state).answer === "Operza Linspace is in devel");
    a.ask("When is it launching?");
    ok("(H6b) ...and is not sent as history", a.calls[1].body.messages.length === 1);
  }

  // H7: rapid churn. Reset and ask many times while every older request keeps
  // sending; only the newest conversation is ever affected.
  {
    const a = app();
    for (let i = 0; i < 25; i++) {
      a.ask(`Question ${i}`);
      a.calls[i].honorAbort = false;
      a.calls[i].respond();
      if (i < 24) a.reset();
    }
    for (let i = 0; i < 24; i++) { a.calls[i].push(`stale ${i}`); a.calls[i].end(); }
    await flush();
    a.calls[24].push("Only this.");
    a.calls[24].end();
    await flush();
    ok("(H7) 25 overlapping requests: exactly one per question, and only the newest reaches the screen",
       a.calls.length === 25 && a.state.exchanges.length === 1 && last(a.state).answer === "Only this." && last(a.state).status === "done");
  }

  // H8: syncing again with the same state never starts a duplicate request
  // (React may run the effect twice in development).
  {
    const a = app();
    a.ask("q");
    a.runner.sync(a.state);
    a.runner.sync(a.state);
    ok("(H8) a waiting exchange is requested exactly once", a.calls.length === 1);
  }

  // H9: if a newer request ever becomes current while an older one is still
  // running (even without an explicit abort), the runner cancels the older.
  {
    const a = app();
    a.ask("Old");
    a.dispatch({ type: "reset" }); // state change alone, no runner.abort()
    a.ask("New");
    ok("(H9) starting a newer request cancels any older one still running",
       a.calls.length === 2 && a.calls[0].signal.aborted && !a.calls[1].signal.aborted);
  }
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} ${checks - failures}/${checks}\n`);
process.exit(failures === 0 ? 0 : 1);
