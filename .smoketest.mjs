import { createClient } from "@supabase/supabase-js";

const c = createClient(process.env.URL, process.env.KEY);

const payload = {
  name: "Smoketest User",
  email: "smoketest+" + Date.now() + "@operza.test",
  phone: "+91 99999 99999",
  company: "Smoketest Co",
  message: "Round-trip insert verifying anon RLS policy.",
};

console.log("=== 1. Form-style insert (no RETURNING) ===");
console.log("Inserting:", payload);
const ins = await c.from("demo_requests").insert([payload]);
if (ins.error) {
  console.error("INSERT FAILED:", ins.error);
  process.exit(1);
}
console.log("OK row inserted (no body returned)");

console.log("\n=== 2. Anon SELECT must be blocked ===");
const sel = await c.from("demo_requests").select("*").limit(1);
if (sel.error) {
  console.log("OK: anon SELECT correctly blocked:", sel.error.message);
} else if ((sel.data?.length ?? 0) === 0) {
  console.log("OK: anon SELECT returned 0 rows (RLS hides them)");
} else {
  console.error("LEAK: anon can read", sel.data.length, "row(s) — privacy bug");
  process.exit(1);
}

console.log("\n=== 3. Anon UPDATE must be blocked ===");
const upd = await c
  .from("demo_requests")
  .update({ name: "tampered" })
  .eq("email", payload.email);
if (upd.error) {
  console.log("OK: anon UPDATE correctly blocked:", upd.error.message);
} else {
  console.error("LEAK: anon can update — privacy bug");
  process.exit(1);
}

console.log("\n=== 4. Anon DELETE must be blocked ===");
const del = await c.from("demo_requests").delete().eq("email", payload.email);
if (del.error) {
  console.log("OK: anon DELETE correctly blocked:", del.error.message);
} else {
  console.error("LEAK: anon can delete — privacy bug");
  process.exit(1);
}

console.log("\n========== ALL CHECKS PASSED ==========");
