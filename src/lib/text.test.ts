import { describe, it, expect } from "vitest";
import { countWordsFromHtml, countWordsFromText } from "./text";

describe("countWordsFromHtml", () => {
  it("returns 0 for empty content", () => {
    expect(countWordsFromHtml("")).toBe(0);
    expect(countWordsFromHtml("<p></p>")).toBe(0);
  });

  it("strips tags before counting", () => {
    expect(countWordsFromHtml("<p>Hello <strong>world</strong></p>")).toBe(2);
  });

  it("counts words across multiple paragraphs", () => {
    expect(countWordsFromHtml("<p>One two</p><p>three four five</p>")).toBe(5);
  });
});

describe("countWordsFromText", () => {
  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWordsFromText("")).toBe(0);
    expect(countWordsFromText("   ")).toBe(0);
  });

  it("counts words separated by varying whitespace", () => {
    expect(countWordsFromText("one   two\nthree")).toBe(3);
  });
});