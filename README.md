# Fitness Tracker - Next.js App

A modern fitness tracking application built with Next.js 16, TypeScript, Prisma, and NextAuth. This app is a Next.js version of the Python Flask fitness tracker from https://github.com/777marc/fitness-track, featuring all the same functionality with a modern tech stack.

## Features

- **User Authentication**: Secure registration and login with NextAuth.js
- **Workout Tracking**: Log exercises with duration, calories, and notes
- **Custom Workout Designer**: Build personalized workout routines from 26+ exercises
- **Weekly Schedule**: Plan workouts for the week with a visual calendar view
- **Exercise Database**: 26 pre-loaded exercises across 8 categories
- **Statistics**: Track your fitness progress
- **Dark Mode UI**: Modern dark theme with excellent readability
- **Responsive Design**: Tailwind CSS powered UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

The database has already been created and seeded. If you need to reset it:

```bash
npx prisma migrate reset
npx prisma db seed
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Account

A demo account has been pre-created:

- **Username**: demo
- **Password**: demo123

## Project Structure

```
fitness-app/
├── app/                     # Next.js app directory
│   ├── api/                # API routes
│   │   ├── auth/          # NextAuth routes
│   │   ├── workouts/      # Workout CRUD endpoints
│   │   ├── schedule/      # Schedule endpoints
│   │   ├── exercises/     # Exercise library endpoints
│   │   └── custom-workouts/ # Custom workout endpoints
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── register/          # Register page
│   └── page.tsx           # Landing page
├── components/             # React components
│   ├── Navbar.tsx         # Navigation bar
│   └── Providers.tsx      # NextAuth provider
├── lib/                    # Utility libraries
│   ├── prisma.ts          # Prisma client
│   └── auth.ts            # NextAuth configuration
├── prisma/                 # Prisma schema and migrations
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed data
│   └── migrations/        # Database migrations
└── types/                  # TypeScript type definitions
```

## API Endpoints

### Authentication

- `POST /api/register` - Register new user
- `POST /api/auth/signin` - Login (handled by NextAuth)

### Workouts

- `GET /api/workouts` - Get all workouts for current user
- `POST /api/workouts` - Create new workout
- `GET /api/workouts/[id]` - Get specific workout
- `PUT /api/workouts/[id]` - Update workout
- `DELETE /api/workouts/[id]` - Delete workout

### Schedule

- `GET /api/schedule` - Get scheduled workouts
- `POST /api/schedule` - Create scheduled workout
- `DELETE /api/schedule/[id]` - Delete scheduled workout
- `PATCH /api/schedule/[id]` - Mark workout as complete/incomplete

### Exercises & Custom Workouts

- `GET /api/exercises` - Get exercise library (with filters)
- `GET /api/custom-workouts` - Get custom workouts
- `POST /api/custom-workouts` - Create custom workout
- `DELETE /api/custom-workouts/[id]` - Delete custom workout
- `GET /api/workout-types` - Get predefined workout types

## Features Comparison with Python App

This Next.js app includes all features from the original Python Flask app:

✅ User authentication (register/login)  
✅ Workout CRUD operations  
✅ Weekly schedule with calendar view  
✅ Mark scheduled workouts as complete  
✅ Custom workout designer with exercise library  
✅ Exercise filtering by category, difficulty, equipment  
✅ Statistics and progress tracking  
✅ Dark mode UI  
✅ Responsive design

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Environment Variables

The `.env` file contains:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
```

**Important**: Change `NEXTAUTH_SECRET` in production!

## Security

- Passwords are hashed using bcryptjs
- User sessions managed with NextAuth.js JWT strategy
- API routes protected with authentication middleware

## License

This project is open source and available for educational purposes.

## Acknowledgments

Based on the Python Flask fitness tracker app from https://github.com/777marc/fitness-track
