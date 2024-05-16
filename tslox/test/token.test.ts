import { Token } from "../src/token";

describe("token", () => {
  it("converts to string", () => {
    const token = new Token("LeftBrace", 1, "{");
    const tokenStr = '' + token;
    expect(tokenStr).toBe("LeftBrace { undefined");
  });
  it("should have line number", () => {
    const token = new Token("LeftBrace", 10, "{");
    expect(token.line).toBe(10);

    const tokenStr = '' + token;
    expect(tokenStr).toBe("LeftBrace { undefined");
  });
  it("should have mandatory lexeme", () => {
    const token = new Token("String", 10, "lexeme");
    expect(token.lexeme).toBe("lexeme");
  });
  it("should have optional literal", () => {
    const token = new Token("String", 10, `"some string"`, "some string");
    expect(token.lexeme).toBe(`"some string"`);
    expect(token.literal).toBe("some string");
  });
});
