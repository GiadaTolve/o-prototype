"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import { parseWikiContent } from "@/lib/bbcode-parser";
import { insertBbcodeTag } from "@/lib/bbcode-insert";
import { BbcodeToolbar } from "@/components/shared/BbcodeToolbar";

export type WikiKind = "guida" | "ambientazione";

type WikiSection = {
  id: string;
  kind: WikiKind;
  parentId: string | null;
  level: 1 | 2;
  title: string;
  content: string;
  imageUrl: string | null;
  order: number;
};

type WikiSectionNode = WikiSection & {
  children: WikiSection[];
};

type WikiPageProps = {
  kind: WikiKind;
};

type EditTarget = {
  id?: string;
  level: 1 | 2;
  parentId?: string | null;
  title: string;
  content: string;
  imageUrl: string;
};

function WikiRichContent({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="text-gray-500 italic">Nessun contenuto ancora.</p>;
  }

  const html = parseWikiContent(text);
  return (
    <div
      className="wiki-prose flow-root text-gray-300 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function WikiPage({ kind }: WikiPageProps) {
  const [sections, setSections] = useState<WikiSectionNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const pickDefaultActiveId = useCallback((tree: WikiSectionNode[]) => {
    const firstChild = tree[0]?.children?.[0];
    const first = firstChild ?? tree[0];
    return first?.id ?? null;
  }, []);

  const load = useCallback(
    async (options?: { showLoading?: boolean; resetActive?: boolean }) => {
      const showLoading = options?.showLoading ?? false;
      const resetActive = options?.resetActive ?? false;

      if (showLoading) setLoading(true);
      setError("");

      try {
        const [treeData, editData] = await Promise.all([
          api.get(`/wiki/${kind}`) as Promise<{ sections: WikiSectionNode[] }>,
          api.get(`/wiki/${kind}/can-edit`) as Promise<{ canEdit: boolean }>,
        ]);

        if (!mountedRef.current) return;

        const tree = treeData.sections ?? [];
        setSections(tree);
        setCanEdit(Boolean(editData.canEdit));

        if (resetActive) {
          setActiveId(pickDefaultActiveId(tree));
        } else {
          setActiveId((current) => {
            if (current) {
              const stillExists =
                tree.some((h1) => h1.id === current) ||
                tree.some((h1) => h1.children.some((c) => c.id === current));
              if (stillExists) return current;
            }
            return pickDefaultActiveId(tree);
          });
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : "Errore sconosciuto";
        if (msg.includes("does not exist") || msg.includes("Failed query")) {
          setError("Le tabelle wiki non sono state create. Esegui: bun run add-wiki-tables");
        } else {
          setError(msg);
        }
      } finally {
        if (mountedRef.current && showLoading) setLoading(false);
      }
    },
    [kind, pickDefaultActiveId],
  );

  useEffect(() => {
    void load({ showLoading: true });
  }, [load]);

  const activeSection = useMemo(() => {
    for (const h1 of sections) {
      if (h1.id === activeId) return h1;
      const child = h1.children.find((c) => c.id === activeId);
      if (child) return child;
    }
    return null;
  }, [sections, activeId]);

  const activeParent = useMemo(() => {
    if (!activeSection || activeSection.level === 1) return null;
    return sections.find((s) => s.children.some((c) => c.id === activeSection.id)) ?? null;
  }, [sections, activeSection]);

  const openCreate = (level: 1 | 2, parentId?: string | null) => {
    setEditTarget({
      level,
      parentId: parentId ?? null,
      title: "",
      content: "",
      imageUrl: "",
    });
  };

  const openEdit = (section: WikiSection) => {
    setEditTarget({
      id: section.id,
      level: section.level,
      parentId: section.parentId,
      title: section.title,
      content: section.content,
      imageUrl: section.imageUrl ?? "",
    });
  };

  const handleSave = async () => {
    if (!editTarget || !editTarget.title.trim()) return;
    setSaving(true);
    try {
      if (editTarget.id) {
        await api.patch(`/wiki/${kind}/sections/${editTarget.id}`, {
          title: editTarget.title,
          content: editTarget.content,
          imageUrl: editTarget.imageUrl || null,
        });
      } else {
        const created = (await api.post(`/wiki/${kind}/sections`, {
          level: editTarget.level,
          parentId: editTarget.parentId ?? null,
          title: editTarget.title,
          content: editTarget.content,
          imageUrl: editTarget.imageUrl || null,
        })) as WikiSection;
        if (mountedRef.current) setActiveId(created.id);
      }
      if (!mountedRef.current) return;
      setEditTarget(null);
      await load();
    } catch (err) {
      if (!mountedRef.current) return;
      alert(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editTarget?.id) return;
    if (!confirm("Eliminare questa sezione? L'operazione non è reversibile.")) return;
    setSaving(true);
    try {
      await api.delete(`/wiki/${kind}/sections/${editTarget.id}`);
      if (!mountedRef.current) return;
      setEditTarget(null);
      await load({ resetActive: true });
    } catch (err) {
      if (!mountedRef.current) return;
      alert(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const insertContentTag = (openTag: string, closeTag: string) => {
    if (!editTarget) return;
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const next = insertBbcodeTag(textarea, editTarget.content, openTag, closeTag);
    setEditTarget({ ...editTarget, content: next });
  };

  if (loading) {
    return (
      <div className="wiki-layout h-full w-full flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wiki-layout h-full w-full flex items-center justify-center p-8">
        <p className="text-red-400 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="wiki-layout h-full w-full flex flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="wiki-sidebar shrink-0 w-56 lg:w-64 h-full border-r border-[var(--border-color)] bg-[rgba(11,11,17,0.85)] flex flex-col min-h-0">
        <nav className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {sections.length === 0 && (
            <p className="text-xs text-gray-500 px-2 py-3">Nessuna sezione ancora.</p>
          )}
          {sections.map((h1) => (
            <div key={h1.id} className="mb-2">
              <div className="flex items-center group">
                <button
                  type="button"
                  onClick={() => setActiveId(h1.id)}
                  className={`flex-1 text-left px-2 py-1.5 rounded text-sm font-display tracking-wide transition-colors ${
                    activeId === h1.id
                      ? "text-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                      : "text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)] hover:bg-white/5"
                  }`}
                >
                  {h1.title}
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openEdit(h1)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-[var(--accent-gold)] transition-opacity"
                    title="Modifica sezione"
                  >
                    <FontAwesomeIcon icon={icons.pencil} className="w-3 h-3" />
                  </button>
                )}
              </div>
              {h1.children.map((h2) => (
                <div key={h2.id} className="flex items-center group ml-3">
                  <button
                    type="button"
                    onClick={() => setActiveId(h2.id)}
                    className={`flex-1 text-left px-2 py-1 text-xs transition-colors rounded ${
                      activeId === h2.id
                        ? "text-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                        : "text-gray-400 hover:text-[var(--accent-violet-light)] hover:bg-white/5"
                    }`}
                  >
                    {h2.title}
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openEdit(h2)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-[var(--accent-gold)] transition-opacity"
                      title="Modifica sottosezione"
                    >
                      <FontAwesomeIcon icon={icons.pencil} className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openCreate(2, h1.id)}
                  className="ml-3 mt-0.5 px-2 py-0.5 text-[10px] text-gray-600 hover:text-[var(--accent-violet-light)] transition-colors"
                >
                  + sottosezione
                </button>
              )}
            </div>
          ))}
        </nav>
        {canEdit && (
          <div className="shrink-0 p-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => openCreate(1)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 border border-dashed border-[var(--border-color)] rounded hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
            >
              <FontAwesomeIcon icon={icons.pencil} className="w-3 h-3" />
              Nuova sezione
            </button>
          </div>
        )}
      </aside>

      {/* Content */}
      <main className="wiki-content flex-1 min-w-0 min-h-0 h-full overflow-y-auto p-6 md:p-10">
        {activeSection ? (
          <article className="max-w-3xl mx-auto animate__animated animate__fadeIn">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                {activeParent && (
                  <p className="text-xs uppercase tracking-widest text-[var(--accent-violet-light)] mb-1">
                    {activeParent.title}
                  </p>
                )}
                <h2 className="font-display text-2xl text-[var(--accent-gold)]">
                  {activeSection.title}
                </h2>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openEdit(activeSection)}
                  className="shrink-0 p-2 text-gray-500 hover:text-[var(--accent-gold)] border border-[var(--border-color)] rounded transition-colors"
                  title="Modifica contenuto"
                >
                  <FontAwesomeIcon icon={icons.pencil} className="w-3.5 h-3.5" />
                </button>
              )}
            </header>

            {activeSection.imageUrl && (
              <figure className="mb-6 rounded-lg overflow-hidden border border-[var(--border-color)] shadow-[0_4px_20px_var(--shadow-dark)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSection.imageUrl}
                  alt={activeSection.title}
                  className="bbcode-banner w-full max-h-80 object-cover"
                />
              </figure>
            )}

            <WikiRichContent text={activeSection.content} />
          </article>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <FontAwesomeIcon icon={icons.file} className="w-8 h-8 mb-3 opacity-40" />
            <p>Seleziona una voce dal menu a sinistra.</p>
            {canEdit && sections.length === 0 && (
              <button
                type="button"
                onClick={() => openCreate(1)}
                className="mt-4 text-sm text-[var(--accent-gold)] hover:underline"
              >
                Crea la prima sezione
              </button>
            )}
          </div>
        )}
      </main>

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="w-full max-w-2xl bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg shadow-[0_8px_40px_var(--shadow-dark)] animate__animated animate__fadeIn max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
              <h3 className="font-display text-sm text-[var(--accent-gold)]">
                {editTarget.id ? "Modifica" : "Nuova"}{" "}
                {editTarget.level === 1 ? "sezione" : "sottosezione"}
              </h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                <FontAwesomeIcon icon={icons.times} className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Titolo</span>
                <input
                  type="text"
                  value={editTarget.title}
                  onChange={(e) => setEditTarget({ ...editTarget, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-[var(--button-bg)] border border-[var(--border-color)] rounded text-sm text-gray-200 focus:border-[var(--accent-gold)] outline-none"
                  placeholder={editTarget.level === 1 ? "Nome sezione (H1)" : "Nome sottosezione (H2)"}
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Contenuto</span>
                <BbcodeToolbar variant="wiki" onInsert={insertContentTag} />
                <textarea
                  ref={contentTextareaRef}
                  value={editTarget.content}
                  onChange={(e) => setEditTarget({ ...editTarget, content: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 bg-[var(--button-bg)] border border-[var(--border-color)] border-t-0 rounded-b text-sm text-gray-200 focus:border-[var(--accent-gold)] outline-none resize-y font-mono leading-relaxed"
                  placeholder="Paragrafo vuoto = nuovo blocco. Elenchi: • o - all'inizio riga. [accent]…[/accent] = accent di sistema. @parola = enfasi oro inline."
                />
                <p className="mt-1.5 text-[10px] text-gray-500 leading-relaxed">
                  <code className="text-[var(--accent-violet-light)]">[accent]testo[/accent]</code> = accent di sistema (Garamond
                  + barra viola). <span className="text-[var(--accent-gold)]">@parola</span> = enfasi oro inline. Banner:{" "}
                  <code className="text-[var(--accent-violet-light)]">[banner]url[/banner]</code>. Miniatura a sinistra:{" "}
                  <code className="text-[var(--accent-violet-light)]">[img=left]url[/img]</code>.
                </p>
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Banner sezione (URL, opzionale)
                </span>
                <input
                  type="url"
                  value={editTarget.imageUrl}
                  onChange={(e) => setEditTarget({ ...editTarget, imageUrl: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-[var(--button-bg)] border border-[var(--border-color)] rounded text-sm text-gray-200 focus:border-[var(--accent-gold)] outline-none"
                  placeholder="https://… — immagine in testa alla sezione"
                />
              </label>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border-color)]">
              {editTarget.id ? (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={saving}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Elimina
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !editTarget.title.trim()}
                  className="px-4 py-2 text-xs font-display bg-[var(--button-bg)] border border-[var(--accent-gold)] text-[var(--accent-gold)] rounded hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Salva"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
