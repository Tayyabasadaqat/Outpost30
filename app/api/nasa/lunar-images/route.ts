
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const url = new URL(
      "https://images-api.nasa.gov/search"
    );

    url.searchParams.set("q", "Apollo lunar surface");
    url.searchParams.set("media_type", "image");
    url.searchParams.set("page_size", "12");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();

      throw new Error(
        `NASA Images API HTTP ${response.status}: ${details.slice(0, 200)}`
      );
    }

    const result = await response.json();

    const images = (result.collection?.items ?? [])
      .map((item: {
        data?: Array<{
          nasa_id?: string;
          title?: string;
          description?: string;
        }>;
        links?: Array<{
          href?: string;
          render?: string;
        }>;
      }) => ({
        nasaId: item.data?.[0]?.nasa_id,
        title: item.data?.[0]?.title,
        description: item.data?.[0]?.description,
        imageUrl:
          item.links?.find(
            (link) => link.render === "image"
          )?.href ?? null,
      }))
      .filter(
        (item: { imageUrl: string | null }) =>
          item.imageUrl !== null
      );

    return NextResponse.json({
      success: true,
      source: "NASA Image and Video Library",
      totalImages: images.length,
      images,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "NASA request failed",
      },
      { status: 502 }
    );
  }
}