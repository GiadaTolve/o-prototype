/**
 * BBCode Parser — Forum + Wiki (Guida/Ambientazione).
 * Forum: [b], [i], [u], [s], [quote], [code], [spoiler], [img], [url], [color], [center]
 * Wiki: + [accent], [banner], [img=left], marcatori @parola (stile landing)
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyBBCodeTags(html: string, options?: { wiki?: boolean }): string {
  let out = html;

  // [code] ... [/code] - preserva tutto il contenuto
  out = out.replace(
    /\[code\]([\s\S]*?)\[\/code\]/gi,
    '<pre class="bbcode-code"><code>$1</code></pre>',
  );

  // [quote=author] ... [/quote] o [quote] ... [/quote]
  out = out.replace(
    /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi,
    '<blockquote class="bbcode-quote"><div class="bbcode-quote-author">$1 ha scritto:</div><div>$2</div></blockquote>',
  );
  out = out.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="bbcode-quote">$1</blockquote>');

  // [spoiler] ... [/spoiler]
  out = out.replace(
    /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
    '<details class="bbcode-spoiler"><summary>Spoiler</summary><div>$1</div></details>',
  );

  if (options?.wiki) {
    // [banner]url[/banner] — immagine a tutta larghezza nel corpo
    out = out.replace(
      /\[banner\]([^\]]+)\[\/banner\]/gi,
      '<figure class="bbcode-banner-wrap"><img src="$1" alt="" class="bbcode-banner" loading="lazy" /></figure>',
    );

    // [img=left]url[/img] — miniatura flottante a sinistra
    out = out.replace(
      /\[img=left\]([^\]]+)\[\/img\]/gi,
      '<img src="$1" alt="" class="bbcode-img bbcode-img--left" loading="lazy" />',
    );

    // [accent] ... [/accent] — enfasi oro (stile landing @marker)
    out = out.replace(
      /\[accent\]([\s\S]*?)\[\/accent\]/gi,
      '<span class="bbcode-accent">$1</span>',
    );
  }

  // [img]url[/img]
  out = out.replace(/\[img\]([^\]]+)\[\/img\]/gi, '<img src="$1" alt="Immagine" class="bbcode-img" loading="lazy" />');

  // [url=link]text[/url] o [url]link[/url]
  out = out.replace(
    /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="bbcode-link">$2</a>',
  );
  out = out.replace(
    /\[url\]([^\]]+)\[\/url\]/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="bbcode-link">$1</a>',
  );

  // [color=#hex] ... [/color] o [color=name] ... [/color]
  out = out.replace(
    /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,
    '<span style="color: $1;" class="bbcode-color">$2</span>',
  );

  // [center] ... [/center]
  out = out.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="bbcode-center">$1</div>');

  // [b] ... [/b]
  out = out.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong class="bbcode-bold">$1</strong>');

  // [i] ... [/i]
  out = out.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em class="bbcode-italic">$1</em>');

  // [u] ... [/u]
  out = out.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u class="bbcode-underline">$1</u>');

  // [s] ... [/s]
  out = out.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s class="bbcode-strikethrough">$1</s>');

  return out;
}

/** Marcatori @parola → accent oro (come Yume-chan in landing). */
function applyWikiAccents(html: string): string {
  return html.replace(/@(\w+)/g, '<span class="bbcode-accent">$1</span>');
}

function parseWikiBlock(block: string): string {
  const trimmed = block.trim();
  if (!trimmed) return "";

  const lines = trimmed.split("\n");
  const isList =
    lines.length > 0 &&
    lines.every((line) => !line.trim() || line.startsWith("• ") || line.startsWith("- ")) &&
    lines.some((line) => line.startsWith("• ") || line.startsWith("- "));

  if (isList) {
    const items = lines
      .filter((line) => line.trim())
      .map((line) => {
        const content = line.replace(/^[•-]\s*/, "");
        let html = escapeHtml(content);
        html = applyBBCodeTags(html, { wiki: true });
        html = applyWikiAccents(html);
        return `<li>${html}</li>`;
      })
      .join("");
    return `<ul class="wiki-list list-disc list-inside space-y-1 my-3">${items}</ul>`;
  }

  let html = escapeHtml(trimmed);
  html = applyBBCodeTags(html, { wiki: true });
  html = applyWikiAccents(html);
  html = html.replace(/\n/g, "<br />");
  return `<p class="wiki-paragraph mb-4 last:mb-0">${html}</p>`;
}

/** Rendering Guida/Ambientazione: paragrafi, elenchi, BBCode e accent @parola. */
export function parseWikiContent(text: string): string {
  if (!text.trim()) return "";
  return text
    .split(/\n\n+/)
    .map(parseWikiBlock)
    .filter(Boolean)
    .join("");
}

export function parseBBCode(text: string): string {
  let html = escapeHtml(text);
  html = applyBBCodeTags(html);
  html = html.replace(/\n/g, "<br />");
  return html;
}
