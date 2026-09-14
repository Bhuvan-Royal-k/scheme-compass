"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";

export default function FindScheme() {
  const { t } = useLanguage();

  const items = [
    {
      title: t("need_biz_title"),
      desc: t("need_biz_desc"),
      href: "/business",
      icon: <BusinessIcon />,
    },
    {
      title: t("need_edu_title"),
      desc: t("need_edu_desc"),
      href: "/business?type=Education",
      icon: <EducationIcon />,
    },
    {
      title: t("need_growth_title"),
      desc: t("need_growth_desc"),
      href: "/business?type=Expand+Business",
      icon: <GrowthIcon />,
    },
    {
      title: t("need_money_title"),
      desc: t("need_money_desc"),
      href: "/business?type=Other",
      icon: <MoneyIcon />,
    },
  ];

  return (
    <>
      <Header />

      <main className="page formhero">
        <div className="container">
          <div className="crumb">
            <Link href="/">{t("nav_home")}</Link> / {t("nav_find_schemes")}
          </div>

          <div className="center">
            <div className="eyebrow">{t("step1_eyebrow")}</div>

            <h1 style={{ color: "#0d2b55", fontSize: 38 }}>
              {t("step1_title")}
            </h1>

            <p className="sub">{t("step1_sub")}</p>
          </div>

          <div className="choicegrid">
            {items.map((item) => (
              <Link
                className="choice"
                href={item.href}
                key={item.title}
                style={{ backgroundColor: "#eef5ff" }}
              >
                <div
                  className="icon"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#1877F2",
                    width: "52px",
                    height: "52px",
                    borderRadius: "12px",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  {item.icon}
                </div>

                <h2 style={{ color: "#0d2b55", fontSize: 22 }}>
                  {item.title}
                </h2>

                <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {item.desc}
                </p>

                <b style={{ color: "#1877F2" }}>
                  {t("continue")} →
                </b>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function BusinessIcon() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
      <path d="M7 20h34v22H7z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M5 20l5-9h28l5 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M17 20v22M31 20v22M17 30h14" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function EducationIcon() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
      <path d="M5 17l19-9 19 9-19 9z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 22v10c7 6 17 6 24 0V22" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M43 18v12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GrowthIcon() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
      <path d="M7 39h34" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 34V25M19 34V20M28 34V14M37 34V9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 9h9v9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 9L24 22l-7-5-8 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
      <circle cx="24" cy="15" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M12 39c2-8 22-8 24 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 11v8M21 14h5M21 18h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}