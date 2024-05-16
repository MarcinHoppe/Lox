import { hadError } from "../src/error";
import Scanner from "../src/scanner";
import { Token } from "../src/token";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("scanner", () => {
  it("returns EOF for empty string", () => {
    const scanner = new Scanner("");
    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe("Eof");
  });
  it("returns EOF after last token", () => {
    const scanner = new Scanner("(");
    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe("LeftParen");
    expect(tokens[1].type).toBe("Eof");
  });
  it("scans multiple single character tokens", () => {
    const source = "(){},.-+;*";
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(source.length + 1);
  });
  it("report error for unrecognized character", () => {
    const source = `+-@;`;
    const scanner = new Scanner(source);

    const errorSpy = jest.spyOn(console, "error");
    scanner.scanTokens();
    expect(errorSpy).toHaveBeenCalledWith("[1] Error: Unexpected character.");

    expect(hadError()).toBe(true);
  });
  describe("multicharacter tokens", () => {
    it("recognizes tokens with common prefix", () => {
      const source = "!!=";
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      const tokenTypes = tokens.map(t => t.type);
      expect(tokenTypes).toStrictEqual(["Bang", "BangEqual", "Eof"]);
    });
    it("recognized simple multicharacter token", () => {
      const source = "or";
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      const tokenTypes = tokens.map(t => t.type);
      expect(tokenTypes).toStrictEqual(["Or", "Eof"]);
    });
  });
  describe("comments", () => {
    it("removes comments", () => {
      const source = "// this is a comment";
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual(new Token("Eof", 1, ""));
    });
    it("removes comments until the end of the line", () => {
      const source = "!// this is a comment";
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      const tokenTypes = tokens.map(t => t.type);
      expect(tokenTypes).toStrictEqual(["Bang", "Eof"]);
    });
    it("handles comments in multiline source", () => {
      const source = `!
// this is a comment
!=
{}`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      const tokenTypes = tokens.map(t => t.type);
      expect(tokenTypes).toStrictEqual(["Bang", "BangEqual", "LeftBrace", "RightBrace", "Eof"]);

      const tokenLines = tokens.map(t => t.line);
      expect(tokenLines).toStrictEqual([1, 3, 4, 4, 4]);
    });
    it("handles single slash correctly", () => {
      const source = "/!// this is a comment";
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      const tokenTypes = tokens.map(t => t.type);
      expect(tokenTypes).toStrictEqual(["Slash", "Bang", "Eof"]);
    });
  });
  describe("whitespace", () => {
    it("ignore spaces, carriage return, and tabs", () => {
      const source = "+ -\t!\r";
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      const tokenTypes = tokens.map(t => t.type);
      expect(tokenTypes).toStrictEqual(["Plus", "Minus", "Bang", "Eof"]);
    });
    it("tracks line number for each token", () => {
      const source = `+
-
(
)
{}`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      const tokenLines = tokens.map(t => t.line);
      expect(tokenLines).toStrictEqual([1, 2, 3, 4, 5, 5, 5]);
    });
  });
  describe("string tokens", () => {
    it("recognize a string token", () => {
      const source = `"lox"`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual(new Token("String", 1, `"lox"`, "lox"));
    });
    it("recognize multiple string tokens", () => {
      const source = `"lox" "string"`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(3);

      expect(tokens[0]).toEqual(new Token("String", 1, `"lox"`, "lox"));
      expect(tokens[1]).toEqual(new Token("String", 1, `"string"`, "string"));
    });
    it("recognize a multiline string token", () => {
      const source = `"lox\nand\nmore"`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual(
        new Token("String", 3, `"lox\nand\nmore"`, "lox\nand\nmore")
      );
    });
    it("report error for unterminated string", () => {
      const source = `"lox`;
      const scanner = new Scanner(source);

      const errorSpy = jest.spyOn(console, "error");
      scanner.scanTokens();
      expect(errorSpy).toHaveBeenCalledWith("[1] Error: Unterminated string.");

      expect(hadError()).toBe(true);
    });
  });
  describe("number tokens", () => {
    it("recognize a number token", () => {
      const source = `42`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual(
        new Token("Number", 1, `42`, 42)
      );
    });
    it("recognize several number tokens", () => {
      const source = `42 33`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(3);

      const numbers = [42, 33];
      for (let i = 0; i < numbers.length; i++) {
        expect(tokens[i]).toEqual(
          new Token("Number", 1, numbers[i].toString(), numbers[i])
        );
      }
    });
    it("recognize a floating point number token", () => {
      const source = `42.50`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual(new Token("Number", 1, `42.50`, 42.5));
    });
  });
  describe("identifier tokens", () => {
    it("recognize an identifier", () => {
      const source = `variable`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual(
        new Token("Identifier", 1, `variable`)
      );
    });
    it("recognize a keyword", () => {
      const source = `class`;
      const scanner = new Scanner(source);
      const tokens = scanner.scanTokens();

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual(
        new Token("Class", 1, `class`)
      );
    });
  });
});
