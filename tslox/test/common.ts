import { Parser } from "../src/parser";
import Scanner from "../src/scanner";
import Interpreter from "../src/interpreter";
import { Resolver } from "../src/resolver";

export function parse(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens);
  return parser.parse();
}

export function interpret(source: string) {
  const statements = parse(source);

  const interpreter = new Interpreter();
  const resolver = new Resolver((expr, depth) => interpreter.resolve(expr, depth));

  resolver.resolve(statements);
  interpreter.interpret(statements);
}
