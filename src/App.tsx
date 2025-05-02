
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkoutProvider } from "@/context/WorkoutContext";
import Index from "./pages/Index";
import WorkoutDetailPage from "./pages/WorkoutDetailPage";
import CreateWorkoutPage from "./pages/CreateWorkoutPage";
import EditWorkoutPage from "./pages/EditWorkoutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WorkoutProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/workout/:workoutId" element={<WorkoutDetailPage />} />
            <Route path="/create-workout" element={<CreateWorkoutPage />} />
            <Route path="/edit-workout/:workoutId" element={<EditWorkoutPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WorkoutProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
