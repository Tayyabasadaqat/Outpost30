
import { NextResponse } from "next/server";
import { getSpaceWeather } from "@/lib/nasa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nasaData = await getSpaceWeather();

    if (!nasaData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "NASA data is currently unavailable.",
          source: nasaData.source,
          mode: nasaData.mode,
          error: nasaData.error,
          totalEvents: 0,
          events: [],
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "NASA DONKI data retrieved successfully",
      source: nasaData.source,
      mode: nasaData.mode,
      totalEvents: nasaData.events.length,
      events: nasaData.events,
    });
  } catch (error) {
    console.error("NASA API Route Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve space weather data",
        totalEvents: 0,
        events: [],
      },
      { status: 500 }
    );
  }
}