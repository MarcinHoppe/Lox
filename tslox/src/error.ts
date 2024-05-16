import RuntimeError from "./runtimeerror";
import { Token } from "./token";

let errorReported = false;
let runtimeErrorReported = false;

function report(line: number, where: string, message: string) {
  console.error(`[${line}] Error${where}: ${message}`);
  errorReported = true;
}

export function error(location: number | Token, message: string) {
  if (typeof location === "number") {
    report(location, "", message);
  } else {
    if (location.type === "Eof") {
      report(location.line, " at end", message);
    } else {
      report(location.line, ` at '${location.lexeme}'`, message);
    }
  }
}

export function runtimeError(error: RuntimeError) {
  console.error(`${error.message}\n[line ${error.token.line}]`);
  runtimeErrorReported = true;
}

export function hadError() {
  return errorReported;
}

export function hadRuntimeError() {
  return runtimeErrorReported;
}

export function resetError() {
  errorReported = false;
}
