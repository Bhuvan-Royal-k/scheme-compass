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
            <h1>{t("nav_help")}</h1>
            <p style={{ color: "#64748b", lineHeight: 1.8 }}>
              Need assistance finding schemes or locating nearby partner branches? Use our guided discovery flow to select your requirement, verify scheme details, and get directions to the nearest channel partner on Mappls.
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
