import { NextResponse } from "next/server";
import type { MapProperty } from "@/lib/map-types";
import { getPropertiesCollection } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zipCode') || searchParams.toString();

    if (!zipCode) {
      return NextResponse.json(
        { error: "ZIP code is required" },
        { status: 400 }
      );
    }

    const collection = await getPropertiesCollection();
    const properties = await collection.find({ zipCode }).toArray();

    // Convert MongoDB _id to string
    const data = properties.map((prop: any) => ({
      ...prop,
      _id: prop._id.toString(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Properties fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties." },
      { status: 500 }
    );
  }
}
