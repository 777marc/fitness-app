"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Plus,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { toast } from "react-toastify";

interface WorkoutType {
  id: string;
  name: string;
}

interface CustomWorkout {
  id: string;
  name: string;
}

interface ScheduledWorkout {
  id: string;
  scheduledDate: string;
  completed: boolean;
  notes: string | null;
  workoutType?: WorkoutType | null;
  customWorkout?: CustomWorkout | null;
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<
    ScheduledWorkout[]
  >([]);
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [formData, setFormData] = useState({
    workoutTypeId: "",
    customWorkoutId: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, weekOffset]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = startOfWeek(addWeeks(new Date(), weekOffset), {
        weekStartsOn: 1,
      });
      const endDate = addDays(startDate, 6);

      const [scheduledResponse, typesResponse, customResponse] =
        await Promise.all([
          fetch(
            `/api/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          ),
          fetch("/api/workout-types"),
          fetch("/api/custom-workouts"),
        ]);

      if (scheduledResponse.ok)
        setScheduledWorkouts(await scheduledResponse.json());
      if (typesResponse.ok) setWorkoutTypes(await typesResponse.json());
      if (customResponse.ok) setCustomWorkouts(await customResponse.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.workoutTypeId && !formData.customWorkoutId) {
      toast.error("Please select either a workout type or custom workout");
      return;
    }

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduledDate: selectedDate,
          workoutTypeId: formData.workoutTypeId || null,
          customWorkoutId: formData.customWorkoutId || null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        fetchData();
        setShowForm(false);
        setFormData({ workoutTypeId: "", customWorkoutId: "", notes: "" });
      }
    } catch (error) {
      console.error("Error scheduling workout:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled workout?"))
      return;

    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting scheduled workout:", error);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating workout status:", error);
    }
  };

  const getWorkoutsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return scheduledWorkouts.filter(
      (w) => format(new Date(w.scheduledDate), "yyyy-MM-dd") === dateStr
    );
  };

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 1,
  });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = format(new Date(), "yyyy-MM-dd");

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Weekly Schedule</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="btn-secondary flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <button onClick={() => setWeekOffset(0)} className="btn-secondary">
              This Week
            </button>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="btn-secondary flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Schedule Workout</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date: {format(new Date(selectedDate), "MMMM dd, yyyy")}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Workout Type
                </label>
                <select
                  className="select"
                  value={formData.workoutTypeId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workoutTypeId: e.target.value,
                      customWorkoutId: e.target.value
                        ? ""
                        : formData.customWorkoutId,
                    })
                  }
                >
                  <option value="">-- Select Workout Type --</option>
                  {workoutTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Or Custom Workout
                </label>
                <select
                  className="select"
                  value={formData.customWorkoutId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customWorkoutId: e.target.value,
                      workoutTypeId: e.target.value
                        ? ""
                        : formData.workoutTypeId,
                    })
                  }
                >
                  <option value="">-- Select Custom Workout --</option>
                  {customWorkouts.map((workout) => (
                    <option key={workout.id} value={workout.id}>
                      {workout.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  Schedule Workout
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayWorkouts = getWorkoutsForDate(day);
            const isToday = format(day, "yyyy-MM-dd") === today;

            return (
              <div
                key={day.toISOString()}
                className={`card p-4 ${isToday ? "ring-2 ring-blue-500" : ""}`}
              >
                <div className="mb-3">
                  <h3 className="font-semibold text-lg">
                    {format(day, "EEE")}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {format(day, "MMM dd")}
                  </p>
                </div>

                <div className="space-y-2 mb-3">
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className={`p-2 rounded ${
                        workout.completed ? "bg-green-900/30" : "bg-gray-700"
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {workout.workoutType?.name ||
                          workout.customWorkout?.name}
                      </p>
                      {workout.notes && (
                        <p className="text-xs text-gray-400 mt-1">
                          {workout.notes}
                        </p>
                      )}
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() =>
                            toggleComplete(workout.id, workout.completed)
                          }
                          className={`text-xs px-2 py-1 rounded ${
                            workout.completed
                              ? "bg-yellow-600 hover:bg-yellow-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                          title={
                            workout.completed
                              ? "Mark incomplete"
                              : "Mark complete"
                          }
                        >
                          {workout.completed ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(workout.id)}
                          className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setSelectedDate(format(day, "yyyy-MM-dd"));
                    setShowForm(true);
                  }}
                  className="w-full btn-primary text-sm py-1 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
