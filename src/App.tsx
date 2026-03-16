import React, { Suspense, lazy } from "react";
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

const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const Index = lazy(() => import("./pages/Index"));
const PlanPage = lazy(() => import("./pages/PlanPage"));
const TrackPage = lazy(() => import("./pages/TrackPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const YouPage = lazy(() => import("./pages/YouPage"));
const FlowPage = lazy(() => import("./pages/FlowPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const HabitsPage = lazy(() => import("./pages/HabitsPage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const MoodPage = lazy(() => import("./pages/MoodPage"));
const SleepPage = lazy(() => import("./pages/SleepPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const WaterPage = lazy(() => import("./pages/WaterPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const StudyPlannerPage = lazy(() => import("./pages/StudyPlannerPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center text-foreground">
    <div className="glass rounded-3xl border border-white/[0.08] px-6 py-4 text-sm text-muted-foreground">
      Loading…
    </div>
  </div>
);

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
              <Route
                path="/auth"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <AuthPage />
                  </Suspense>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <ResetPasswordPage />
                  </Suspense>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <Index />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/plan"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <PlanPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/track"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <TrackPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/insights"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <InsightsPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/you"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <YouPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/flow"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <FlowPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <TasksPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/habits"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <HabitsPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <JournalPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/mood"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <MoodPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/sleep"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <SleepPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <NotesPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/water"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <WaterPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/study"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <StudyPlannerPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <AnalyticsPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/stats"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <StatsPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <FinancePage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <AchievementsPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <SettingsPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <ProfilePage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedApp>
                    <Suspense fallback={<LoadingScreen />}>
                      <ChatPage />
                    </Suspense>
                  </ProtectedApp>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <NotFound />
                  </Suspense>
                }
              />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
