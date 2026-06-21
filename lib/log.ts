// Minimal structured (JSON-line) logger. Keeps logs greppable/parseable in
// production. Swap the sink here for Sentry/Datadog/etc. without touching call
// sites. Errors are serialized to message + stack.
type Level = "info" | "warn" | "error";

function serialize(value: unknown) {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  return value;
}

function emit(level: Level, event: string, data?: Record<string, unknown>) {
  const payload = {
    level,
    event,
    time: new Date().toISOString(),
    ...(data
      ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, serialize(v)]),
        )
      : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) =>
    emit("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) =>
    emit("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) =>
    emit("error", event, data),
};
