export type GenzaiCatalogEntry = {
  slug: string;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string;
  poolName: string;
  flavor: string;
  meccanica: string;
  tier?: number | null;
  tags?: string[];
  cs?: number;
  tempoQuarti?: number | null;
  skiruIr?: string[];
  effetti: unknown[];
  implementazioneNote?: string[];
};
