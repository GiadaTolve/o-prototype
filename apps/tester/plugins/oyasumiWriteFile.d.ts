/**
 * Dev-only: scrive file sotto apps/tester/src/ (allowlist).
 * Abilita “Salva su disco” dagli strumenti authoring del tester.
 */
import type { Plugin } from 'vite';
export declare function oyasumiWriteFilePlugin(testerRootAbs: string): Plugin;
