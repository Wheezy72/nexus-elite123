import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GameToasts from "./components/GameToasts";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Index from "./pages/Index";
import FlowPage from "./pages/FlowPage";
import TasksPage from "./pages/TasksPage";
import HabitsPage from "./pages/HabitsPage";
import JournalPage from "./pages/JournalPage";
import MoodPage from "./pages/MoodPage";
import SleepPage from "./pages/SleepPage";
import NotesPage from "./pages/NotesPage";
import WaterPage from "./pages/WaterPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedApp = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameToasts />
      <BrowserRouter>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<ProtectedApp><Index /></ProtectedApp>} />
              <Route path="/flow" element={<ProtectedApp><FlowPage /></ProtectedApp>} />
              <Route path="/tasks" element={<ProtectedApp><TasksPage /></ProtectedApp>} />
              <Route path="/habits" element={<ProtectedApp><HabitsPage /></ProtectedApp>} />
              <Route path="/journal" element={<ProtectedApp><JournalPage /></ProtectedApp>} />
              <Route path="/mood" element={<ProtectedApp><MoodPage /></ProtectedApp>} />
              <Route path="/sleep" element={<ProtectedApp><SleepPage /></ProtectedApp>} />
              <Route path="/notes" element={<ProtectedApp><NotesPage /></ProtectedApp>} />
              <Route path="/water" element={<ProtectedApp><WaterPage /></ProtectedApp>} />
              <Route path="/stats" element={<ProtectedApp><StatsPage /></ProtectedApp>} />
              <Route path="/settings" element={<ProtectedApp><SettingsPage /></ProtectedApp>} />
              <Route path="/profile" element={<ProtectedApp><ProfilePage /></ProtectedApp>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
