/**
 * PROTOTIPO — scrive/legge city-overlay.json (+ blocchi nominati) per la mappa dashboard.
 * Rollback: DELETE, o elimina public/maps/city-overlay.json, o spegni toggle «Città».
 */
import { existsSync, mkdirSync, unlinkSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function mapsDir() {
  return path.join(process.cwd(), "public", "maps");
}

function overlayPath() {
  return path.join(mapsDir(), "city-overlay.json");
}

function blockPath(id: string) {
  const safe = id.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "block";
  return path.join(mapsDir(), "city-blocks", `${safe}.json`);
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const file = overlayPath();
  const paradise = blockPath("paradise");
  const target = existsSync(file) ? file : existsSync(paradise) ? paradise : null;
  if (!target) {
    return NextResponse.json({ ok: false, missing: true }, { status: 404, headers: CORS });
  }
  try {
    const data = JSON.parse(readFileSync(target, "utf8"));
    return NextResponse.json(data, {
      headers: { ...CORS, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500, headers: CORS },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      payload?: unknown;
      clear?: boolean;
      saveAs?: string;
    };
    const file = overlayPath();
    if (body.clear) {
      if (existsSync(file)) unlinkSync(file);
      return NextResponse.json({ ok: true, cleared: true }, { headers: CORS });
    }
    if (!body.payload || typeof body.payload !== "object") {
      return NextResponse.json(
        { ok: false, error: "payload required" },
        { status: 400, headers: CORS },
      );
    }
    mkdirSync(path.dirname(file), { recursive: true });
    const json = JSON.stringify(body.payload, null, 2);
    writeFileSync(file, json, "utf8");
    const paths = ["public/maps/city-overlay.json"];
    if (body.saveAs) {
      const named = blockPath(body.saveAs);
      mkdirSync(path.dirname(named), { recursive: true });
      writeFileSync(named, json, "utf8");
      paths.push(`public/maps/city-blocks/${path.basename(named)}`);
    }
    return NextResponse.json({ ok: true, path: paths.join(" + ") }, { headers: CORS });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500, headers: CORS },
    );
  }
}

export async function DELETE() {
  const file = overlayPath();
  if (existsSync(file)) unlinkSync(file);
  return NextResponse.json({ ok: true, cleared: true }, { headers: CORS });
}
