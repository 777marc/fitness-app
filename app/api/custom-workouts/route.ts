import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customWorkouts = await prisma.customWorkout.findMany({
      where: {
        userId: session.user.id,
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customWorkouts);
  } catch (error) {
    console.error("Error fetching custom workouts:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, exercises } = body;

    if (!name || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const customWorkout = await prisma.customWorkout.create({
      data: {
        name,
        description: description || null,
        userId: session.user.id,
        exercises: {
          create: exercises.map((ex: any, index: number) => ({
            exerciseId: ex.id,
            sets: ex.sets || null,
            reps: ex.reps || null,
            duration: ex.duration || null,
            order: index,
            notes: ex.notes || null,
          })),
        },
      },
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

    return NextResponse.json(customWorkout, { status: 201 });
  } catch (error) {
    console.error("Error creating custom workout:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
