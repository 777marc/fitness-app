import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customWorkout = await prisma.customWorkout.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!customWorkout) {
      return NextResponse.json(
        { error: "Custom workout not found" },
        { status: 404 }
      );
    }

    if (customWorkout.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(customWorkout);
  } catch (error) {
    console.error("Error fetching custom workout:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customWorkout = await prisma.customWorkout.findUnique({
      where: { id },
    });

    if (!customWorkout) {
      return NextResponse.json(
        { error: "Custom workout not found" },
        { status: 404 }
      );
    }

    if (customWorkout.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.customWorkout.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Custom workout deleted" });
  } catch (error) {
    console.error("Error deleting custom workout:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
