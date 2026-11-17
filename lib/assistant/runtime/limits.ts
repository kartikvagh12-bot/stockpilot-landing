// Hard limits for the public assistant endpoint. Enforced on the server; the
// browser mirrors some of them only to give earlier feedback.

export const LIMITS = {
  /** Largest request body accepted, in bytes. Checked before parsing. */
  maxBodyBytes: 16 * 1024,
  /** Longest single visitor message, in characters. */
  maxMessageChars: 600,
  /** Most messages (visitor and assistant) sent as history in one request. */
  maxMessages: 12,
  /** Total characters across all messages in one request. */
  maxTotalChars: 8000,
  /** Longest assistant turn accepted back as history. */
  maxAssistantChars: 2500,
  /** Most tokens the model may write in one answer. */
  maxOutputTokens: 500,
  /** Wall-clock limit for one answer, start to finish. */
  timeoutMs: 25_000,
  /** How long to wait for the model's first words before giving up. */
  firstTokenTimeoutMs: 15_000,
  /** Timeout for the rate-limit check itself. */
  rateLimitCheckTimeoutMs: 1500,
} as const;
