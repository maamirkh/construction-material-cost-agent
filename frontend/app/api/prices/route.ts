import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://localhost:8000/api/prices || https://mamir1983-buildcost.hf.space/api/prices";

export async function GET() {
  try {
    const res = await fetch(BACKEND);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Backend not reachable" }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(BACKEND, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Backend not reachable" }, { status: 502 });
  }
}
