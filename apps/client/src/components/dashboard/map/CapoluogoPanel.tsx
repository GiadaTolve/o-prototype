"use client";

import { useEffect, useRef } from "react";
import "./capoluogo-panel.css";

export type CapoluogoChat = {
  id: string;
  name: string;
  nameJa?: string;
  description?: string;
};

export type CapoluogoData = {
  id: string;
  mapName: string;
  mapNameJa?: string;
  image: string;
  description: string;
  chats: CapoluogoChat[];
};

export type CapoluogoPanelProps = {
  data: CapoluogoData;
  onClose: () => void;
  onChatEnter?: (chatId: string) => void;
};

export function CapoluogoPanel({
  data,
  onClose,
  onChatEnter,
}: CapoluogoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Chiudi cliccando fuori
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={panelRef} className="capoluogo-panel">
      {/* Header */}
      <div className="cp__header">
        <div className="cp__title">
          {data.mapName}
          {data.mapNameJa && <span className="cp__title-ja">{data.mapNameJa}</span>}
        </div>
        <button className="cp__close" onClick={onClose} aria-label="Chiudi">×</button>
      </div>

      {/* Banner immagine */}
      <div className="cp__banner">
        <img src={data.image} alt={data.mapName} className="cp__banner-img" />
        <div className="cp__banner-overlay" />
      </div>

      {/* Descrizione */}
      <p className="cp__description">{data.description}</p>

      {/* Lista chat */}
      <div className="cp__chats-label">CHAT</div>
      <ul className="cp__chats">
        {data.chats.map((chat) => (
          <li key={chat.id}>
            <button
              className="cp__chat-item"
              onClick={() => onChatEnter?.(chat.id)}
            >
              <span className="cp__chat-name">{chat.name}</span>
              {chat.nameJa && <span className="cp__chat-ja">{chat.nameJa}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
