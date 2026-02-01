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
    
    // Try to fetch by ObjectId first, then by string id
    let property;
    try {
      property = await collection.findOne({ _id: new ObjectId(id) });
    } catch {
      property = await collection.findOne({ id });
    }

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Convert MongoDB _id to string
    const data = {
      ...property,
      _id: property._id.toString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Property fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property." },
      { status: 500 }
    );
  }
}
