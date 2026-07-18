"use client";

import type { DropEventCardData } from "@domain/economy/drop-event-message";
import { parseDropEventMessage } from "@domain/economy/drop-event-message";

export function extractDropEventData(content: string): DropEventCardData | null {
  return parseDropEventMessage(content);
}

export function ChatDropEventCard({ data }: { data: DropEventCardData }) {
  return (
    <article className="chat-drop-event-post" aria-label={`Loot · ${data.headline}`}>
      <div className="chat-drop-event-post__bar" aria-hidden />
      <div className="chat-drop-event-post__body">
        <p className="chat-drop-event-post__kicker">Loot</p>
        <p className="chat-drop-event-post__headline">{data.headline}</p>
        {data.detail && <p className="chat-drop-event-post__detail">{data.detail}</p>}
      </div>
    </article>
  );
}
