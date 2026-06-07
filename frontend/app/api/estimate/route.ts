import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Use environment variable or default to local backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mamir1983-buildcost.hf.space";

    const res = await fetch(`${API_URL}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Unknown error" }));
      
      // Handle the structured validation error from our FastAPI backend
      const errorMessage = typeof errData.detail === 'object' 
        ? (errData.detail.message || "Validation failed") 
        : (errData.detail || "Backend error");
      
      const details = errData.detail?.details || [];

      return NextResponse.json(
        { 
          error: errorMessage,
          details: details
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Backend connect nahi ho raha — uvicorn api:app chalayein port 8000 par" },
      { status: 503 }
    );
  }
}
