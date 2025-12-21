"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Activity,
  LayoutDashboard,
  Calendar,
  Hammer,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-blue-900 border-b border-blue-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center space-x-2 text-white font-bold text-xl"
          >
            <Activity className="w-6 h-6" />
            <span>Fitness Tracker</span>
          </Link>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/schedule"
                  className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Schedule</span>
                </Link>
                <Link
                  href="/designer"
                  className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors"
                >
                  <Hammer className="w-5 h-5" />
                  <span>Designer</span>
                </Link>
                <Link
                  href="/stats"
                  className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Statistics</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
