import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const workoutTypes = [
  { name: "Running", defaultDuration: 30, defaultCalories: 300 },
  { name: "Cycling", defaultDuration: 45, defaultCalories: 400 },
  { name: "Swimming", defaultDuration: 30, defaultCalories: 350 },
  { name: "Weight Training", defaultDuration: 60, defaultCalories: 250 },
  { name: "Yoga", defaultDuration: 45, defaultCalories: 150 },
  { name: "HIIT", defaultDuration: 30, defaultCalories: 400 },
  { name: "Walking", defaultDuration: 30, defaultCalories: 150 },
  { name: "Pilates", defaultDuration: 45, defaultCalories: 200 },
];

const exercises = [
  // Upper Body
  {
    name: "Push-ups",
    category: "Upper Body",
    primaryMuscleGroups: "Chest, Triceps, Shoulders",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    workoutGoal: "Strength",
    location: "Home",
  },
  {
    name: "Bench Press",
    category: "Upper Body",
    primaryMuscleGroups: "Chest, Triceps, Shoulders",
    equipment: "Barbell",
    difficulty: "Intermediate",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Pull-ups",
    category: "Upper Body",
    primaryMuscleGroups: "Back, Biceps",
    equipment: "Pull-up Bar",
    difficulty: "Intermediate",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Shoulder Press",
    category: "Upper Body",
    primaryMuscleGroups: "Shoulders, Triceps",
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Bicep Curls",
    category: "Upper Body",
    primaryMuscleGroups: "Biceps",
    equipment: "Dumbbells",
    difficulty: "Beginner",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Tricep Dips",
    category: "Upper Body",
    primaryMuscleGroups: "Triceps, Chest",
    equipment: "Parallel Bars",
    difficulty: "Intermediate",
    workoutGoal: "Strength",
    location: "Gym",
  },

  // Lower Body
  {
    name: "Squats",
    category: "Lower Body",
    primaryMuscleGroups: "Quadriceps, Glutes, Hamstrings",
    equipment: "Barbell",
    difficulty: "Beginner",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Deadlifts",
    category: "Lower Body",
    primaryMuscleGroups: "Back, Glutes, Hamstrings",
    equipment: "Barbell",
    difficulty: "Advanced",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Lunges",
    category: "Lower Body",
    primaryMuscleGroups: "Quadriceps, Glutes",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    workoutGoal: "Strength",
    location: "Home",
  },
  {
    name: "Calf Raises",
    category: "Lower Body",
    primaryMuscleGroups: "Calves",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    workoutGoal: "Strength",
    location: "Home",
  },

  // Core
  {
    name: "Plank",
    category: "Core",
    primaryMuscleGroups: "Abs, Core",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    workoutGoal: "Strength",
    location: "Home",
  },
  {
    name: "Russian Twists",
    category: "Core",
    primaryMuscleGroups: "Obliques, Abs",
    equipment: "Medicine Ball",
    difficulty: "Intermediate",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Leg Raises",
    category: "Core",
    primaryMuscleGroups: "Lower Abs",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    workoutGoal: "Strength",
    location: "Home",
  },

  // Full Body
  {
    name: "Burpees",
    category: "Full Body",
    primaryMuscleGroups: "Full Body",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    workoutGoal: "Endurance",
    location: "Home",
  },
  {
    name: "Kettlebell Swings",
    category: "Full Body",
    primaryMuscleGroups: "Glutes, Core, Shoulders",
    equipment: "Kettlebell",
    difficulty: "Intermediate",
    workoutGoal: "Strength",
    location: "Gym",
  },
  {
    name: "Thrusters",
    category: "Full Body",
    primaryMuscleGroups: "Legs, Shoulders, Core",
    equipment: "Dumbbells",
    difficulty: "Advanced",
    workoutGoal: "Strength",
    location: "Gym",
  },

  // Cardio
  {
    name: "Running",
    category: "Cardio",
    primaryMuscleGroups: "Legs, Cardiovascular",
    equipment: "None",
    difficulty: "Beginner",
    workoutGoal: "Endurance",
    location: "Outdoor",
  },
  {
    name: "Cycling",
    category: "Cardio",
    primaryMuscleGroups: "Legs, Cardiovascular",
    equipment: "Bicycle",
    difficulty: "Beginner",
    workoutGoal: "Endurance",
    location: "Outdoor",
  },
  {
    name: "Rowing",
    category: "Cardio",
    primaryMuscleGroups: "Back, Legs, Cardiovascular",
    equipment: "Rowing Machine",
    difficulty: "Intermediate",
    workoutGoal: "Endurance",
    location: "Gym",
  },

  // Mobility & Stretching
  {
    name: "Hip Flexor Stretch",
    category: "Stretching",
    primaryMuscleGroups: "Hip Flexors",
    equipment: "None",
    difficulty: "Beginner",
    workoutGoal: "Flexibility",
    location: "Home",
  },
  {
    name: "Shoulder Circles",
    category: "Mobility",
    primaryMuscleGroups: "Shoulders",
    equipment: "None",
    difficulty: "Beginner",
    workoutGoal: "Flexibility",
    location: "Home",
  },
  {
    name: "Hamstring Stretch",
    category: "Stretching",
    primaryMuscleGroups: "Hamstrings",
    equipment: "None",
    difficulty: "Beginner",
    workoutGoal: "Flexibility",
    location: "Home",
  },
  {
    name: "Child's Pose",
    category: "Stretching",
    primaryMuscleGroups: "Back, Shoulders",
    equipment: "None",
    difficulty: "Beginner",
    workoutGoal: "Flexibility",
    location: "Home",
  },

  // Bodyweight
  {
    name: "Air Squats",
    category: "Bodyweight",
    primaryMuscleGroups: "Quadriceps, Glutes",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    workoutGoal: "Strength",
    location: "Home",
  },
  {
    name: "Wall Sit",
    category: "Bodyweight",
    primaryMuscleGroups: "Quadriceps, Glutes",
    equipment: "Wall",
    difficulty: "Beginner",
    workoutGoal: "Endurance",
    location: "Home",
  },
  {
    name: "Mountain Climbers",
    category: "Bodyweight",
    primaryMuscleGroups: "Core, Legs",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    workoutGoal: "Endurance",
    location: "Home",
  },
];

async function main() {
  console.log("Start seeding...");

  // Clear existing data
  await prisma.customWorkoutExercise.deleteMany();
  await prisma.customWorkout.deleteMany();
  await prisma.scheduledWorkout.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workoutType.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create workout types
  for (const workoutType of workoutTypes) {
    await prisma.workoutType.create({
      data: workoutType,
    });
  }
  console.log(`Created ${workoutTypes.length} workout types`);

  // Create exercises
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise,
    });
  }
  console.log(`Created ${exercises.length} exercises`);

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.create({
    data: {
      username: "demo",
      email: "demo@fitness.com",
      password: hashedPassword,
    },
  });
  console.log(`Created demo user (username: demo, password: demo123)`);

  // Create some sample workouts for demo user
  const today = new Date();
  await prisma.workout.create({
    data: {
      exercise: "Running",
      duration: 30,
      calories: 300,
      notes: "Morning run in the park",
      date: new Date(today.setDate(today.getDate() - 2)),
      userId: user.id,
    },
  });

  await prisma.workout.create({
    data: {
      exercise: "Weight Training",
      duration: 60,
      calories: 250,
      notes: "Upper body workout",
      date: new Date(today.setDate(today.getDate() + 1)),
      userId: user.id,
    },
  });
  console.log("Created sample workouts for demo user");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
