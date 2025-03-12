import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpenReader } from "@fortawesome/free-solid-svg-icons";
import { AuthProvider } from "./context/AuthContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import QuizzesPage from "./pages/QuizzesPage";
import CreateQuizPage from "./pages/CreateQuizPage";
import AttemptsPage from "./pages/AttemptsPage";
import AccuracyPage from "./pages/AccuracyPage";
import AchievementsPage from "./pages/AchievementsPage";

function App() {
  const [authenticated, setAuthenticated] = useState(true);

  const pathLocation = window.location.pathname;

  const routes = [
    { component: <Dashboard />, route: "/" },
    { component: <QuizzesPage />, route: "/quizzes" },
    { component: <CreateQuizPage />, route: "/create-quiz" },
    { component: <AttemptsPage />, route: "/attempts" },
    { component: <AccuracyPage />, route: "/accuracy" },
    { component: <AchievementsPage />, route: "/achievements" },
  ];

  useEffect(() => {
    localStorage.setItem("lastPath", pathLocation);
  }, [pathLocation]);

  return (
    <>
      <AuthProvider>
        <Router>
          <Routes>
            {/* <Route
            index
            exact
            path="/login"
            element={<LoginPage performLogin={performLogin} />}
          /> */}
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.route}
                element={
                  authenticated ? (
                    <Navbar>{route.component}</Navbar>
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            ))}
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
