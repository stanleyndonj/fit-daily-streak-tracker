
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkoutProvider } from "@/context/WorkoutContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { AchievementProvider } from "@/context/AchievementContext";
import Index from "./pages/Index";
import WorkoutDetailPage from "./pages/WorkoutDetailPage";
import CreateWorkoutPage from "./pages/CreateWorkoutPage";
import EditWorkoutPage from "./pages/EditWorkoutPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Initialize dark mode based on saved preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SettingsProvider>
          <WorkoutProvider>
            <AchievementProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/workout/:workoutId" element={<WorkoutDetailPage />} />
                  <Route path="/create-workout" element={<CreateWorkoutPage />} />
                  <Route path="/edit-workout/:workoutId" element={<EditWorkoutPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AchievementProvider>
          </WorkoutProvider>
        </SettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
