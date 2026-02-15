/**
 * BBCode Parser per il Forum
 * Supporta: [b], [i], [u], [s], [quote], [code], [spoiler], [img], [url], [color], [center]
 */

export function parseBBCode(text: string): string {
  let html = text;

  // Escape HTML per sicurezza
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // [code] ... [/code] - preserva tutto il contenuto
  html = html.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<pre class="bbcode-code"><code>$1</code></pre>');

  // [quote=author] ... [/quote] o [quote] ... [/quote]
  html = html.replace(/\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="bbcode-quote"><div class="bbcode-quote-author">$1 ha scritto:</div><div>$2</div></blockquote>');
  html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="bbcode-quote">$1</blockquote>');

  // [spoiler] ... [/spoiler]
  html = html.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<details class="bbcode-spoiler"><summary>Spoiler</summary><div>$1</div></details>');

  // [img]url[/img]
  html = html.replace(/\[img\]([^\]]+)\[\/img\]/gi, '<img src="$1" alt="Immagine" class="bbcode-img" />');

  // [url=link]text[/url] o [url]link[/url]
  html = html.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="bbcode-link">$2</a>');
  html = html.replace(/\[url\]([^\]]+)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="bbcode-link">$1</a>');

  // [color=#hex] ... [/color] o [color=name] ... [/color]
  html = html.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color: $1;" class="bbcode-color">$2</span>');

  // [center] ... [/center]
  html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="bbcode-center">$1</div>');

  // [b] ... [/b]
  html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong class="bbcode-bold">$1</strong>');

  // [i] ... [/i]
  html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em class="bbcode-italic">$1</em>');

  // [u] ... [/u]
  html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u class="bbcode-underline">$1</u>');

  // [s] ... [/s]
  html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s class="bbcode-strikethrough">$1</s>');

  // Converti newlines in <br>
  html = html.replace(/\n/g, "<br />");

  return html;
}
