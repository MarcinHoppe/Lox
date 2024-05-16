import { readFileSync } from "fs";
import { argv, exit, stdin, stdout } from "process";
import { createInterface } from "readline";
import Scanner from "./scanner";
import { hadError, hadRuntimeError, resetError } from "./error";
import { Parser } from "./parser";
import Interpreter from "./interpreter";
import { Resolver } from "./resolver";

const interpreter = new Interpreter();

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens);
  const statements = parser.parse();

  if (hadError()) {
    return;
  }

  const resolver = new Resolver((expr, depth) => interpreter.resolve(expr, depth));
  resolver.resolve(statements);

  if (hadError()) {
    return;
  }

  interpreter.interpret(statements);
}

function runFile(path: string) {
  const source = readFileSync(path).toString("utf-8");
  
  run(source);
  
  if (hadError()) {
    exit(65);
  }
  
  if (hadRuntimeError()) {
    exit(70);
  }
}

function runPrompt() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
    prompt: "> "
  });
  
  rl.prompt();

  rl.on("line", line => {
    if (!line) {
      rl.close();
      return;
    }

    run(line);
    resetError();

    rl.prompt();
  });
}

function main() {
  if (argv.length > 3) {
    console.log("Usage: tslox [source]");
    exit(64);
  } else if (argv.length == 3) {
    runFile(argv[2]);
  } else {
    runPrompt();
  }
}

main();
