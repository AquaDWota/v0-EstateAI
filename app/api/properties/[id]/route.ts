import { NextResponse } from "next/server";
import type { MapProperty } from "@/lib/map-types";
import { getPropertiesCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    const collection = await getPropertiesCollection();
    const properties = await collection.find({'zipCode': id}).toArray();

    if (!properties) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Property fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property." },
      { status: 500 }
    );
  }
}
