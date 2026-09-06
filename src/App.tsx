import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import styled from "styled-components";
import Toast from "./components/Toast";
import Header from "./components/Header";
import Loading from "./components/Loading";
import RouteGuard from "./guards/RouteGuard";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProfilePage from "./pages/ProfilePage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AttemptHistoryPage from "./pages/AttemptHistoryPage";
import HomePage from "./pages/HomePage";
import ExamLibraryPage from "./pages/exam-library";
import ExamDetailPage from "./pages/exam-detail";
import StudentSearchPage from "./pages/student-search";
import StudentAttemptsPage from "./pages/student-attempts";
import { hasTranslation, setTranslation } from "./utils/translation";
import { LANGUAGES } from "./constants";
import { ROUTES } from "./config/routes";
import useSettings from "./hooks/useSettings";
import type { LangCode } from "./types";
import SessionProvider from "./providers/SessionProvider";
import ExamPage from "./pages/ExamPage";

const AppBackground = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(
      ellipse 80% 65% at 50% 115%,
      rgba(255, 220, 154, 0.87) 0%,
      transparent 55%
    ),
    radial-gradient(
      ellipse 55% 45% at 90% 75%,
      rgba(181, 150, 93, 0.2) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse 50% 40% at 10% 85%,
      rgba(181, 150, 93, 0.14) 0%,
      transparent 45%
    ),
    radial-gradient(
      ellipse 90% 80% at 50% 50%,
      #fafaf8 0%,
      #f2f0ec 45%,
      #e9e7e3 100%
    );
`;

const AppLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
`;

const RoutesArea = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const App: React.FC = () => {
  const { settings } = useSettings();

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
      <AppBackground />
      <AppLayout>
        <Header />
        <RoutesArea>
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
              {/* Shared routes */}
              <Route index element={<HomePage />} />
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
                <Route path={ROUTES.exams} element={<ExamLibraryPage />} />
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
                <Route path={ROUTES.history} element={<AttemptHistoryPage />} />
                <Route path={ROUTES.exam.pattern} element={<ExamPage />} />
              </Route>
            </Route>

            {/* Catch all undefined routes and redirect to homepage */}
            <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
          </Routes>
        </RoutesArea>
      </AppLayout>
      <Toast />
    </>
  );
};

export default App;
