"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Plus,
  Save,
  Trash2,
  Search,
  X,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";

interface Exercise {
  id: string;
  name: string;
  category: string;
  primaryMuscleGroups: string | null;
  equipment: string | null;
  difficulty: string | null;
}

interface CustomWorkout {
  id: string;
  name: string;
  description: string | null;
  exercises: {
    exercise: Exercise;
    sets: number | null;
    reps: number | null;
    duration: number | null;
    notes: string | null;
  }[];
}

interface SelectedExercise extends Exercise {
  sets?: number;
  reps?: number;
  duration?: number;
  notes?: string;
}

export default function DesignerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    SelectedExercise[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");

  const categories = [
    "Upper Body",
    "Lower Body",
    "Core",
    "Full Body",
    "Cardio",
    "Stretching",
    "Mobility",
    "Bodyweight",
  ];
  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [exercisesResponse, workoutsResponse] = await Promise.all([
        fetch("/api/exercises"),
        fetch("/api/custom-workouts"),
      ]);

      if (exercisesResponse.ok) setExercises(await exercisesResponse.json());
      if (workoutsResponse.ok) setCustomWorkouts(await workoutsResponse.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || ex.category === categoryFilter;
    const matchesDifficulty =
      !difficultyFilter || ex.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const addExercise = (exercise: Exercise) => {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      toast.warning("Exercise already added");
      return;
    }
    setSelectedExercises([
      ...selectedExercises,
      { ...exercise, sets: 3, reps: 10 },
    ]);
  };

  const removeExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== id));
  };

  const updateExercise = (id: string, field: string, value: any) => {
    setSelectedExercises(
      selectedExercises.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newExercises = [...selectedExercises];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newExercises.length) return;

    [newExercises[index], newExercises[targetIndex]] = [
      newExercises[targetIndex],
      newExercises[index],
    ];
    setSelectedExercises(newExercises);
  };

  const saveWorkout = async () => {
    if (!workoutName) {
      toast.error("Please enter a workout name");
      return;
    }

    if (selectedExercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    try {
      const response = await fetch("/api/custom-workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workoutName,
          description: workoutDescription,
          exercises: selectedExercises.map((ex) => ({
            id: ex.id,
            sets: ex.sets || null,
            reps: ex.reps || null,
            duration: ex.duration || null,
            notes: ex.notes || null,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Workout saved successfully!");
        setWorkoutName("");
        setWorkoutDescription("");
        setSelectedExercises([]);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout");
    }
  };

  const deleteCustomWorkout = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workout?")) return;

    try {
      const response = await fetch(`/api/custom-workouts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
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
        <h1 className="text-3xl font-bold mb-8">Workout Designer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exercise Library */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">Exercise Library</h2>

            <div className="space-y-4 mb-4">
              <div>
                <input
                  type="text"
                  className="input"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select
                  className="select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="">All Difficulties</option>
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-gray-700 p-3 rounded-lg flex justify-between items-center hover:bg-gray-600 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{exercise.name}</p>
                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                      <span>{exercise.category}</span>
                      <span>•</span>
                      <span>{exercise.difficulty}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addExercise(exercise)}
                    className="btn-primary text-sm py-1 px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Workout Builder */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">Build Your Workout</h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Workout Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Upper Body Strength"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Optional description..."
                  value={workoutDescription}
                  onChange={(e) => setWorkoutDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
              {selectedExercises.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Add exercises from the library to build your workout
                </p>
              ) : (
                selectedExercises.map((exercise, index) => (
                  <div key={exercise.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveExercise(index, "up")}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveExercise(index, "down")}
                          disabled={index === selectedExercises.length - 1}
                          className="text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeExercise(exercise.id)}
                          className="text-red-500 hover:text-red-400 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Sets</label>
                        <input
                          type="number"
                          className="input text-sm py-1"
                          value={exercise.sets || ""}
                          onChange={(e) =>
                            updateExercise(
                              exercise.id,
                              "sets",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Reps</label>
                        <input
                          type="number"
                          className="input text-sm py-1"
                          value={exercise.reps || ""}
                          onChange={(e) =>
                            updateExercise(
                              exercise.id,
                              "reps",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Time (min)
                        </label>
                        <input
                          type="number"
                          className="input text-sm py-1"
                          value={exercise.duration || ""}
                          onChange={(e) =>
                            updateExercise(
                              exercise.id,
                              "duration",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedExercises.length > 0 && (
              <button
                onClick={saveWorkout}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Workout
              </button>
            )}
          </div>
        </div>

        {/* Saved Workouts */}
        {customWorkouts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">My Custom Workouts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customWorkouts.map((workout) => (
                <div key={workout.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{workout.name}</h3>
                    <button
                      onClick={() => deleteCustomWorkout(workout.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {workout.description && (
                    <p className="text-sm text-gray-400 mb-3">
                      {workout.description}
                    </p>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {workout.exercises.length} exercise
                      {workout.exercises.length !== 1 ? "s" : ""}
                    </p>
                    {workout.exercises.slice(0, 3).map((ex, i) => (
                      <p key={i} className="text-xs text-gray-500">
                        • {ex.exercise.name}
                      </p>
                    ))}
                    {workout.exercises.length > 3 && (
                      <p className="text-xs text-gray-500">
                        + {workout.exercises.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
