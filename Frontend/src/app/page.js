"use client";

import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <Header />

      <main>
        {/* ================= HERO ================= */}
        <section className="hero">
          <div className="heroBg">
            <Image
              src="/hero.jpg"
              alt="Citizens accessing government schemes"
              fill
              priority
              sizes="100vw"
            />
          </div>

          <div className="heroShade"></div>

          <div className="container heroContent">
            <div className="heroText">
              <div className="eyebrow">{t("hero_eyebrow")}</div>

              <h1>
                {t("hero_title_1")}
                <br />
                {t("hero_title_2")}
                <br />
                {t("hero_title_3")}
              </h1>

              <p>{t("hero_desc")}</p>

              <Link className="btn" href="/find-scheme">
                {t("hero_btn")} <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= NEED SECTION ================= */}
        <section className="section needsSection">
          <div className="container">
            <h2>{t("need_heading")}</h2>
            <p className="sub">{t("need_sub")}</p>

            <div className="cards">
              <NeedCard
                href="/business"
                icon={<BusinessIcon />}
                title={t("need_biz_title")}
                text={t("need_biz_desc")}
                exploreText={t("explore")}
              />

              <NeedCard
                href="/business?type=Education"
                icon={<EducationIcon />}
                title={t("need_edu_title")}
                text={t("need_edu_desc")}
                exploreText={t("explore")}
              />

              <NeedCard
                href="/business?type=Expand+Business"
                icon={<GrowthIcon />}
                title={t("need_growth_title")}
                text={t("need_growth_desc")}
                exploreText={t("explore")}
              />

              <NeedCard
                href="/business?type=Other"
                icon={<MoneyIcon />}
                title={t("need_money_title")}
                text={t("need_money_desc")}
                exploreText={t("explore")}
              />
            </div>
          </div>
        </section>

        {/* ================= TRUST SECTION ================= */}
        <section className="trust">
          <div className="container trustgrid">
            <TrustItem
              icon={<CheckIcon />}
              title={t("trust_gov_title")}
              text={t("trust_gov_desc")}
            />

            <TrustItem
              icon={<LockIcon />}
              title={t("trust_safe_title")}
              text={t("trust_safe_desc")}
            />

            <TrustItem
              icon={<PeopleIcon />}
              title={t("trust_partners_title")}
              text={t("trust_partners_desc")}
            />

            <TrustItem
              icon={<LocationIcon />}
              title={t("trust_coverage_title")}
              text={t("trust_coverage_desc")}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function NeedCard({ href, icon, title, text, exploreText }) {
  return (
    <Link href={href} className="card">
      <div
        className={`icon ${
          title.includes("Education") || title.includes("Other") || title.includes("கல்வி") || title.includes("शिक्षा")
            ? "iconWhite"
            : "iconBlue"
        }`}
      >
        {icon}
      </div>

      <h3>{title}</h3>
      <p>{text}</p>
      <b className="explore">{exploreText} →</b>
    </Link>
  );
}

function TrustItem({ icon, title, text }) {
  return (
    <div className="trustItem">
      <div className="trustIcon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function BusinessIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M7 20h34v22H7z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M5 20l5-9h28l5 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M17 20v22M31 20v22M17 30h14" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function EducationIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M5 17l19-9 19 9-19 9z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 22v10c7 6 17 6 24 0V22" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M43 18v12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GrowthIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M7 39h34" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 34V25M19 34V20M28 34V14M37 34V9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 9h9v9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 9L24 22l-7-5-8 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="15" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M12 39c2-8 22-8 24 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 11v8M21 14h5M21 18h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 48 48">
      <path d="M24 5l16 6v11c0 10-6 17-16 21C14 39 8 32 8 22V11z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M16 24l5 5 11-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 48 48">
      <rect x="11" y="21" width="26" height="21" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M16 21v-6a8 8 0 0116 0v6" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="24" cy="31" r="2" fill="currentColor" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="15" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="10" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="38" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M13 38c1-8 7-12 11-12s10 4 11 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 48 48">
      <path d="M24 43s13-12 13-23a13 13 0 10-26 0c0 11 13 23 13 23z" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="24" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}