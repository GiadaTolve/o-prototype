/**
 * Dev-only: scrive file sotto apps/tester/src/ (allowlist).
 * Abilita “Salva su disco” dagli strumenti authoring del tester.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import fs from 'node:fs';
import path from 'node:path';
import { POOL_APPEND, appendToPoolArray, appendWazaAccessorioEntry, extractIdFromPoolEntry, removePoolObjectById, removeWazaAccessorioFromPool, replacePoolObjectById, } from './poolFilePatches';
var ALLOW_REL = new Set([
    'src/wazaBranches.ts',
    'src/wazaTaxonomy.ts',
    'src/madoshoTaxonomy.ts',
    'src/pattiTaxonomy.ts',
    'src/skiruCategories.ts',
    'src/skiruPool.ts',
    'src/wazaPool.ts',
    'src/madoshoPool.ts',
    'src/pattiPool.ts',
]);
function handleAppendWazaAccessorio(testerRootAbs, raw, res) {
    try {
        var parsed = JSON.parse(raw);
        var kind = parsed.kind;
        if (kind !== 'status' && kind !== 'counter' && kind !== 'condizione') {
            res.statusCode = 400;
            res.end('Invalid body: kind must be status | counter | condizione');
            return;
        }
        var id = typeof parsed.id === 'string' ? parsed.id.trim() : '';
        var label = typeof parsed.label === 'string' ? parsed.label.trim() : '';
        var note = typeof parsed.note === 'string' ? parsed.note : '';
        if (!id || !label) {
            res.statusCode = 400;
            res.end('Invalid body: id e label richiesti');
            return;
        }
        if (!/^[a-z][a-z0-9_-]*$/.test(id)) {
            res.statusCode = 400;
            res.end('id deve essere slug: lettera minuscola, poi a-z, 0-9, _ o -');
            return;
        }
        var rel = 'src/wazaPool.ts';
        var absTarget = path.resolve(testerRootAbs, rel);
        var srcRoot = path.resolve(testerRootAbs, 'src');
        if (!absTarget.startsWith(srcRoot + path.sep)) {
            res.statusCode = 403;
            res.end('Path outside src/');
            return;
        }
        var fileContent = fs.readFileSync(absTarget, 'utf8');
        fileContent = appendWazaAccessorioEntry(fileContent, kind, id, label, note);
        fs.writeFileSync(absTarget, fileContent, 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, path: rel, kind: kind, id: id }));
    }
    catch (e) {
        var msg = e instanceof Error ? e.message : String(e);
        res.statusCode = msg.includes('già presente') ? 409 : 500;
        res.end(msg);
    }
}
function handleAppendPoolEntry(testerRootAbs, raw, res) {
    try {
        var parsed = JSON.parse(raw);
        var pool = parsed.pool;
        var entry = parsed.entry;
        if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
            res.statusCode = 400;
            res.end('Invalid body: pool must be waza | madosho | patti | skiru');
            return;
        }
        if (typeof entry !== 'string' || !entry.trim()) {
            res.statusCode = 400;
            res.end('Invalid body: entry (snippet da incollare nel pool) richiesto');
            return;
        }
        var cfg = POOL_APPEND[pool];
        var absTarget = path.resolve(testerRootAbs, cfg.rel);
        var srcRoot = path.resolve(testerRootAbs, 'src');
        if (!absTarget.startsWith(srcRoot + path.sep)) {
            res.statusCode = 403;
            res.end('Path outside src/');
            return;
        }
        var id = extractIdFromPoolEntry(entry);
        if (!id) {
            res.statusCode = 400;
            res.end('Impossibile ricavare id: … dalla voce. Verifica che ci sia id: \'…\'.');
            return;
        }
        var idRe = new RegExp("id:\\s*['\"]".concat(id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "['\"]"));
        var fileContent = fs.readFileSync(absTarget, 'utf8');
        if (idRe.test(fileContent)) {
            res.statusCode = 409;
            res.end("Voce con id \u00AB".concat(id, "\u00BB gi\u00E0 presente in ").concat(cfg.rel, ". Rimuovila a mano o cambia id."));
            return;
        }
        fileContent = appendToPoolArray(fileContent, cfg.decl, entry);
        fs.writeFileSync(absTarget, fileContent, 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, path: cfg.rel, id: id }));
    }
    catch (e) {
        res.statusCode = 500;
        res.end(e instanceof Error ? e.message : String(e));
    }
}
function handleReplacePoolEntry(testerRootAbs, raw, res) {
    try {
        var parsed = JSON.parse(raw);
        var pool = parsed.pool;
        var entry = parsed.entry;
        var replaceId = typeof parsed.replaceId === 'string' ? parsed.replaceId.trim() : '';
        if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
            res.statusCode = 400;
            res.end('Invalid body: pool must be waza | madosho | patti | skiru');
            return;
        }
        if (typeof entry !== 'string' || !entry.trim()) {
            res.statusCode = 400;
            res.end('Invalid body: entry richiesto');
            return;
        }
        if (!replaceId) {
            res.statusCode = 400;
            res.end('Invalid body: replaceId richiesto');
            return;
        }
        var cfg = POOL_APPEND[pool];
        var absTarget = path.resolve(testerRootAbs, cfg.rel);
        var srcRoot = path.resolve(testerRootAbs, 'src');
        if (!absTarget.startsWith(srcRoot + path.sep)) {
            res.statusCode = 403;
            res.end('Path outside src/');
            return;
        }
        var newId = extractIdFromPoolEntry(entry);
        if (!newId) {
            res.statusCode = 400;
            res.end('Impossibile ricavare id dalla nuova voce.');
            return;
        }
        var fileContent = fs.readFileSync(absTarget, 'utf8');
        var idRe = new RegExp("id:\\s*['\"]".concat(replaceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "['\"]"));
        if (!idRe.test(fileContent)) {
            res.statusCode = 404;
            res.end("Nessuna voce con id \u00AB".concat(replaceId, "\u00BB in ").concat(cfg.rel, "."));
            return;
        }
        fileContent = replacePoolObjectById(fileContent, cfg.decl, replaceId, entry);
        fs.writeFileSync(absTarget, fileContent, 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, path: cfg.rel, replaceId: replaceId, id: newId }));
    }
    catch (e) {
        res.statusCode = 500;
        res.end(e instanceof Error ? e.message : String(e));
    }
}
function handleDeletePoolEntry(testerRootAbs, raw, res) {
    try {
        var parsed = JSON.parse(raw);
        var pool = parsed.pool;
        var removeId = typeof parsed.removeId === 'string' ? parsed.removeId.trim() : '';
        if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
            res.statusCode = 400;
            res.end('Invalid body: pool must be waza | madosho | patti | skiru');
            return;
        }
        if (!removeId) {
            res.statusCode = 400;
            res.end('Invalid body: removeId richiesto');
            return;
        }
        var cfg = POOL_APPEND[pool];
        var absTarget = path.resolve(testerRootAbs, cfg.rel);
        var srcRoot = path.resolve(testerRootAbs, 'src');
        if (!absTarget.startsWith(srcRoot + path.sep)) {
            res.statusCode = 403;
            res.end('Path outside src/');
            return;
        }
        var fileContent = fs.readFileSync(absTarget, 'utf8');
        fileContent = removePoolObjectById(fileContent, cfg.decl, removeId);
        fs.writeFileSync(absTarget, fileContent, 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, path: cfg.rel, removeId: removeId }));
    }
    catch (e) {
        var msg = e instanceof Error ? e.message : String(e);
        res.statusCode = msg.includes('non trovat') ? 404 : 500;
        res.end(msg);
    }
}
function handleDeleteWazaAccessorio(testerRootAbs, raw, res) {
    try {
        var parsed = JSON.parse(raw);
        var kind = parsed.kind;
        if (kind !== 'status' && kind !== 'counter' && kind !== 'condizione') {
            res.statusCode = 400;
            res.end('Invalid body: kind must be status | counter | condizione');
            return;
        }
        var id = typeof parsed.id === 'string' ? parsed.id.trim() : '';
        if (!id) {
            res.statusCode = 400;
            res.end('Invalid body: id richiesto');
            return;
        }
        var rel = 'src/wazaPool.ts';
        var absTarget = path.resolve(testerRootAbs, rel);
        var srcRoot = path.resolve(testerRootAbs, 'src');
        if (!absTarget.startsWith(srcRoot + path.sep)) {
            res.statusCode = 403;
            res.end('Path outside src/');
            return;
        }
        var fileContent = fs.readFileSync(absTarget, 'utf8');
        fileContent = removeWazaAccessorioFromPool(fileContent, kind, id);
        fs.writeFileSync(absTarget, fileContent, 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, path: rel, kind: kind, id: id }));
    }
    catch (e) {
        var msg = e instanceof Error ? e.message : String(e);
        res.statusCode = msg.includes('non trovat') ? 404 : 500;
        res.end(msg);
    }
}
function normalizeRel(p) {
    return p.replace(/^\//, '').replace(/\\/g, '/').split('/').filter(function (s) { return s !== '..' && s !== '.'; }).join('/');
}
export function oyasumiWriteFilePlugin(testerRootAbs) {
    return {
        name: 'oyasumi-write-file',
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var raw_1, raw_2, raw_3, raw_4, raw_5, raw;
                return __generator(this, function (_a) {
                    if (req.url === '/__oyasumi/append-pool-entry' && req.method === 'POST') {
                        raw_1 = '';
                        req.on('data', function (c) {
                            raw_1 += c;
                        });
                        req.on('end', function () {
                            handleAppendPoolEntry(testerRootAbs, raw_1, res);
                        });
                        return [2 /*return*/];
                    }
                    if (req.url === '/__oyasumi/replace-pool-entry' && req.method === 'POST') {
                        raw_2 = '';
                        req.on('data', function (c) {
                            raw_2 += c;
                        });
                        req.on('end', function () {
                            handleReplacePoolEntry(testerRootAbs, raw_2, res);
                        });
                        return [2 /*return*/];
                    }
                    if (req.url === '/__oyasumi/append-waza-accessorio' && req.method === 'POST') {
                        raw_3 = '';
                        req.on('data', function (c) {
                            raw_3 += c;
                        });
                        req.on('end', function () {
                            handleAppendWazaAccessorio(testerRootAbs, raw_3, res);
                        });
                        return [2 /*return*/];
                    }
                    if (req.url === '/__oyasumi/delete-pool-entry' && req.method === 'POST') {
                        raw_4 = '';
                        req.on('data', function (c) {
                            raw_4 += c;
                        });
                        req.on('end', function () {
                            handleDeletePoolEntry(testerRootAbs, raw_4, res);
                        });
                        return [2 /*return*/];
                    }
                    if (req.url === '/__oyasumi/delete-waza-accessorio' && req.method === 'POST') {
                        raw_5 = '';
                        req.on('data', function (c) {
                            raw_5 += c;
                        });
                        req.on('end', function () {
                            handleDeleteWazaAccessorio(testerRootAbs, raw_5, res);
                        });
                        return [2 /*return*/];
                    }
                    if (req.url === '/__oyasumi/city-overlay' && req.method === 'POST') {
                        raw = '';
                        req.on('data', function (c) {
                            raw += c;
                        });
                        req.on('end', function () {
                            try {
                                var parsed = JSON.parse(raw);
                                var absTarget = path.resolve(testerRootAbs, '../client/public/maps/city-overlay.json');
                                var clientPublic = path.resolve(testerRootAbs, '../client/public');
                                if (!absTarget.startsWith(clientPublic + path.sep)) {
                                    res.statusCode = 403;
                                    res.end('Path outside client/public');
                                    return;
                                }
                                if (parsed.clear) {
                                    if (fs.existsSync(absTarget))
                                        fs.unlinkSync(absTarget);
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify({ ok: true, cleared: true }));
                                    return;
                                }
                                if (!parsed.payload || typeof parsed.payload !== 'object') {
                                    res.statusCode = 400;
                                    res.end('Invalid body: payload required (or clear:true)');
                                    return;
                                }
                                fs.mkdirSync(path.dirname(absTarget), { recursive: true });
                                fs.writeFileSync(absTarget, JSON.stringify(parsed.payload, null, 2), 'utf8');
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    ok: true,
                                    path: 'apps/client/public/maps/city-overlay.json',
                                }));
                            }
                            catch (e) {
                                res.statusCode = 500;
                                res.end(e instanceof Error ? e.message : String(e));
                            }
                        });
                        return [2 /*return*/];
                    }
                    if (req.url !== '/__oyasumi/write-file' || req.method !== 'POST') {
                        next();
                        return [2 /*return*/];
                    }
                    raw = '';
                    req.on('data', function (c) {
                        raw += c;
                    });
                    req.on('end', function () {
                        try {
                            var parsed = JSON.parse(raw);
                            var rel = typeof parsed.path === 'string' ? normalizeRel(parsed.path) : '';
                            var content = parsed.content;
                            if (!rel || typeof content !== 'string') {
                                res.statusCode = 400;
                                res.end('Invalid body: path and content required');
                                return;
                            }
                            if (!ALLOW_REL.has(rel)) {
                                res.statusCode = 403;
                                res.end("Path not allowed: ".concat(rel));
                                return;
                            }
                            var absTarget = path.resolve(testerRootAbs, rel);
                            var srcRoot = path.resolve(testerRootAbs, 'src');
                            if (!absTarget.startsWith(srcRoot + path.sep) && absTarget !== srcRoot) {
                                res.statusCode = 403;
                                res.end('Path outside src/');
                                return;
                            }
                            fs.mkdirSync(path.dirname(absTarget), { recursive: true });
                            fs.writeFileSync(absTarget, content, 'utf8');
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, path: rel }));
                        }
                        catch (e) {
                            res.statusCode = 500;
                            res.end(e instanceof Error ? e.message : String(e));
                        }
                    });
                    return [2 /*return*/];
                });
            }); });
        },
    };
}
