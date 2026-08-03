/**
 * FantasyMenu — menu laterale Dark Fantasy (vision Kessen).
 * Salvato per riuso futuro; non montato di default sulla mappa.
 */
"use client";

import "./fantasymenu.css";

export type FantasyMenuItem = {
  id: string;
  label: string;
  labelJa: string;
};

export type FantasyMenuProps = {
  title?: string;
  titleJa?: string;
  subtitle?: string;
  items?: FantasyMenuItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

export const FANTASY_MENU_DEFAULT_ITEMS: FantasyMenuItem[] = [
  { id: "mappa", label: "MAPPA", labelJa: "地図" },
  { id: "regioni", label: "REGIONI", labelJa: "地区" },
  { id: "fazioni", label: "FAZIONI", labelJa: "勢力" },
  { id: "impostazioni", label: "IMPOSTAZIONI", labelJa: "設定" },
];

export function FantasyMenu({
  title = "KESSEN",
  titleJa = "決戦",
  subtitle = "NIPPON RETTŌ / 日本列島",
  items = FANTASY_MENU_DEFAULT_ITEMS,
  activeId = "mappa",
  onSelect,
  className,
}: FantasyMenuProps) {
  return (
    <aside className={`fantasymenu ${className ?? ""}`} aria-label={title}>
      <div className="fantasymenu__header">
        <div className="fantasymenu__title">
          {title} <span className="fantasymenu__jp">{titleJa}</span>
        </div>
        <div className="fantasymenu__subtitle">{subtitle}</div>
      </div>
      <ul className="fantasymenu__list">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`fantasymenu__item${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect?.(item.id)}
              >
                <span className="fantasymenu__item-jp">{item.labelJa}</span>
                <span className="fantasymenu__item-la">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
