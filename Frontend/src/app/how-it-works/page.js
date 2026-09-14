"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";

export default function Page() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="formhero page">
        <div className="container">
          <div className="formbox">
            <h1>{t("nav_how_it_works")}</h1>
            <p style={{ color: "#64748b", lineHeight: 1.8 }}>
              Scheme Compass helps citizens discover relevant government schemes, understand indicative eligibility and financing, locate suitable Channel Partners and connect with nearby physical branches via Mappls integration.
            </p>
            <Link className="btn" href="/find-scheme">
              {t("hero_btn")} →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
