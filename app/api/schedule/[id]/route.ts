import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const scheduledWorkout = await prisma.scheduledWorkout.findUnique({
      where: { id },
    });

    if (!scheduledWorkout) {
      return NextResponse.json(
        { error: "Scheduled workout not found" },
        { status: 404 }
      );
    }

    if (scheduledWorkout.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.scheduledWorkout.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Scheduled workout deleted" });
  } catch (error) {
    console.error("Error deleting scheduled workout:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { completed } = body;

    const scheduledWorkout = await prisma.scheduledWorkout.findUnique({
      where: { id },
      include: {
        workoutType: true,
        customWorkout: true,
      },
    });

    if (!scheduledWorkout) {
      return NextResponse.json(
        { error: "Scheduled workout not found" },
        { status: 404 }
      );
    }

    if (scheduledWorkout.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If marking as complete, create a workout entry
    if (completed && !scheduledWorkout.completed) {
      let workout = null;

      if (scheduledWorkout.workoutType) {
        workout = await prisma.workout.create({
          data: {
            exercise: scheduledWorkout.workoutType.name,
            duration: scheduledWorkout.workoutType.defaultDuration || 30,
            calories: scheduledWorkout.workoutType.defaultCalories || 200,
            notes:
              scheduledWorkout.notes ||
              `Completed scheduled workout: ${scheduledWorkout.workoutType.name}`,
            date: scheduledWorkout.scheduledDate,
            userId: session.user.id,
          },
        });
      } else if (scheduledWorkout.customWorkout) {
        workout = await prisma.workout.create({
          data: {
            exercise: scheduledWorkout.customWorkout.name,
            duration: 30,
            calories: 200,
            notes:
              scheduledWorkout.notes ||
              `Completed custom workout: ${scheduledWorkout.customWorkout.name}`,
            date: scheduledWorkout.scheduledDate,
            userId: session.user.id,
          },
        });
      }

      await prisma.scheduledWorkout.update({
        where: { id },
        data: {
          completed: true,
          workoutId: workout?.id || null,
        },
      });
    } else if (!completed && scheduledWorkout.completed) {
      // If marking as incomplete, delete the workout entry
      if (scheduledWorkout.workoutId) {
        await prisma.workout.delete({
          where: { id: scheduledWorkout.workoutId },
        });
      }

      await prisma.scheduledWorkout.update({
        where: { id },
        data: {
          completed: false,
          workoutId: null,
        },
      });
    }

    const updatedWorkout = await prisma.scheduledWorkout.findUnique({
      where: { id },
      include: {
        workoutType: true,
        customWorkout: true,
        workout: true,
      },
    });

    return NextResponse.json(updatedWorkout);
  } catch (error) {
    console.error("Error updating scheduled workout:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
