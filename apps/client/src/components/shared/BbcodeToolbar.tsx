"use client";

type BbcodeToolbarProps = {
  onInsert: (openTag: string, closeTag: string) => void;
  /** Wiki: accent, banner, img a sinistra. Forum: set base. */
  variant?: "forum" | "wiki";
  className?: string;
};

const btnClass =
  "bg-transparent border border-[var(--border-color)] text-gray-400 cursor-pointer px-2 py-1.5 text-[10px] font-bold rounded min-w-[28px] min-h-[28px] text-center font-mono transition-colors hover:border-[var(--accent-violet)] hover:text-[var(--accent-violet-light)]";

export function BbcodeToolbar({ onInsert, variant = "forum", className = "" }: BbcodeToolbarProps) {
  return (
    <div className={`flex flex-wrap gap-1 p-2 bg-black/25 border border-[var(--border-color)] rounded-t ${className}`}>
      <button type="button" className={btnClass} onClick={() => onInsert("[b]", "[/b]")} title="Grassetto">
        <b>B</b>
      </button>
      <button type="button" className={btnClass} onClick={() => onInsert("[i]", "[/i]")} title="Corsivo">
        <i>I</i>
      </button>
      <button type="button" className={btnClass} onClick={() => onInsert("[u]", "[/u]")} title="Sottolineato">
        <u>U</u>
      </button>
      <button type="button" className={btnClass} onClick={() => onInsert("[quote]", "[/quote]")} title="Citazione">
        &quot;&quot;
      </button>
      <button type="button" className={btnClass} onClick={() => onInsert("[code]", "[/code]")} title="Codice">
        &lt;/&gt;
      </button>
      <button type="button" className={btnClass} onClick={() => onInsert("[img]", "[/img]")} title="Immagine">
        IMG
      </button>
      <button type="button" className={btnClass} onClick={() => onInsert("[url=LINK]", "[/url]")} title="Link">
        LINK
      </button>
      {variant === "wiki" && (
        <>
          <button
            type="button"
            className={`${btnClass} text-[var(--accent-gold)] border-[var(--accent-gold)]/30`}
            onClick={() => onInsert("[accent]", "[/accent]")}
            title="Accent di sistema (EB Garamond + barra)"
          >
            ACC
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() => onInsert("[img=left]", "[/img]")}
            title="Immagine piccola a sinistra del testo"
          >
            IMG◧
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() => onInsert("\n\n[banner]", "[/banner]\n\n")}
            title="Banner a tutta larghezza nel testo"
          >
            BNR
          </button>
        </>
      )}
    </div>
  );
}
