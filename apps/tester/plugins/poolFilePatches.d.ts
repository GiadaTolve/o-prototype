/**
 * Patch testuali sui file pool / wazaPool (condiviso tra plugin Vite e script apply-tester-contributions).
 */
export declare const POOL_APPEND: Record<'waza' | 'madosho' | 'patti' | 'skiru', {
    rel: string;
    decl: string;
}>;
export declare function findClosingBraceIndex(src: string, openIdx: number): number;
export declare function findClosingBracketIndex(src: string, openIdx: number): number;
export declare function replacePoolObjectById(fileContent: string, decl: string, replaceId: string, newEntryRaw: string): string;
/** Rimuove l’oggetto `{ id: '…' … }` dall’array pool. */
export declare function removePoolObjectById(fileContent: string, decl: string, removeId: string): string;
export declare function extractIdFromPoolEntry(entry: string): string | null;
export declare function appendWazaAccessorioEntry(fileContent: string, kind: 'status' | 'counter' | 'condizione', id: string, label: string, note: string): string;
/** Rimuove id da array accessori + etichette (stesso file `appendWazaAccessorioEntry`). */
export declare function removeWazaAccessorioFromPool(fileContent: string, kind: 'status' | 'counter' | 'condizione', id: string): string;
export declare function appendToPoolArray(fileContent: string, decl: string, entry: string): string;
