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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      userId: session.user.id,
    };

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const scheduledWorkouts = await prisma.scheduledWorkout.findMany({
      where,
      include: {
        workoutType: true,
        customWorkout: true,
        workout: true,
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return NextResponse.json(scheduledWorkouts);
  } catch (error) {
    console.error("Error fetching scheduled workouts:", error);
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
    const { scheduledDate, workoutTypeId, customWorkoutId, notes } = body;

    if (!scheduledDate || (!workoutTypeId && !customWorkoutId)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const scheduledWorkout = await prisma.scheduledWorkout.create({
      data: {
        scheduledDate: new Date(scheduledDate),
        workoutTypeId: workoutTypeId || null,
        customWorkoutId: customWorkoutId || null,
        notes: notes || null,
        userId: session.user.id,
      },
      include: {
        workoutType: true,
        customWorkout: true,
      },
    });

    return NextResponse.json(scheduledWorkout, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled workout:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
