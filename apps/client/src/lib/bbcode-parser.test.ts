import { describe, expect, it } from "vitest";
import { parseWikiContent } from "./bbcode-parser";

describe("parseWikiContent", () => {
  it("@parola → enfasi oro inline", () => {
    const html = parseWikiContent("Usa @Chrono Stack per muoverti.");
    expect(html).toContain('<span class="wiki-marker">Chrono</span>');
  });

  it("[accent] → accent di sistema (Garamond + barra)", () => {
    const html = parseWikiContent("Testo [accent]citazione[/accent] e [b]grassetto[/b].");
    expect(html).toContain('<span class="wiki-accent">citazione</span>');
    expect(html).toContain('<strong class="bbcode-bold">grassetto</strong>');
  });

  it("blocco solo [accent] → aside wiki-accent", () => {
    const html = parseWikiContent("[accent]Un passaggio\na parte.[/accent]");
    expect(html).toContain('<aside class="wiki-accent">');
    expect(html).toContain("Un passaggio<br />a parte.");
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
    expect(html).toContain("wiki-accent");
  });
});
