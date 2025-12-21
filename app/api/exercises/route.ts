import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const equipment = searchParams.get("equipment");
    const search = searchParams.get("search");

    const where: any = {};

    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (equipment) where.equipment = equipment;
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
