import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import "./Profile.css";

const AUTH_TOKEN_KEY = "ac_auth_token";
const AUTH_USER_KEY = "ac_auth_user";
const ADMIN_PANEL_URL = (() => {
  const configured = (import.meta.env.VITE_ADMIN_PANEL_URL || "").trim();
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5156";
  }
  return "/admin";
})();

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatDateTime(date, time) {
  const parsed = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(parsed.getTime())) {
    return `${date} ${time}`;
  }

  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value, currency = "EUR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [passPdfUrl, setPassPdfUrl] = useState("");
  const [editingAccount, setEditingAccount] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaveError, setAccountSaveError] = useState("");
  const [accountSaveSuccess, setAccountSaveSuccess] = useState("");
  const [accountForm, setAccountForm] = useState({
    username: "",
    avatarUrl: "",
  });
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

  const activeTickets = useMemo(() => tickets.filter((ticket) => ticket.isActive), [tickets]);
  const transactionPreview = useMemo(() => transactions.slice(0, 4), [transactions]);

  const persistAuth = (nextToken, nextUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    window.dispatchEvent(new Event("ac-auth-changed"));
  };

  const redirectAfterAuth = (nextUser) => {
    if (nextUser?.isAdmin) {
      if (ADMIN_PANEL_URL.startsWith("http://") || ADMIN_PANEL_URL.startsWith("https://")) {
        window.location.assign(ADMIN_PANEL_URL);
        return;
      }
      navigate(ADMIN_PANEL_URL);
      return;
    }
    navigate("/profile", { replace: true });
  };

  const clearAuth = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken("");
    setUser(null);
    window.dispatchEvent(new Event("ac-auth-changed"));
  };

  useEffect(() => {
    if (user) return;

    const requestedMode = new URLSearchParams(location.search).get("mode");
    if (requestedMode === "login" || requestedMode === "register") {
      setMode(requestedMode);
      setError("");
    }
  }, [location.search, user]);

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

  useEffect(() => {
    const loadAccountOverview = async () => {
      if (!user || !token) {
        setTickets([]);
        setTransactions([]);
        setAccountError("");
        setQrCodeUrl("");
        setPassPdfUrl("");
        return;
      }

      setAccountLoading(true);
      setAccountError("");

      try {
        const response = await fetch("/api/profile/overview", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          clearAuth();
          setAccountLoading(false);
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setAccountError(data?.message || "Failed to load account data.");
          return;
        }

        setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
        setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
      } catch {
        setAccountError("Could not load your tickets right now.");
      } finally {
        setAccountLoading(false);
      }
    };

    loadAccountOverview();
  }, [user, token]);

  useEffect(() => {
    setAccountForm({
      username: user?.username || "",
      avatarUrl: user?.avatarUrl || "",
    });
    setAccountSaveError("");
    setAccountSaveSuccess("");
  }, [user]);

  useEffect(() => {
    const createQr = async () => {
      if (!user || !token || activeTickets.length === 0) {
        setQrCodeUrl("");
        setPassPdfUrl("");
        return;
      }

      try {
        const linkResponse = await fetch("/api/profile/pass-link", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!linkResponse.ok) {
          setQrCodeUrl("");
          setPassPdfUrl("");
          return;
        }

        const linkData = await linkResponse.json().catch(() => ({}));
        const passUrl = String(linkData?.passUrl || "").trim();
        if (!passUrl) {
          setQrCodeUrl("");
          setPassPdfUrl("");
          return;
        }

        const nextUrl = await QRCode.toDataURL(passUrl, {
          width: 220,
          margin: 1,
          color: {
            dark: "#f5eaff",
            light: "#00000000",
          },
        });
        setPassPdfUrl(passUrl);
        setQrCodeUrl(nextUrl);
      } catch {
        setQrCodeUrl("");
        setPassPdfUrl("");
      }
    };

    createQr();
  }, [activeTickets, token, user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAccountFormChange = (field, value) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }));
    setAccountSaveError("");
    setAccountSaveSuccess("");
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAccountSaveError("Please choose an image file.");
      return;
    }

    if (file.size > 800 * 1024) {
      setAccountSaveError("Image is too large. Please use an image under 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : "";
      handleAccountFormChange("avatarUrl", nextValue);
    };
    reader.onerror = () => {
      setAccountSaveError("Could not read the image file.");
    };
    reader.readAsDataURL(file);

    // Allows selecting the same file again if the user wants to retry.
    event.target.value = "";
  };

  const handleAccountSave = async (event) => {
    event.preventDefault();
    if (!token) {
      setAccountSaveError("You need to be logged in.");
      return;
    }

    const username = accountForm.username.trim();
    const avatarUrl = accountForm.avatarUrl.trim();

    if (!username) {
      setAccountSaveError("Username is required.");
      return;
    }

    setSavingAccount(true);
    setAccountSaveError("");
    setAccountSaveSuccess("");

    try {
      const response = await fetch("/api/profile/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, avatarUrl }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAccountSaveError(data?.message || "Failed to update account.");
        return;
      }

      if (data?.user) {
        persistAuth(token, data.user);
      }
      setEditingAccount(false);
      setAccountSaveSuccess("Profile updated.");
    } catch {
      setAccountSaveError("Could not save account settings right now.");
    } finally {
      setSavingAccount(false);
    }
  };

  const goToLogin = () => {
    setMode("login");
    setError("");
    navigate("/profile?mode=login", { replace: true });
  };

  const goToRegister = () => {
    setMode("register");
    setError("");
    navigate("/profile?mode=register", { replace: true });
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
      redirectAfterAuth(data.user);
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
      redirectAfterAuth(data.user);
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
      setTickets([]);
      setTransactions([]);
      setQrCodeUrl("");
      setPassPdfUrl("");
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
      <section className="profile profile--account">
        <div className="profile-card profile-card--account">
          <div className="profile-header">
            {user.avatarUrl ? (
              <img className="profile-avatar" src={user.avatarUrl} alt={`${user.username} avatar`} />
            ) : (
              <div className="profile-avatar profile-avatar--initials">{initials}</div>
            )}
            <div className="profile-header-main">
              <h2 className="profile-name">{user.username}</h2>
              <p className="profile-email">{user.email}</p>
              <p className="profile-meta">Signed in</p>
              {accountSaveSuccess && <p className="profile-success">{accountSaveSuccess}</p>}
            </div>
            <div className="profile-header-actions">
              <button
                type="button"
                className="profile-action profile-action--ghost"
                onClick={() => {
                  setEditingAccount((prev) => !prev);
                  setAccountSaveError("");
                  setAccountSaveSuccess("");
                }}
              >
                {editingAccount ? "Cancel" : "Edit account"}
              </button>
              <button type="button" className="profile-action profile-action--logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>

          {editingAccount && (
            <form className="profile-form profile-form--account" onSubmit={handleAccountSave}>
              <label className="profile-field">
                <span>Display name</span>
                <input
                  value={accountForm.username}
                  onChange={(e) => handleAccountFormChange("username", e.target.value)}
                  placeholder="Your display name"
                  autoComplete="nickname"
                />
              </label>

              <label className="profile-field">
                <span>Profile picture URL</span>
                <input
                  value={accountForm.avatarUrl}
                  onChange={(e) => handleAccountFormChange("avatarUrl", e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="profile-field">
                <span>Or upload image</span>
                <input type="file" accept="image/*" onChange={handleAvatarFileChange} />
              </label>

              {accountSaveError && <p className="profile-error">{accountSaveError}</p>}

              <button type="submit" className="profile-action" disabled={savingAccount}>
                {savingAccount ? "Saving..." : "Save changes"}
              </button>
            </form>
          )}
        </div>

        <div className="profile-grid">
          <article className="profile-panel">
            <div className="profile-panel-head">
              <span className="profile-panel-icon">Tickets</span>
              <h3 className="profile-panel-title">My tickets</h3>
            </div>
            {accountLoading && <p className="profile-meta">Loading your tickets...</p>}
            {!accountLoading && accountError && <p className="profile-error">{accountError}</p>}
            {!accountLoading && !accountError && tickets.length === 0 && (
              <p className="profile-meta">No tickets yet. Buy tickets and they will appear here.</p>
            )}
            {!accountLoading && !accountError && tickets.length > 0 && (
              <div className="profile-ticket-list">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className={`profile-ticket ${ticket.isActive ? "is-active" : "is-past"}`}>
                    <div className="profile-ticket-main">
                      <p className="profile-ticket-title">{ticket.movieTitle}</p>
                      <p className="profile-ticket-meta">
                        {formatDateTime(ticket.date, ticket.time)} - {ticket.cinemaName} - Hall {ticket.hallNumber}
                      </p>
                      <p className="profile-ticket-meta">Seat {ticket.seatNumber}</p>
                    </div>
                    <span className="profile-ticket-status">{ticket.isActive ? "Active" : "Used"}</span>
                  </article>
                ))}
              </div>
            )}
            <button type="button" className="profile-action profile-action--subtle" onClick={() => navigate("/movies")}>
              Buy tickets
            </button>
          </article>

          <article className="profile-panel profile-panel--qr">
            <div className="profile-panel-head">
              <span className="profile-panel-icon">QR Code</span>
              <h3 className="profile-panel-title">Active tickets QR code</h3>
            </div>
            {activeTickets.length === 0 ? (
              <p className="profile-meta">No active tickets right now.</p>
            ) : (
              <>
                <p className="profile-meta">One unique code with all active tickets saved for fast entrance.</p>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR with active tickets" className="profile-qr" />
                ) : (
                  <p className="profile-meta">Generating QR code...</p>
                )}
                {passPdfUrl && (
                  <a className="profile-pass-link" href={passPdfUrl} target="_blank" rel="noreferrer">
                    Open tickets PDF
                  </a>
                )}
                <p className="profile-meta">{activeTickets.length} active ticket(s)</p>
              </>
            )}
          </article>

          <article className="profile-panel">
            <div className="profile-panel-head">
              <span className="profile-panel-icon">Transactions</span>
              <h3 className="profile-panel-title">Latest transactions</h3>
            </div>
            {accountLoading && <p className="profile-meta">Loading transactions...</p>}
            {!accountLoading && transactions.length === 0 && (
              <p className="profile-meta">No transactions yet.</p>
            )}
            {!accountLoading && transactions.length > 0 && (
              <div className="profile-transaction-list">
                {transactionPreview.map((tx) => (
                  <article key={tx.paymentId} className="profile-transaction-item">
                    <div>
                      <p className="profile-transaction-id">{tx.paymentId}</p>
                      <p className="profile-transaction-meta">{tx.provider} {tx.method ? `- ${tx.method}` : ""}</p>
                    </div>
                    <div className="profile-transaction-amount">
                      <p>{formatMoney(tx.amount, tx.currency)}</p>
                      <p className="profile-transaction-status">{tx.status}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="profile">
      <div className="profile-card">
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

            <p className="profile-switch-hint">
              Does not have an account?{" "}
              <button type="button" className="profile-switch-link" onClick={goToRegister}>
                Register!
              </button>
            </p>
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

            <p className="profile-switch-hint">
              Already have an account?{" "}
              <button type="button" className="profile-switch-link" onClick={goToLogin}>
                Log in!
              </button>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
