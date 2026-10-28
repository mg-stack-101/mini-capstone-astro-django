import { useEffect, useState, type SubmitEvent } from "react";
import { getCsrfToken, postForm, resetClientRequests } from "../lib/api";
import type { SessionUser } from "../lib/types";
import Icon from "./Icon";
import { Brand, buttonClass, Feedback, Field, inputClass, Spinner } from "./ui";

export interface LoginFormProps {
  endpoint?: string;
  csrfToken?: string;
  successHref?: string;
  demo?: boolean;
}
export default function LoginForm({
  endpoint = "/api/login/",
  csrfToken,
  successHref,
  demo = false,
}: LoginFormProps) {
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("barangayUsername");
      if (saved) {
        setUsername(saved);
        setRemember(true);
      }
    } catch {
      /* Login does not depend on storage. */
    }
    // Warm up CSRF while the person fills out the form, never block first paint.
    if (!demo) void getCsrfToken(csrfToken).catch(() => {});
  }, [demo, csrfToken]);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNote("");
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (demo) {
      setNote(
        "This is a template preview. Connect your login endpoint to sign in.",
      );
      return;
    }
    const data = new FormData(event.currentTarget);
    data.set("username", username.trim());
    setBusy(true);
    try {
      const result = await postForm<{ user: SessionUser }>(
        endpoint,
        data,
        csrfToken,
      );
      if (!result.user || !["admin", "resident"].includes(result.user.role))
        throw new Error("We could not verify your account. Please try again.");
      try {
        if (remember) localStorage.setItem("barangayUsername", username.trim());
        else localStorage.removeItem("barangayUsername");
      } catch {
        /* Preference is optional. */
      }
      resetClientRequests();
      window.location.assign(
        successHref ||
          (result.user.role === "admin"
            ? "/admin_dashboard/"
            : "/resident_dashboard/"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <header className="public-header">
        <Brand />
        <a
          href="/"
          className="text-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            minHeight: 44,
          }}
        >
          <Icon name="arrowLeft" size={15} />
          Back to home
        </a>
      </header>
      <main id="main" className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">One community. A shared purpose.</p>
          <h2>
            A little conversation.
            <br />A better community.
          </h2>
          <p>
            Your concerns deserve to be heard. Sign in to report an issue or
            follow the progress of your existing reports.
          </p>
          <div className="auth-points">
            <div>
              <Icon name="checkCircle" size={17} />
              Submit a concern from any device
            </div>
            <div>
              <Icon name="checkCircle" size={17} />
              Follow your complaint’s status
            </div>
            <div>
              <Icon name="checkCircle" size={17} />
              Connect with your barangay team
            </div>
          </div>
        </section>
        <section className="login-panel" aria-labelledby="login-title">
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Your community account
          </p>
          <h1 id="login-title">Welcome back.</h1>
          <p className="login-description">
            Sign in to your Barangay Complaint account.
          </p>
          <form onSubmit={submit} className="form-stack" aria-busy={busy}>
            {csrfToken && (
              <input
                type="hidden"
                name="csrfmiddlewaretoken"
                value={csrfToken}
              />
            )}
            {error && <Feedback error>{error}</Feedback>}
            {note && <Feedback>{note}</Feedback>}
            <Field id="username" label="Username">
              <input
                id="username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={150}
                value={username}
                disabled={busy}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={inputClass}
              />
            </Field>
            <Field id="password" label="Password">
              <div className="password-wrap">
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  placeholder="Enter your password"
                  className={inputClass}
                />
                <button
                  type="button"
                  className="password-button"
                  aria-controls="password"
                  aria-pressed={visible}
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  <Icon name={visible ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
            </Field>
            <div className="login-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="remember_me"
                  checked={remember}
                  disabled={busy}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-link"
                style={{
                  fontSize: 11,
                  background: "none",
                  border: 0,
                  minHeight: 32,
                }}
                onClick={() =>
                  setNote(
                    "Please contact your system administrator to reset your password.",
                  )
                }
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={busy}
              className={buttonClass}
              style={{ width: "100%" }}
            >
              {busy ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <Icon name="arrow" size={16} />
                </>
              )}
            </button>
          </form>
          {demo && (
            <aside className="demo-note">
              Template preview · no authentication connected.
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <a href="/admin_dashboard/" className="text-link">
                  Preview admin
                </a>
                <a href="/resident_dashboard/" className="text-link">
                  Preview resident
                </a>
              </div>
            </aside>
          )}
          <p className="login-help">
            <Icon
              name="lock"
              size={13}
              style={{
                display: "inline",
                verticalAlign: "-2px",
                marginRight: 5,
              }}
            />
            Your account. Your private space.
          </p>
        </section>
      </main>
      <footer className="public-footer">
        <span>Barangay Complaint Monitoring System</span>
        <span>Together, we can make things better.</span>
      </footer>
    </div>
  );
}
