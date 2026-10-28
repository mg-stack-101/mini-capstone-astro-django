import Icon from "./Icon";
import { Brand, buttonClass } from "./ui";

export default function HomePage() {
  return (
    <div>
      <header className="public-header">
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <span className="public-header-note">Built around our community</span>
          <a href="/login/" className="button button-secondary">
            Sign in
            <Icon name="arrow" size={15} />
          </a>
        </div>
      </header>
      <main id="main" className="public-main">
        <div className="hero-grid">
          <section>
            <p className="eyebrow">Your voice makes a difference</p>
            <h1 className="hero-title">
              A better barangay
              <br />
              starts with
              <br />
              <em>your voice.</em>
            </h1>
            <p className="hero-description">
              Share a concern, follow its progress, and help build a safer, more
              connected community. One conversation at a time.
            </p>
            <div className="hero-actions">
              <a href="/login/" className={buttonClass}>
                Get started
                <Icon name="arrow" size={16} />
              </a>
              <span className="hero-caption">
                <Icon name="shield" size={14} />A private space for your
                concerns
              </span>
            </div>
          </section>
          <section className="process-panel" aria-labelledby="process-title">
            <div className="process-illustration" aria-hidden="true">
              <svg width="208" height="116" viewBox="0 0 208 116" fill="none">
                <path d="M16 107h176" stroke="#aac6ad" />
                <rect
                  x="48"
                  y="38"
                  width="112"
                  height="64"
                  rx="3"
                  fill="#e0ecdf"
                  stroke="#93b399"
                />
                <path
                  d="m40 38 64-30 64 30H40Z"
                  fill="#d0e2cf"
                  stroke="#7e9e84"
                />
                <path
                  d="M65 48v42m25-42v42m28-42v42m25-42v42"
                  stroke="#6f9577"
                  strokeWidth="6"
                />
                <path
                  d="M44 101h120M104 8V1m0 0h22l-5 6h-17"
                  stroke="#7e9e84"
                  strokeWidth="2"
                />
                <circle
                  cx="178"
                  cy="73"
                  r="17"
                  fill="#f7fbf4"
                  stroke="#bdd2bc"
                />
                <path
                  d="m170 73 5 5 10-11"
                  stroke="#3f7957"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 99V79m-5 8 5-8 5 8m154 12V90"
                  stroke="#9cb99f"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="eyebrow">Simple steps. Real progress.</p>
            <h2
              id="process-title"
              className="process-title"
              style={{ marginTop: 8 }}
            >
              Every concern matters.
            </h2>
            {[
              ["Share a concern", "Tell us what happened and where."],
              ["Let us review it", "Your barangay team looks into the report."],
              ["Follow the progress", "Check the status from your account."],
            ].map(([title, body], i) => (
              <div className="process-step" key={title}>
                <span className="step-number">{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </section>
        </div>
        <section className="feature-row" aria-label="Community services">
          <div className="feature-item">
            <Icon name="message" />
            <div>
              <h3>A place to be heard</h3>
              <p>Report everyday concerns in your barangay.</p>
            </div>
          </div>
          <div className="feature-item">
            <Icon name="clipboard" />
            <div>
              <h3>Clarity at every step</h3>
              <p>See when your report is being reviewed or resolved.</p>
            </div>
          </div>
          <div className="feature-item">
            <Icon name="users" />
            <div>
              <h3>Better, together</h3>
              <p>Small actions help create a stronger community.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <span>Barangay Complaint Monitoring System</span>
        <span>For the community. With the community.</span>
      </footer>
    </div>
  );
}
