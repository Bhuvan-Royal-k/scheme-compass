import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="top">
        <div className="container nav">
          <Link className="brand" href="/">
            <span className="brandmark">
              <Image
                src="/logo-icon.png"
                alt="Scheme Compass"
                width={46}
                height={46}
                priority
              />
            </span>

            <span className="brandtext">
              <span className="brandtitle">
                <span className="light">Scheme</span>
                <span className="accent">Compass</span>
              </span>

              <span className="brandsub">
                Your Guide to the Right Government Scheme
              </span>
            </span>
          </Link>

          <nav className="links">
            <Link href="/">Home</Link>
            <Link href="/find-scheme">Find Schemes</Link>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/about">About Us</Link>
            <Link href="/help">Help &amp; Support</Link>
          </nav>
        </div>
      </header>

      {/* ================= GOVERNMENT BAR ================= */}
      <section className="gov">
        <div className="container govin">
          <div className="gov-emblem">
            <Image
              src="/Emblem.png"
              alt="State Emblem of India"
              width={52}
              height={62}
            />
          </div>

          <div>
            <b>Government of India</b>
            <small>Ministry of Social Justice and Empowerment</small>
          </div>
        </div>
      </section>

      {/* ================= FORM ================= */}
      <main className="formwrap">
        <div className="formbox">
          <span className="badge">SCHEME COMPASS</span>

          <h1>Financial Assistance</h1>

          <p className="muted">
            Answer a few simple questions so we can identify relevant schemes.
          </p>

          <div className="steps">
            <i className="step active" />
            <i className="step" />
            <i className="step" />
            <i className="step" />
          </div>

          <div className="field">
            <label>Purpose of financial support</label>
            <input placeholder="Enter details" />
          </div>

          <div className="field">
            <label>Estimated amount needed</label>
            <input
              type="number"
              placeholder="₹ Enter amount"
            />
          </div>

          <div className="field">
            <label>Annual family income</label>
            <input
              type="number"
              placeholder="₹ Enter annual income"
            />
          </div>

          <div className="field">
            <label>Social category</label>
            <select>
              <option>Scheduled Caste (SC)</option>
              <option>Other</option>
            </select>
          </div>

          <Link className="btn" href="/recommendations">
            Find Matching Schemes →
          </Link>
        </div>
      </main>
    </>
  );
}