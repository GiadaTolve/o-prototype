import { describe, expect, it } from "vitest";
import { parseWikiContent } from "./bbcode-parser";

describe("parseWikiContent", () => {
  it("accent @parola stile landing", () => {
    const html = parseWikiContent("Usa @Chrono Stack per muoverti.");
    expect(html).toContain('<span class="bbcode-accent">Chrono</span>');
  });

  it("[accent] e BBCode base", () => {
    const html = parseWikiContent("Testo [accent]oro[/accent] e [b]grassetto[/b].");
    expect(html).toContain('<span class="bbcode-accent">oro</span>');
    expect(html).toContain('<strong class="bbcode-bold">grassetto</strong>');
  });

  it("banner e img a sinistra", () => {
    const html = parseWikiContent("[banner]https://x/b.jpg[/banner]\n\nParagrafo.");
    expect(html).toContain('class="bbcode-banner"');
    const withFloat = parseWikiContent("[img=left]https://x/s.jpg[/img] testo");
    expect(withFloat).toContain('class="bbcode-img bbcode-img--left"');
  });

  it("elenchi con BBCode inline", () => {
    const html = parseWikiContent("• Voce [accent]uno[/accent]\n• Voce due");
    expect(html).toContain("<ul");
    expect(html).toContain("bbcode-accent");
  });
});
