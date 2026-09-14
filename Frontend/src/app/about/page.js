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
            <h1>{t("nav_about")}</h1>
            <p style={{ color: "#64748b", lineHeight: 1.8 }}>
              Scheme Compass is an AI-powered government scheme discovery portal. It uses Convex Cloud database storage, Sarvam NLU for multilingual natural intent understanding, a deterministic rule engine for eligibility evaluation, and Mappls REST API for discovering nearby physical channel partner branches.
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
