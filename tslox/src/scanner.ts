import { error } from "./error";
import type { TokenType } from "./token";
import { Token } from "./token";

function isDigit(c: string) {
  return /[0-9]/.test(c);
}

function isAlpha(c: string) {
  return /[a-zA-Z_]/.test(c);
}

function isAlphanumeric(c: string) {
  return isDigit(c) || isAlpha(c);
}

const KEYWORDS = new Map<string, TokenType>([
  ["and", "And"],
  ["class", "Class"],
  ["else", "Else"],
  ["false", "False"],
  ["fun", "Fun"],
  ["for", "For"],
  ["if", "If"],
  ["nil", "Nil"],
  ["or", "Or"],
  ["print", "Print"],
  ["return", "Return"],
  ["super", "Super"],
  ["this", "This"],
  ["true", "True"],
  ["var", "Var"],
  ["while", "While"],
]);

export default class Scanner {
  private start = 0;
  private current = 0;
  private line = 1;
  private tokens: Token[] = [];

  constructor(private readonly source: string) { }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token("Eof", this.line, ""));
    return this.tokens;
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "(": {
        this.addToken("LeftParen");
        break;
      }
      case ")": {
        this.addToken("RightParen");
        break;
      }
      case "{": {
        this.addToken("LeftBrace");
        break;
      }
      case "}": {
        this.addToken("RightBrace");
        break;
      }
      case ",": {
        this.addToken("Comma");
        break;
      }
      case ".": {
        this.addToken("Dot");
        break;
      }
      case "-": {
        this.addToken("Minus");
        break;
      }
      case "+": {
        this.addToken("Plus");
        break;
      }
      case ";": {
        this.addToken("Semicolon");
        break;
      }
      case "*": {
        this.addToken("Star");
        break;
      }
      case "!": {
        this.addToken(this.match("=") ? "BangEqual" : "Bang");
        break;
      }
      case "=": {
        this.addToken(this.match("=") ? "EqualEqual" : "Equal");
        break;
      }
      case "<": {
        this.addToken(this.match("=") ? "LessEqual" : "Less");
        break;
      }
      case ">": {
        this.addToken(this.match("=") ? "GreaterEqual" : "Greater");
        break;
      }
      case "/": {
        if (this.match("/")) {
          while (this.peek() != "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken("Slash");
        }
        break;
      }
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n": {
        this.line++;
        break;
      }
      case '"': {
        this.stringToken();
        break;
      }
      case "o": {
        if (this.match("r")) {
          this.addToken("Or");
        }
        break;
      }
      default: {
        if (isDigit(c)) {
          this.numberToken();
        } else if (isAlpha(c)) {
          this.identifierToken();
        } else {
          error(this.line, "Unexpected character.");
        }
        break;
      }
    }
  }

  private advance() {
    return this.source[this.current++];
  }

  private match(c: string) {
    if (this.isAtEnd()) {
      return false;
    }
    if (this.source[this.current] != c) {
      return false;
    }

    this.current++;
    return true;
  }

  private peek() {
    if (this.isAtEnd()) {
      return "\0";
    }
    return this.source[this.current];
  }

  private peekNext() {
    if (this.current + 1 >= this.source.length) {
      return "\0";
    }
    return this.source[this.current + 1];
  }

  private addToken(type: TokenType, literal?: unknown) {
    var text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, this.line, text, literal));
  }

  private stringToken() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      error(this.line, "Unterminated string.");
    }

    // The closing '"'.
    this.advance();

    // Trim the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken("String", value);
  }

  private numberToken() {
    while (isDigit(this.peek())) {
      this.advance();
    }

    // Look for fractional part.
    if (this.peek() === "." && isDigit(this.peekNext())) {
      // Consume the '.'.
      this.advance();

      while (isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(this.start, this.current);
    this.addToken("Number", Number.parseFloat(value));
  }

  private identifierToken() {
    while (isAlphanumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    let type: TokenType = "Identifier";
    if (KEYWORDS.has(text)) {
      type = KEYWORDS.get(text)!;
    }
    this.addToken(type);
  }
};
