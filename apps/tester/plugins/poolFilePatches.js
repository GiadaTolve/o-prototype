/**
 * Patch testuali sui file pool / wazaPool (condiviso tra plugin Vite e script apply-tester-contributions).
 */
export var POOL_APPEND = {
    waza: { rel: 'src/wazaPool.ts', decl: 'export const WAZA_POOL: WazaDef[] = ' },
    madosho: { rel: 'src/madoshoPool.ts', decl: 'export const MADOSHO_POOL: MadoshoDef[] = ' },
    patti: { rel: 'src/pattiPool.ts', decl: 'export const PATTI_POOL: PattiDef[] = ' },
    skiru: { rel: 'src/skiruPool.ts', decl: 'export const SKIRU_POOL: SkiruDef[] = ' },
};
export function findClosingBraceIndex(src, openIdx) {
    var depth = 0;
    var inStr = false;
    var strQuote = '';
    var escaped = false;
    for (var i = openIdx; i < src.length; i++) {
        var c = src[i];
        if (inStr) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c === '\\') {
                escaped = true;
                continue;
            }
            if (c === strQuote)
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') {
            inStr = true;
            strQuote = c;
            continue;
        }
        if (c === '{')
            depth++;
        else if (c === '}') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return -1;
}
export function findClosingBracketIndex(src, openIdx) {
    var depth = 0;
    var inStr = false;
    var strQuote = '';
    var escaped = false;
    for (var i = openIdx; i < src.length; i++) {
        var c = src[i];
        if (inStr) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c === '\\') {
                escaped = true;
                continue;
            }
            if (c === strQuote)
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') {
            inStr = true;
            strQuote = c;
            continue;
        }
        if (c === '[')
            depth++;
        else if (c === ']') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return -1;
}
function splitPoolEntryRanges(inner) {
    var ranges = [];
    var i = 0;
    var n = inner.length;
    while (i < n) {
        while (i < n && /\s/.test(inner[i]))
            i++;
        if (i >= n)
            break;
        var segmentStart = i;
        while (inner.startsWith('//', i)) {
            while (i < n && inner[i] !== '\n')
                i++;
            if (i < n)
                i++;
            while (i < n && /\s/.test(inner[i]))
                i++;
        }
        if (i >= n || inner[i] !== '{') {
            i = segmentStart + 1;
            continue;
        }
        var braceEnd = findClosingBraceIndex(inner, i);
        if (braceEnd === -1)
            break;
        ranges.push({ start: segmentStart, end: braceEnd + 1 });
        i = braceEnd + 1;
        while (i < n && /\s/.test(inner[i]))
            i++;
        if (inner[i] === ',')
            i++;
    }
    return ranges;
}
export function replacePoolObjectById(fileContent, decl, replaceId, newEntryRaw) {
    var idx = fileContent.indexOf(decl);
    if (idx === -1)
        throw new Error('Dichiarazione array pool non trovata.');
    var brack = fileContent.indexOf('[', idx + decl.length);
    if (brack === -1)
        throw new Error('Apertura [ dell’array pool non trovata.');
    var close = findClosingBracketIndex(fileContent, brack);
    if (close === -1)
        throw new Error('Chiusura ] dell’array pool non trovata.');
    var inner = fileContent.slice(brack + 1, close);
    var ranges = splitPoolEntryRanges(inner);
    var idRe = new RegExp("id:\\s*['\"]".concat(replaceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "['\"]"));
    var replaced = false;
    var chunks = ranges.map(function (r) {
        var chunk = inner.slice(r.start, r.end);
        if (idRe.test(chunk)) {
            replaced = true;
            return newEntryRaw.trim().replace(/,\s*$/, '');
        }
        return chunk;
    });
    if (!replaced)
        throw new Error("Voce con id \u00AB".concat(replaceId, "\u00BB non trovata nell\u2019array."));
    var newInner = "\n".concat(chunks.join(',\n'), ",\n");
    return fileContent.slice(0, brack + 1) + newInner + fileContent.slice(close);
}
/** Rimuove l’oggetto `{ id: '…' … }` dall’array pool. */
export function removePoolObjectById(fileContent, decl, removeId) {
    var idx = fileContent.indexOf(decl);
    if (idx === -1)
        throw new Error('Dichiarazione array pool non trovata.');
    var brack = fileContent.indexOf('[', idx + decl.length);
    if (brack === -1)
        throw new Error('Apertura [ dell’array pool non trovata.');
    var close = findClosingBracketIndex(fileContent, brack);
    if (close === -1)
        throw new Error('Chiusura ] dell’array pool non trovata.');
    var inner = fileContent.slice(brack + 1, close);
    var ranges = splitPoolEntryRanges(inner);
    var idRe = new RegExp("id:\\s*['\"]".concat(removeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "['\"]"));
    var kept = [];
    var removed = false;
    for (var _i = 0, ranges_1 = ranges; _i < ranges_1.length; _i++) {
        var r = ranges_1[_i];
        var chunk = inner.slice(r.start, r.end);
        if (idRe.test(chunk)) {
            removed = true;
            continue;
        }
        kept.push(chunk);
    }
    if (!removed)
        throw new Error("Voce con id \u00AB".concat(removeId, "\u00BB non trovata nell\u2019array."));
    var newInner = kept.length === 0 ? '\n' : "\n".concat(kept.join(',\n'), ",\n");
    return fileContent.slice(0, brack + 1) + newInner + fileContent.slice(close);
}
export function extractIdFromPoolEntry(entry) {
    var m = entry.match(/id:\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
}
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function appendWazaAccessorioEntry(fileContent, kind, id, label, note) {
    var arrName = kind === 'status'
        ? 'WAZA_STATUS_APPLICABILI'
        : kind === 'counter'
            ? 'WAZA_COUNTER_APPLICABILI'
            : 'WAZA_CONDIZIONI_APPLICABILI';
    var labelsName = kind === 'status'
        ? 'WAZA_STATUS_APPLICABILI_LABELS'
        : kind === 'counter'
            ? 'WAZA_COUNTER_APPLICABILI_LABELS'
            : 'WAZA_CONDIZIONI_APPLICABILI_LABELS';
    var arrDecl = "export const ".concat(arrName, " = [");
    var aidx = fileContent.indexOf(arrDecl);
    if (aidx === -1) {
        throw new Error("Dichiarazione ".concat(arrName, " non trovata in wazaPool.ts."));
    }
    var abrack = fileContent.indexOf('[', aidx);
    var aclose = findClosingBracketIndex(fileContent, abrack);
    if (aclose === -1)
        throw new Error("Chiusura dell\u2019array ".concat(arrName, " non trovata."));
    var arrInner = fileContent.slice(abrack + 1, aclose);
    if (new RegExp("'".concat(escapeRegExp(id), "'\\s*,")).test(arrInner)) {
        throw new Error("Id \u00AB".concat(id, "\u00BB gi\u00E0 presente in ").concat(arrName, "."));
    }
    var ldecl = "export const ".concat(labelsName);
    var lidx0 = fileContent.indexOf(ldecl);
    if (lidx0 === -1)
        throw new Error("Dichiarazione ".concat(labelsName, " non trovata."));
    var lopen0 = fileContent.indexOf('{', lidx0);
    var lclose0 = findClosingBraceIndex(fileContent, lopen0);
    if (lclose0 === -1)
        throw new Error("Oggetto ".concat(labelsName, " non chiuso."));
    var labelsInner0 = fileContent.slice(lopen0 + 1, lclose0);
    if (new RegExp("^\\s*".concat(escapeRegExp(id), "\\s*:"), 'm').test(labelsInner0)) {
        throw new Error("Chiave \u00AB".concat(id, "\u00BB gi\u00E0 presente in ").concat(labelsName, "."));
    }
    var safeIdInStr = id.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    var newArrLine = "  '".concat(safeIdInStr, "',\n");
    var next = fileContent.slice(0, aclose) + newArrLine + fileContent.slice(aclose);
    var lidx = next.indexOf(ldecl);
    var lopen = next.indexOf('{', lidx);
    var lclose = findClosingBraceIndex(next, lopen);
    if (lclose === -1)
        throw new Error("Oggetto ".concat(labelsName, " non trovato dopo modifica array."));
    var noteComment = '';
    var nt = note.trim();
    if (nt) {
        var oneLine = nt.replace(/\s+/g, ' ').slice(0, 160).replace(/\*\//g, '');
        noteComment = " // ".concat(oneLine);
    }
    var labelKey = /^[a-z][a-z0-9_]*$/.test(id) ? id : "'".concat(id.replace(/'/g, "\\'"), "'");
    var labelLine = "  ".concat(labelKey, ": ").concat(JSON.stringify(label), ",").concat(noteComment, "\n");
    next = next.slice(0, lclose) + labelLine + next.slice(lclose);
    return next;
}
/** Rimuove id da array accessori + etichette (stesso file `appendWazaAccessorioEntry`). */
export function removeWazaAccessorioFromPool(fileContent, kind, id) {
    var arrName = kind === 'status'
        ? 'WAZA_STATUS_APPLICABILI'
        : kind === 'counter'
            ? 'WAZA_COUNTER_APPLICABILI'
            : 'WAZA_CONDIZIONI_APPLICABILI';
    var labelsName = kind === 'status'
        ? 'WAZA_STATUS_APPLICABILI_LABELS'
        : kind === 'counter'
            ? 'WAZA_COUNTER_APPLICABILI_LABELS'
            : 'WAZA_CONDIZIONI_APPLICABILI_LABELS';
    var arrDecl = "export const ".concat(arrName, " = [");
    var aidx = fileContent.indexOf(arrDecl);
    if (aidx === -1) {
        throw new Error("Dichiarazione ".concat(arrName, " non trovata in wazaPool.ts."));
    }
    var abrack = fileContent.indexOf('[', aidx);
    var aclose = findClosingBracketIndex(fileContent, abrack);
    if (aclose === -1)
        throw new Error("Chiusura dell\u2019array ".concat(arrName, " non trovata."));
    var arrInner = fileContent.slice(abrack + 1, aclose);
    var idTok = "'".concat(id.replace(/\\/g, '\\\\').replace(/'/g, "\\'"), "'");
    var arrLineRe = new RegExp("^\\s*".concat(idTok, "\\s*,\\s*\\n"), 'm');
    if (arrLineRe.test(arrInner)) {
        arrInner = arrInner.replace(arrLineRe, '');
    }
    else {
        var arrLineLast = new RegExp("^\\s*".concat(idTok, "\\s*\\n"), 'm');
        if (!arrLineLast.test(arrInner)) {
            throw new Error("Id \u00AB".concat(id, "\u00BB non trovato in ").concat(arrName, "."));
        }
        arrInner = arrInner.replace(arrLineLast, '');
    }
    var next = fileContent.slice(0, abrack + 1) + arrInner + fileContent.slice(aclose);
    var ldecl = "export const ".concat(labelsName);
    var lidx = next.indexOf(ldecl);
    if (lidx === -1)
        throw new Error("Dichiarazione ".concat(labelsName, " non trovata."));
    var lopen = next.indexOf('{', lidx);
    var lclose = findClosingBraceIndex(next, lopen);
    if (lclose === -1)
        throw new Error("Oggetto ".concat(labelsName, " non chiuso."));
    var labelsInner = next.slice(lopen + 1, lclose);
    var simpleKey = /^[a-z][a-z0-9_]*$/.test(id);
    var labelLineRe = simpleKey
        ? new RegExp("^\\s*".concat(escapeRegExp(id), "\\s*:[^\\n]*\\n"), 'm')
        : new RegExp("^\\s*".concat(idTok, "\\s*:[^\\n]*\\n"), 'm');
    if (!labelLineRe.test(labelsInner)) {
        throw new Error("Chiave \u00AB".concat(id, "\u00BB non trovata in ").concat(labelsName, "."));
    }
    var newLabelsInner = labelsInner.replace(labelLineRe, '');
    next = next.slice(0, lopen + 1) + newLabelsInner + next.slice(lclose);
    return next;
}
export function appendToPoolArray(fileContent, decl, entry) {
    var idx = fileContent.indexOf(decl);
    if (idx === -1) {
        throw new Error('Dichiarazione array pool non trovata nel file (decl mancante).');
    }
    var brack = fileContent.indexOf('[', idx + decl.length);
    if (brack === -1)
        throw new Error('Apertura [ dell’array pool non trovata.');
    var close = findClosingBracketIndex(fileContent, brack);
    if (close === -1)
        throw new Error('Chiusura ] dell’array pool non trovata.');
    var innerRaw = fileContent.slice(brack + 1, close);
    var trimmed = innerRaw.trim();
    var normalized = entry.trim();
    var withComma = normalized.endsWith(',') ? normalized : "".concat(normalized, ",");
    var newInner;
    if (trimmed === '') {
        newInner = "\n".concat(withComma, "\n");
    }
    else {
        var base = innerRaw.replace(/\s+$/, '');
        var sep = base.endsWith(',') ? '' : ',';
        newInner = "".concat(base).concat(sep, "\n").concat(withComma, "\n");
    }
    return fileContent.slice(0, brack + 1) + newInner + fileContent.slice(close);
}
