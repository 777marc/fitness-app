"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Activity, Clock, Flame, Calendar } from "lucide-react";

interface Workout {
  id: string;
  exercise: string;
  duration: number;
  calories: number;
  date: string;
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchWorkouts();
    }
  }, [status, router]);

  const fetchWorkouts = async () => {
    try {
      const response = await fetch("/api/workouts");
      if (response.ok) {
        const data = await response.json();
        setWorkouts(data);
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
  const avgDuration =
    totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
  const avgCalories =
    totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

  // Group by exercise type
  const exerciseStats = workouts.reduce((acc, workout) => {
    const name = workout.exercise;
    if (!acc[name]) {
      acc[name] = { count: 0, duration: 0, calories: 0 };
    }
    acc[name].count++;
    acc[name].duration += workout.duration;
    acc[name].calories += workout.calories;
    return acc;
  }, {} as Record<string, { count: number; duration: number; calories: number }>);

  const topExercises = Object.entries(exerciseStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

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
        <h1 className="text-3xl font-bold mb-8">Statistics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">
                Total Workouts
              </h3>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{totalWorkouts}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">
                Total Duration
              </h3>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold">{totalDuration}</p>
            <p className="text-sm text-gray-400">minutes</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">
                Total Calories
              </h3>
              <Flame className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-3xl font-bold">{totalCalories}</p>
            <p className="text-sm text-gray-400">burned</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">
                Avg. Duration
              </h3>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-3xl font-bold">{avgDuration}</p>
            <p className="text-sm text-gray-400">minutes per workout</p>
          </div>
        </div>

        {totalWorkouts > 0 && (
          <>
            <div className="card p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Top 5 Exercises</h2>
              <div className="space-y-4">
                {topExercises.map(([name, stats], index) => (
                  <div
                    key={name}
                    className="border-b border-gray-700 pb-4 last:border-0"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-blue-500">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold">{name}</h3>
                      </div>
                      <span className="text-gray-400">{stats.count} times</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 ml-12">
                      <div>
                        <p className="text-sm text-gray-400">Total Duration</p>
                        <p className="font-semibold">
                          {stats.duration} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Calories</p>
                        <p className="font-semibold">{stats.calories} cal</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">
                All Exercise Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(exerciseStats).map(([name, stats]) => (
                  <div key={name} className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{name}</h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      <p>
                        Count: <span className="text-white">{stats.count}</span>
                      </p>
                      <p>
                        Duration:{" "}
                        <span className="text-white">{stats.duration} min</span>
                      </p>
                      <p>
                        Calories:{" "}
                        <span className="text-white">{stats.calories} cal</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {totalWorkouts === 0 && (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg">
              No workout data available yet. Start logging your workouts to see
              statistics!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
