import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import KanbanBoard from './components/KanbanBoard';

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('accessToken'),
  );

  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = (accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Clear local token even if logout request fails.
      }
    }

    localStorage.removeItem('accessToken');
    setToken(null);
  };

  if (!token) {
    if (showRegister) {
      return (
        <Register
          onRegister={() => setShowRegister(false)}
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <>
        <Login onLogin={handleLogin} />

        <div className="register-link">
          <button
            type="button"
            onClick={() => setShowRegister(true)}
          >
            Create an account
          </button>
        </div>
      </>
    );
  }

  return <KanbanBoard token={token} onLogout={handleLogout} />;
}

export default App;