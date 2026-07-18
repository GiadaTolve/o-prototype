"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { encodeDropPanelRequest, type DropPanelPayload } from "@domain/economy/drop-panel-message";
import type { ItemCategory } from "@domain/economy/types";
import { api } from "@/lib/api";
import { formatItemCategory } from "@/components/dashboard/inventory/labels";

type RoomPlayer = {
  id: string;
  name: string;
};

type CatalogItemRow = {
  catalogKey: string;
  name: string;
  nameRomaji?: string | null;
  description?: string | null;
  effectText?: string | null;
  category?: ItemCategory | string;
  integrityMax?: number | null;
  damage?: number | null;
  resistance?: number | null;
};

type DropTableRow = {
  id: string;
  label: string;
  entries: Array<{ pool: string; weight: number }>;
};

type DropMode = "direct" | "table";
type DropTarget = "ground" | "player" | "group";

/**
 * Finestra Master — cede loot in chat (payload [DROP], nessun comando testuale).
 */
export function CediDropWindow({
  usersInRoom,
}: {
  usersInRoom: RoomPlayer[];
}) {
  const [panelData, setPanelData] = useState<{
    items: CatalogItemRow[];
    tables: DropTableRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<DropMode>("direct");
  const [target, setTarget] = useState<DropTarget>("ground");
  const [targetCharacterId, setTargetCharacterId] = useState("");
  const [search, setSearch] = useState("");
  const [catalogKey, setCatalogKey] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [tableId, setTableId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .get("/drop/panel-data")
      .then((res) => {
        const data = res as {
          items?: CatalogItemRow[];
          tables?: DropTableRow[];
        };
        setPanelData({
          items: data.items ?? [],
          tables: data.tables ?? [],
        });
        if (!tableId && data.tables?.[0]?.id) {
          setTableId(data.tables[0].id);
        }
      })
      .catch((e) => {
        setPanelData(null);
        setLoadError(e instanceof Error ? e.message : "Impossibile caricare il catalogo.");
      })
      .finally(() => setLoading(false));
  }, [tableId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredItems = useMemo(() => {
    const all = panelData?.items ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (j) =>
            j.name.toLowerCase().includes(q) ||
            j.catalogKey.toLowerCase().includes(q) ||
            (j.description ?? "").toLowerCase().includes(q),
        )
      : all;
    return filtered.slice(0, 24);
  }, [panelData?.items, search]);

  const selectedItem = panelData?.items.find((j) => j.catalogKey === catalogKey);

  useEffect(() => {
    if (mode === "table" && target === "ground") {
      setTarget("group");
    }
  }, [mode, target]);

  const needsPlayer = target === "player";

  const submit = () => {
    if (busy || !panelData) return;
    setError(null);

    let payload: DropPanelPayload | null = null;

    if (mode === "table") {
      if (target === "ground") {
        setError("Le tabelle non si applicano a terra.");
        return;
      }
      if (target === "player" && !targetCharacterId) {
        setError("Seleziona un destinatario.");
        return;
      }
      if (!tableId) {
        setError("Seleziona una tabella loot.");
        return;
      }
      payload = {
        kind: "table",
        target: target === "group" ? "group" : "player",
        targetCharacterId: target === "player" ? targetCharacterId : undefined,
        tableId,
      };
    } else {
      if (!catalogKey) {
        setError("Seleziona un oggetto.");
        return;
      }
      if (target === "player" && !targetCharacterId) {
        setError("Seleziona un destinatario.");
        return;
      }
      payload = {
        kind: "direct",
        target,
        targetCharacterId: target === "player" ? targetCharacterId : undefined,
        catalogKey,
        quantity: Math.max(1, Math.floor(quantity)),
      };
    }

    setBusy(true);
    window.dispatchEvent(new CustomEvent("oyasumi:chatSend", { detail: encodeDropPanelRequest(payload) }));
    window.setTimeout(() => {
      setBusy(false);
      window.dispatchEvent(new Event("chatDropUpdated"));
    }, 700);
  };

  if (loading && !panelData) {
    return (
      <div className="cedi-drop-window">
        <p className="cedi-drop-window__empty">Caricamento catalogo…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="cedi-drop-window">
        <p className="cedi-drop-window__error">{loadError}</p>
        <button type="button" className="cedi-drop-window__submit" onClick={reload}>
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="cedi-drop-window">
      <div className="cedi-drop-window__tabs" role="tablist" aria-label="Tipo drop">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "direct"}
          className={`cedi-drop-window__tab${mode === "direct" ? " cedi-drop-window__tab--active" : ""}`}
          onClick={() => setMode("direct")}
        >
          Oggetto
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "table"}
          className={`cedi-drop-window__tab${mode === "table" ? " cedi-drop-window__tab--active" : ""}`}
          onClick={() => setMode("table")}
        >
          Tabella
        </button>
      </div>

      <fieldset className="cedi-drop-window__field">
        <legend className="cedi-drop-window__legend">Destinazione</legend>
        <div className="cedi-drop-window__targets">
          <button
            type="button"
            className={`cedi-drop-window__target${target === "ground" ? " cedi-drop-window__target--active" : ""}`}
            onClick={() => setTarget("ground")}
            disabled={mode === "table"}
          >
            A terra
          </button>
          <button
            type="button"
            className={`cedi-drop-window__target${target === "player" ? " cedi-drop-window__target--active" : ""}`}
            onClick={() => setTarget("player")}
          >
            PG
          </button>
          <button
            type="button"
            className={`cedi-drop-window__target${target === "group" ? " cedi-drop-window__target--active" : ""}`}
            onClick={() => setTarget("group")}
          >
            Gruppo
          </button>
        </div>
      </fieldset>

      {needsPlayer && (
        <label className="cedi-drop-window__field">
          <span className="cedi-drop-window__legend">Destinatario</span>
          <select
            className="cedi-drop-window__select"
            value={targetCharacterId}
            onChange={(e) => setTargetCharacterId(e.target.value)}
          >
            <option value="">— Scegli —</option>
            {usersInRoom.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {mode === "direct" ? (
        <>
          <label className="cedi-drop-window__field">
            <span className="cedi-drop-window__legend">Cerca oggetto</span>
            <input
              type="search"
              className="cedi-drop-window__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome o catalog key…"
            />
          </label>

          <ul className="cedi-drop-window__item-list">
            {filteredItems.map((j) => (
              <li key={j.catalogKey}>
                <button
                  type="button"
                  className={`cedi-drop-window__item${catalogKey === j.catalogKey ? " cedi-drop-window__item--active" : ""}`}
                  onClick={() => setCatalogKey(j.catalogKey)}
                >
                  <span className="cedi-drop-window__item-name">{j.name}</span>
                  <span className="cedi-drop-window__item-meta">
                    {formatItemCategory(j.category)} · {j.catalogKey}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selectedItem && (
            <div className="cedi-drop-window__preview">
              <p className="cedi-drop-window__preview-name">{selectedItem.name}</p>
              {(selectedItem.effectText || selectedItem.description) && (
                <p className="cedi-drop-window__preview-desc">
                  {selectedItem.effectText ?? selectedItem.description}
                </p>
              )}
            </div>
          )}

          <label className="cedi-drop-window__field">
            <span className="cedi-drop-window__legend">Quantità</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              className="cedi-drop-window__input cedi-drop-window__input--qty"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        </>
      ) : (
        <label className="cedi-drop-window__field">
          <span className="cedi-drop-window__legend">Tabella loot</span>
          <select
            className="cedi-drop-window__select"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
          >
            {(panelData?.tables ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {tableId && (
            <ul className="cedi-drop-window__table-entries">
              {(panelData?.tables.find((t) => t.id === tableId)?.entries ?? []).map((e, i) => (
                <li key={`${e.pool}-${i}`}>
                  {e.pool} · peso {e.weight}
                </li>
              ))}
            </ul>
          )}
        </label>
      )}

      {error && <p className="cedi-drop-window__error">{error}</p>}

      <button
        type="button"
        className="cedi-drop-window__submit"
        disabled={busy}
        onClick={submit}
      >
        {busy ? "…" : target === "ground" ? "Lascia in scena" : "Cedi drop"}
      </button>
    </div>
  );
}
