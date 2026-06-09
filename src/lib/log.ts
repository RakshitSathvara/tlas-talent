// Structured, single-line JSON logging (BACKEND-ARCHITECTURE.md §4.5). No console.log in
// committed code — call log.info/warn/error so output is machine-parseable in the log drain.

type Fields = Record<string, unknown>;
type Level = "info" | "warn" | "error";

function emit(level: Level, msg: string, fields?: Fields): void {
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...fields });
  // eslint-disable-next-line no-console -- the single sanctioned console sink
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const log = {
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields) => emit("warn", msg, fields),
  error: (msg: string, fields?: Fields) => emit("error", msg, fields),
};
