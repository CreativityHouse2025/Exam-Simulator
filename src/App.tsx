import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Toast from "./components/Toast";
import Header from "./components/Header";
import Loading from "./components/Loading";
import RouteGuard from "./guards/RouteGuard";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import ProfilePage from "./pages/profile";
import AuthCallbackPage from "./pages/auth-callback";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";
import AttemptHistoryPage from "./pages/track-history";
import TracksPage from "./pages/tracks";
import TrackPage from "./pages/track";
import SupervisorDashboardPage from "./pages/supervisor";
import ExamTracksPage from "./pages/exam-tracks";
import ExamLibraryPage from "./pages/exam-library";
import ExamDetailPage from "./pages/exam-detail";
import StudentSearchPage from "./pages/student-search";
import StudentProfilePage from "./pages/student-profile";
import StudentAttemptsPage from "./pages/student-attempts";
import ExamPage from "./pages/exam";
import { hasTranslation, setTranslation } from "./utils/translation";
import { LANGUAGES } from "./constants";
import { ROUTES } from "./config/routes";
import { roleOf } from "./config/roles";
import useAuth from "./hooks/useAuth";
import useSettings from "./hooks/useSettings";
import type { LangCode } from "./types";
import SessionProvider from "./providers/SessionProvider";

const App: React.FC = () => {
  const { settings } = useSettings();
  const { user } = useAuth();

  const langCode = settings.language;
  const [translationVersion, setTranslationVersion] = React.useState<number>(
    hasTranslation() ? 1 : 0,
  );

  const loadTranslation = React.useCallback(async (code: LangCode) => {
    const translations = (await import(`./data/langs/${code}.json`)).default;
    const newLang = LANGUAGES[code];

    setTranslation(newLang, translations);
    document.documentElement.lang = newLang.code;
    document.documentElement.dir = newLang.dir;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function initTranslation() {
      // Do NOT set loading state, keeps Routes mounted during language switch (UX during examination)
      try {
        await loadTranslation(langCode);
      } catch (error) {
        console.error("Failed to load translation: ", error);
      } finally {
        if (!cancelled) setTranslationVersion((v) => v + 1);
      }
    }
    initTranslation();
    return () => {
      cancelled = true;
    };
  }, [langCode, loadTranslation]);

  // if it is loading for the first time
  if (translationVersion === 0) {
    return <Loading size={200} />;
  }

  return (
    <>
      <div className="app-background" />
      <div className="flex flex-col h-dvh">
        <Header />
        <div className="flex-1 overflow-auto flex flex-col">
          <Routes>
            {/* Public */}
            <Route
              path={ROUTES.signIn}
              element={
                <RouteGuard roles={["guest"]}>
                  <SignInPage />
                </RouteGuard>
              }
            />
            <Route
              path={ROUTES.signUp}
              element={
                <RouteGuard roles={["guest"]}>
                  <SignUpPage />
                </RouteGuard>
              }
            />
            <Route
              path={ROUTES.forgotPassword}
              element={
                <RouteGuard roles={["guest"]}>
                  <ForgotPasswordPage />
                </RouteGuard>
              }
            />
            <Route path={ROUTES.authCallback} element={<AuthCallbackPage />} />

            {/* Authenticated routes 
            SessionProvider sits at the root of this branch so it stays a single
            stable instance across "/", "/history" and "/exam" — a started session survives the
            navigation to "/exam". Mounting it for supervisors too is inert: it fetches nothing. */}
            <Route
              element={
                <RouteGuard roles={["student", "supervisor"]}>
                  <SessionProvider>
                    <Outlet />
                  </SessionProvider>
                </RouteGuard>
              }
            >
              {/* Shared routes. "/" is one URL with two pages behind it — the role switch lives
                  here rather than in a page, so no page ever imports another. Guests never reach
                  it; the surrounding RouteGuard has already sent them to sign-in. */}
              <Route
                index
                element={
                  roleOf(user) === "supervisor" ? (
                    <SupervisorDashboardPage />
                  ) : (
                    <TracksPage />
                  )
                }
              />
              <Route path={ROUTES.profile} element={<ProfilePage />} />
              <Route
                path={ROUTES.resetPassword}
                element={<ResetPasswordPage />}
              />

              {/* Supervisor routes */}
              <Route
                element={
                  <RouteGuard roles={["supervisor"]}>
                    <Outlet />
                  </RouteGuard>
                }
              >
                <Route path={ROUTES.exams} element={<ExamTracksPage />} />
                <Route
                  path={ROUTES.examLibrary.pattern}
                  element={<ExamLibraryPage />}
                />
                <Route
                  path={ROUTES.examDetail.pattern}
                  element={<ExamDetailPage />}
                />
                <Route
                  path={ROUTES.examPreview.pattern}
                  element={<ExamPage />}
                />
                <Route path={ROUTES.students} element={<StudentSearchPage />} />
                <Route
                  path={ROUTES.student.pattern}
                  element={<StudentProfilePage />}
                />
                <Route
                  path={ROUTES.studentAttempts.pattern}
                  element={<StudentAttemptsPage />}
                />
              </Route>

              {/* Student routes */}
              <Route
                element={
                  <RouteGuard roles={["student"]}>
                    <Outlet />
                  </RouteGuard>
                }
              >
                <Route path={ROUTES.track.pattern} element={<TrackPage />} />
                <Route
                  path={ROUTES.trackHistory.pattern}
                  element={<AttemptHistoryPage />}
                />
                <Route path={ROUTES.exam.pattern} element={<ExamPage />} />
              </Route>
            </Route>

            {/* Catch all undefined routes and redirect to homepage */}
            <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
          </Routes>
        </div>
      </div>
      <Toast />
    </>
  );
};

export default App;
