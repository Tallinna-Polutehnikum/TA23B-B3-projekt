import { useEffect, useMemo, useState } from "react";
import "./Profile.css";

const AUTH_TOKEN_KEY = "ac_auth_token";
const AUTH_USER_KEY = "ac_auth_user";

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Profile() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || "");
  const [user, setUser] = useState(() => getStoredUser());

  const [form, setForm] = useState({
    username: "",
    email: "",
    identifier: "",
    password: "",
    confirmPassword: "",
  });

  const initials = useMemo(() => {
    const source = user?.username || user?.email || "U";
    return source.slice(0, 1).toUpperCase();
  }, [user]);

  const persistAuth = (nextToken, nextUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearAuth = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          clearAuth();
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data?.user) {
          persistAuth(token, data.user);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!username || !email || !password) {
      setError("All registration fields are required.");
      return;
    }

    if (password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.message || "Registration failed.");
        return;
      }

      persistAuth(data.token, data.user);
    } catch {
      setError("Unable to register right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    const identifier = form.identifier.trim();
    const password = form.password;
    if (!identifier || !password) {
      setError("Identifier and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.message || "Login failed.");
        return;
      }

      persistAuth(data.token, data.user);
    } catch {
      setError("Unable to login right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      clearAuth();
      setMode("login");
      setForm({ username: "", email: "", identifier: "", password: "", confirmPassword: "" });
    }
  };

  if (loading) {
    return (
      <section className="profile">
        <div className="profile-card">
          <p className="profile-meta">Loading profile...</p>
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="profile">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar profile-avatar--initials">{initials}</div>
            <div>
              <h2 className="profile-name">{user.username}</h2>
              <p className="profile-email">{user.email}</p>
              <p className="profile-meta">Signed in</p>
            </div>
          </div>

          <div className="profile-body">
            <h3>Account</h3>
            <p className="profile-meta">You can now buy tickets and keep your session purchases tied to your account.</p>
            <button type="button" className="profile-action" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="profile">
      <div className="profile-card">
        <div className="profile-auth-tabs">
          <button
            type="button"
            className={`profile-tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`profile-tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>

        {mode === "login" ? (
          <form className="profile-form" onSubmit={handleLogin}>
            <h2 className="profile-name">Welcome back</h2>
            <label className="profile-field">
              <span>Email or username</span>
              <input
                value={form.identifier}
                onChange={(e) => handleChange("identifier", e.target.value)}
                placeholder="username or email"
                autoComplete="username"
              />
            </label>

            <label className="profile-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </label>

            {error && <p className="profile-error">{error}</p>}

            <button type="submit" className="profile-action" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        ) : (
          <form className="profile-form" onSubmit={handleRegister}>
            <h2 className="profile-name">Create account</h2>

            <label className="profile-field">
              <span>Username</span>
              <input
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Your username"
                autoComplete="username"
              />
            </label>

            <label className="profile-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="profile-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Minimum 4 characters"
                autoComplete="new-password"
              />
            </label>

            <label className="profile-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </label>

            {error && <p className="profile-error">{error}</p>}

            <button type="submit" className="profile-action" disabled={submitting}>
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
