"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Plus, Edit, Trash2, Calendar, Clock, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "react-toastify";
import Link from "next/link";

interface Workout {
  id: string;
  exercise: string;
  duration: number;
  calories: number;
  notes: string | null;
  date: string;
}

interface ScheduledWorkout {
  id: string;
  scheduledDate: string;
  completed: boolean;
  notes: string | null;
  workoutType?: { id: string; name: string } | null;
  customWorkout?: { id: string; name: string } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<
    ScheduledWorkout[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedScheduledWorkout, setSelectedScheduledWorkout] =
    useState<ScheduledWorkout | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    exercise: "",
    duration: "",
    calories: "",
    notes: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const today = new Date();
      const endDate = addDays(today, 7);

      const [workoutsResponse, scheduleResponse] = await Promise.all([
        fetch("/api/workouts"),
        fetch(
          `/api/schedule?startDate=${today.toISOString()}&endDate=${endDate.toISOString()}`
        ),
      ]);

      if (workoutsResponse.ok) {
        const data = await workoutsResponse.json();
        setWorkouts(data);
      }

      if (scheduleResponse.ok) {
        const data = await scheduleResponse.json();
        setScheduledWorkouts(
          data.filter((w: ScheduledWorkout) => !w.completed)
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkouts = fetchData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/workouts/${editingId}` : "/api/workouts";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingId
            ? "Workout updated successfully!"
            : "Workout added successfully!"
        );
        fetchWorkouts();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          exercise: "",
          duration: "",
          calories: "",
          notes: "",
          date: format(new Date(), "yyyy-MM-dd"),
        });
      } else {
        toast.error("Failed to save workout");
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout");
    }
  };

  const handleEdit = (workout: Workout) => {
    setEditingId(workout.id);
    setFormData({
      exercise: workout.exercise,
      duration: workout.duration.toString(),
      calories: workout.calories.toString(),
      notes: workout.notes || "",
      date: format(new Date(workout.date), "yyyy-MM-dd"),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workout?")) return;

    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Workout deleted successfully!");
        fetchWorkouts();
      } else {
        toast.error("Failed to delete workout");
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("Failed to delete workout");
    }
  };

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
          <h1 className="text-3xl font-bold">My Workouts</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                exercise: "",
                duration: "",
                calories: "",
                notes: "",
                date: format(new Date(), "yyyy-MM-dd"),
              });
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Workout
          </button>
        </div>

        {/* Upcoming Scheduled Workouts */}
        {scheduledWorkouts.length > 0 && (
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Upcoming Scheduled Workouts
              </h2>
              <Link
                href="/schedule"
                className="text-blue-500 hover:text-blue-400 text-sm"
              >
                View Schedule →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => {
                    console.log("Workout clicked:", workout);
                    setSelectedScheduledWorkout(workout);
                    setShowModal(true);
                    console.log("Modal should show now");
                  }}
                  className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {workout.workoutType?.name ||
                          workout.customWorkout?.name}
                      </p>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(workout.scheduledDate), "EEE, MMM dd")}
                      </p>
                    </div>
                  </div>
                  {workout.notes && (
                    <p className="text-xs text-gray-400 mt-2">
                      {workout.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Workout Detail Modal */}
        {showModal && selectedScheduledWorkout && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-gray-800 rounded-lg shadow-2xl border border-gray-600 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: "#1f2937" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedScheduledWorkout.workoutType?.name ||
                    selectedScheduledWorkout.customWorkout?.name}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Scheduled Date</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {format(
                      new Date(selectedScheduledWorkout.scheduledDate),
                      "EEEE, MMMM dd, yyyy"
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Type</p>
                  <p>
                    {selectedScheduledWorkout.workoutType
                      ? "Workout Type"
                      : "Custom Workout"}
                  </p>
                </div>

                {selectedScheduledWorkout.notes && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Notes</p>
                    <p className="text-sm">{selectedScheduledWorkout.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Link
                    href="/schedule"
                    className="btn-primary flex-1 text-center"
                  >
                    View in Schedule
                  </Link>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? "Edit Workout" : "Add New Workout"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Exercise Type
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.exercise}
                    onChange={(e) =>
                      setFormData({ ...formData, exercise: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.calories}
                    onChange={(e) =>
                      setFormData({ ...formData, calories: e.target.value })
                    }
                    required
                    min="1"
                  />
                </div>
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
                  {editingId ? "Update Workout" : "Save Workout"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card overflow-hidden">
          {workouts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No workouts logged yet. Start by adding your first workout!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Exercise
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Calories
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {workouts.map((workout) => (
                    <tr key={workout.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(workout.date), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {workout.exercise}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {workout.duration} min
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {workout.calories} cal
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {workout.notes
                          ? workout.notes.length > 50
                            ? `${workout.notes.substring(0, 50)}...`
                            : workout.notes
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(workout)}
                            className="text-blue-500 hover:text-blue-400"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(workout.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
