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

            <Link href="/">
              Home
            </Link>

            <Link href="/find-scheme">
              Find Schemes
            </Link>

            <Link href="/how-it-works">
              How It Works
            </Link>

            <Link href="/about">
              About
            </Link>

            <Link href="/help">
              Help & Support
            </Link>

            <span className="lang">
              English ▾
            </span>

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

            <b>
              Government of India
            </b>

            <small>
              Ministry of Social Justice and Empowerment
            </small>

          </div>

        </div>

      </section>


      {/* ================= APPLICATION ================= */}

      <main className="section">

        <div className="container">

          <h1>
            Application
          </h1>


          <div className="card">

            <p>
              This prototype page is ready for integration of the
              application workflow.
            </p>

            <p className="muted">
              The next step can be connected to the backend/API when
              your team is ready.
            </p>

          </div>


          <br />


          <Link
            className="btn"
            href="/"
          >
            Back to Home
          </Link>

        </div>

      </main>

    </>
  );
}