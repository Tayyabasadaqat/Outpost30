
import { NextResponse } from "next/server";
import { getSpaceWeather } from "@/lib/nasa";

export async function GET() {
  try {
    // Fetch observations from NASA DONKI
    const nasaData = await getSpaceWeather();

    if (!nasaData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "NASA data is currently unavailable.",
          error: nasaData.error,
          events: [],
        },
        { status: 503 }
      );
    }

    // Send NASA observations to the frontend
    return NextResponse.json({
      success: true,
      message: "NASA DONKI data retrieved successfully",
      source: nasaData.source,
      from: nasaData.from,
      to: nasaData.to,
      totalEvents: nasaData.events.length,
      events: nasaData.events,
    });
  } catch (error) {
    console.error("NASA API Route Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve space weather data",
        events: [],
      },
      { status: 500 }
    );
  }
}