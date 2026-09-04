import assert from "node:assert/strict";
import { test } from "node:test";
import { buildChatMessages } from "./aiMessages.ts";

test("drops the Chef AI greeting so the first turn is user", () => {
  const messages = buildChatMessages(
    [{ role: "assistant", content: "Hej! Jag är din AI-kockassistent." }],
    "Hjälp mig med pasta",
  );
  assert.deepEqual(messages, [{ role: "user", content: "Hjälp mig med pasta" }]);
});

test("keeps alternating follow-up turns after dropping a leading assistant message", () => {
  const messages = buildChatMessages(
    [
      { role: "assistant", content: "Hej!" },
      { role: "user", content: "Kostnad för lax?" },
      { role: "assistant", content: "Runt 45 kr per portion." },
    ],
    "Och med torsk?",
  );
  assert.deepEqual(messages, [
    { role: "user", content: "Kostnad för lax?" },
    { role: "assistant", content: "Runt 45 kr per portion." },
    { role: "user", content: "Och med torsk?" },
  ]);
});

test("merges consecutive user turns instead of sending duplicate roles", () => {
  const messages = buildChatMessages(
    [{ role: "user", content: "Första frågan" }],
    "Andra frågan",
  );
  assert.deepEqual(messages, [{ role: "user", content: "Första frågan\n\nAndra frågan" }]);
});

test("ignores malformed history entries and empty assistant filler", () => {
  const messages = buildChatMessages(
    [
      { role: "system", content: "ignore me" },
      { role: "assistant", content: "   " },
      null,
      { role: "user", content: 12 },
    ],
    "Menyidé",
  );
  assert.deepEqual(messages, [{ role: "user", content: "Menyidé" }]);
});
