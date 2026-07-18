"use client";

import type { ItemUseCardData } from "@domain/economy/item-use-chat";
import { extractItemUseCard as extractItemUseCardFromDomain } from "@domain/economy/item-use-chat";
import { formatItemCategory } from "@/components/dashboard/inventory/labels";

export type { ItemUseCardData };

export function extractItemUseCard(content: string): ItemUseCardData | null {
  return extractItemUseCardFromDomain(content);
}

function integrityLabel(before?: number | null, after?: number | null): string | null {
  if (before == null || after == null) return null;
  return `INT ${before}→${after}`;
}

export function ChatItemUseCard({
  data,
  characterName,
}: {
  data: ItemUseCardData;
  characterName: string;
}) {
  const intLine = integrityLabel(data.integrityBefore, data.integrityAfter);
  const categoryLabel = formatItemCategory(data.category);

  return (
    <article
      className="chat-item-use-post"
      aria-label={`Uso oggetto ${data.itemName} · ${characterName}`}
    >
      <div className="chat-item-use-post__bar" aria-hidden />

      <div className="chat-item-use-post__body">
        <div className="chat-item-use-post__head">
          <span className="chat-item-use-post__actor">{characterName}</span>
          <span className="chat-item-use-post__sep" aria-hidden>
            ·
          </span>
          <span className="chat-item-use-post__verb">usa</span>
        </div>

        <p className="chat-item-use-post__name">{data.itemName}</p>

        <div className="chat-item-use-post__labels">
          <span className="chat-item-use-post__label">{categoryLabel}</span>
          {intLine && (
            <span className="chat-item-use-post__label chat-item-use-post__label--gold">{intLine}</span>
          )}
          {data.consumableRemaining != null && (
            <span className="chat-item-use-post__label chat-item-use-post__label--violet">
              ×{data.consumableRemaining} rimasti
            </span>
          )}
          {data.ammoLabel && (
            <span className="chat-item-use-post__label chat-item-use-post__label--violet">{data.ammoLabel}</span>
          )}
          {data.isBroken && (
            <span className="chat-item-use-post__label chat-item-use-post__label--broken">Rotto</span>
          )}
        </div>

        {data.effectText?.trim() && (
          <p className="chat-item-use-post__effect">{data.effectText.trim()}</p>
        )}
      </div>
    </article>
  );
}
