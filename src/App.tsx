import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PinGate from "./components/PinGate";
import GameToasts from "./components/GameToasts";
import FutureBackground from "./components/FutureBackground";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Index from "./pages/Index";
import PlanPage from "./pages/PlanPage";
import TrackPage from "./pages/TrackPage";
import InsightsPage from "./pages/InsightsPage";
import YouPage from "./pages/YouPage";
import FlowPage from "./pages/FlowPage";
import TasksPage from "./pages/TasksPage";
import HabitsPage from "./pages/HabitsPage";
import JournalPage from "./pages/JournalPage";
import MoodPage from "./pages/MoodPage";
import SleepPage from "./pages/SleepPage";
import NotesPage from "./pages/NotesPage";
import WaterPage from "./pages/WaterPage";
import StatsPage from "./pages/StatsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import FinancePage from "./pages/FinancePage";
import AchievementsPage from "./pages/AchievementsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedApp = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <PinGate>{children}</PinGate>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameToasts />
      <BrowserRouter>
        <FutureBackground />
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<ProtectedApp><Index /></ProtectedApp>} />
              <Route path="/plan" element={<ProtectedApp><PlanPage /></ProtectedApp>} />
              <Route path="/track" element={<ProtectedApp><TrackPage /></ProtectedApp>} />
              <Route path="/insights" element={<ProtectedApp><InsightsPage /></ProtectedApp>} />
              <Route path="/you" element={<ProtectedApp><YouPage /></ProtectedApp>} />
              <Route path="/flow" element={<ProtectedApp><FlowPage /></ProtectedApp>} />
              <Route path="/tasks" element={<ProtectedApp><TasksPage /></ProtectedApp>} />
              <Route path="/habits" element={<ProtectedApp><HabitsPage /></ProtectedApp>} />
              <Route path="/journal" element={<ProtectedApp><JournalPage /></ProtectedApp>} />
              <Route path="/mood" element={<ProtectedApp><MoodPage /></ProtectedApp>} />
              <Route path="/sleep" element={<ProtectedApp><SleepPage /></ProtectedApp>} />
              <Route path="/notes" element={<ProtectedApp><NotesPage /></ProtectedApp>} />
              <Route path="/water" element={<ProtectedApp><WaterPage /></ProtectedApp>} />
              <Route path="/study" element={<ProtectedApp><StudyPlannerPage /></ProtectedApp>} />
              <Route path="/analytics" element={<ProtectedApp><AnalyticsPage /></ProtectedApp>} />
              <Route path="/stats" element={<ProtectedApp><StatsPage /></ProtectedApp>} />
              <Route path="/finance" element={<ProtectedApp><FinancePage /></ProtectedApp>} />
              <Route path="/achievements" element={<ProtectedApp><AchievementsPage /></ProtectedApp>} />
              <Route path="/settings" element={<ProtectedApp><SettingsPage /></ProtectedApp>} />
              <Route path="/profile" element={<ProtectedApp><ProfilePage /></ProtectedApp>} />
              <Route path="/chat" element={<ProtectedApp><ChatPage /></ProtectedApp>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
