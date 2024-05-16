export type TokenType =
  // Single character tokens
  "LeftParen" |
  "RightParen" |
  "LeftBrace" |
  "RightBrace" |
  "Comma" |
  "Dot" |
  "Minus" |
  "Plus" |
  "Semicolon" |
  "Slash" |
  "Star" |

  // One or two character tokens
  "Bang" |
  "BangEqual" |
  "Equal" |
  "EqualEqual" |
  "Greater" |
  "GreaterEqual" |
  "Less" |
  "LessEqual" |

  // Literals
  "Identifier" |
  "String" |
  "Number" |

  // Keywords
  "And" |
  "Class" |
  "Else" |
  "False" |
  "Fun" |
  "For" |
  "If" |
  "Nil" |
  "Or" |
  "Print" |
  "Return" |
  "Super" |
  "This" |
  "True" |
  "Var" |
  "While" |

  "Eof";

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly line: number,
    public readonly lexeme: string,
    public readonly literal?: unknown) { }

  toString() {
    return `${this.type} ${this.lexeme} ${this.literal?.toString()}`;
  }
};
