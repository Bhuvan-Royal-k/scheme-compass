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
            <Link href="/about">About</Link>
            <Link href="/help">Help & Support</Link>
            <span className="lang">English ▾</span>
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


      {/* ================= EDUCATION FORM ================= */}

      <main className="formwrap">

        <div className="formbox">

          <span className="badge">
            SCHEME COMPASS
          </span>

          <h1>
            Education Assistance
          </h1>

          <p className="muted">
            Answer a few simple questions so we can identify relevant schemes.
          </p>


          {/* Progress Steps */}

          <div className="steps">
            <i className="step active" />
            <i className="step" />
            <i className="step" />
            <i className="step" />
          </div>


          {/* Course / Education Level */}

          <div className="field">
            <label>
              Course or education level
            </label>

            <input
              placeholder="Enter details"
            />
          </div>


          {/* Education Cost */}

          <div className="field">
            <label>
              Estimated education cost
            </label>

            <input
              type="number"
              placeholder="₹ Enter amount"
            />
          </div>


          {/* Family Income */}

          <div className="field">
            <label>
              Annual family income
            </label>

            <input
              type="number"
              placeholder="₹ Enter annual income"
            />
          </div>


          {/* Social Category */}

          <div className="field">
            <label>
              Social category
            </label>

            <select>
              <option>
                Scheduled Caste (SC)
              </option>

              <option>
                Other
              </option>
            </select>
          </div>


          {/* Find Matching Schemes */}

          <Link
            className="btn"
            href="/recommendations"
          >
            Find Matching Schemes →
          </Link>

        </div>

      </main>
    </>
  );
}