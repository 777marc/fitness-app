# Quick Start Guide

## Running the App

The app is currently running at: **http://localhost:3000**

## Demo Account

Login with these credentials:

- **Username**: `demo`
- **Password**: `demo123`

## Features to Try

### 1. Dashboard

- Navigate to http://localhost:3000/dashboard
- View all your workouts
- Click "Add New Workout" to log a workout
- Edit or delete existing workouts
- Each workout includes: exercise type, duration, calories, date, and notes

### 2. Schedule

- Navigate to http://localhost:3000/schedule
- View weekly calendar view
- Add workouts to specific days
- Choose from pre-loaded workout types (Running, Cycling, etc.) or custom workouts
- Mark workouts as complete (creates a workout entry automatically)
- Navigate between weeks using Previous/Next buttons

### 3. Workout Designer

- Navigate to http://localhost:3000/designer
- Browse 26 exercises from the library
- Filter by category, difficulty, or equipment
- Search for specific exercises
- Build custom workout routines by adding exercises
- Set custom sets, reps, and duration for each exercise
- Save workouts and use them in the schedule

### 4. Statistics

- Navigate to http://localhost:3000/stats
- View total workouts, duration, and calories burned
- See top 5 most performed exercises
- View breakdown of all exercises

## Exercise Categories

The app includes 26 exercises across 8 categories:

1. **Upper Body**: Push-ups, Bench Press, Pull-ups, Shoulder Press, Bicep Curls, Tricep Dips
2. **Lower Body**: Squats, Deadlifts, Lunges, Calf Raises
3. **Core**: Plank, Russian Twists, Leg Raises
4. **Full Body**: Burpees, Kettlebell Swings, Thrusters
5. **Cardio**: Running, Cycling, Rowing
6. **Stretching**: Hip Flexor Stretch, Hamstring Stretch, Child's Pose
7. **Mobility**: Shoulder Circles
8. **Bodyweight**: Air Squats, Wall Sit, Mountain Climbers

## Tech Stack

- **Frontend**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with dark mode
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Date Handling**: date-fns

## API Endpoints

All API endpoints are available at `/api/`:

- Authentication: `/api/register`, `/api/auth/[...nextauth]`
- Workouts: `/api/workouts`, `/api/workouts/[id]`
- Schedule: `/api/schedule`, `/api/schedule/[id]`
- Exercises: `/api/exercises`
- Custom Workouts: `/api/custom-workouts`, `/api/custom-workouts/[id]`
- Workout Types: `/api/workout-types`

## Database

The SQLite database is located at `prisma/dev.db` and includes:

- Users (with hashed passwords)
- Workouts (logged exercises)
- Scheduled Workouts (calendar entries)
- Exercises (26 pre-loaded)
- Workout Types (8 pre-loaded)
- Custom Workouts (user-created routines)

## Development Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View database with Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## Creating a New Account

1. Go to http://localhost:3000/register
2. Enter username, email, and password
3. Click "Register"
4. Login with your new credentials

## Notes

- All passwords are hashed with bcryptjs
- Sessions are managed with JWT tokens
- The app uses dark mode by default
- All pages are fully responsive
- Authentication is required for all dashboard features
