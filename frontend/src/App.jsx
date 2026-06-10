import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getSession, onAuthStateChange } from "./services/authService";
import LoadingState from "./components/LoadingState";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Decks from "./pages/Decks";
import DeckDetails from "./pages/DeckDetails";
import Training from "./pages/Training";
import PublicDecks from "./pages/PublicDecks";
import Profile from "./pages/Profile";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="desktop single-window"><LoadingState>Проверяю вход...</LoadingState></main>;
  if (!session) return <Navigate to="/login" replace state={{ next: location.pathname + location.search }} />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <main className="desktop single-window"><LoadingState>Проверяю вход...</LoadingState></main>;
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((current) => mounted && setSession(current))
      .finally(() => mounted && setLoading(false));
    const { data } = onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const authValue = useMemo(() => ({ session, user: session?.user || null, loading }), [session, loading]);

  return (
    <AuthContext.Provider value={authValue}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/decks" element={<PrivateRoute><Decks /></PrivateRoute>} />
        <Route path="/decks/:deckId" element={<DeckDetails />} />
        <Route path="/training/:deckId" element={<PrivateRoute><Training /></PrivateRoute>} />
        <Route path="/public" element={<PublicDecks />} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
