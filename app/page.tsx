import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { Activity, BarChart3, Trophy, Plus } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 flex items-center justify-center gap-3">
            <Activity className="w-12 h-12 text-blue-500" />
            Welcome to Fitness Tracker
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Track your workouts, monitor your progress, and achieve your fitness
            goals!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card p-6 text-center">
              <div className="flex justify-center mb-4">
                <Plus className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Log Workouts</h3>
              <p className="text-gray-400">
                Record your exercises, duration, and calories burned.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="flex justify-center mb-4">
                <BarChart3 className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-400">
                Monitor your fitness journey with detailed statistics.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Achieve Goals</h3>
              <p className="text-gray-400">
                Stay motivated and reach your fitness objectives.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {session ? (
              <Link href="/dashboard" className="btn-primary text-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-primary text-lg">
                  Get Started
                </Link>
                <Link href="/login" className="btn-secondary text-lg">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400">
          <p>&copy; 2025 Fitness Tracker. Track your fitness journey.</p>
        </div>
      </footer>
    </div>
  );
}
