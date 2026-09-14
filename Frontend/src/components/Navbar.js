"use client";

import Image from "next/image";
import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";

export function Header() {
  const { t } = useLanguage();

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
                <span className="light">{t("brand_title")}</span>
                <span className="accent">{t("brand_accent")}</span>
              </span>

              <span className="brandsub">
                {t("brand_sub")}
              </span>
            </span>
          </Link>

          <nav className="links" style={{ alignItems: "center" }}>
            <Link href="/">{t("nav_home")}</Link>
            <Link href="/find-scheme">{t("nav_find_schemes")}</Link>
            <Link href="/how-it-works">{t("nav_how_it_works")}</Link>
            <Link href="/about">{t("nav_about")}</Link>
            <Link href="/help">{t("nav_help")}</Link>
            <LanguageSelector />
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
            <b>{t("gov_title")}</b>
            <small>{t("gov_ministry")}</small>
          </div>
        </div>
      </section>
    </>
  );
}

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footerin">
        <b>{t("footer_motto")}</b>
        <small>{t("footer_copy")}</small>
      </div>
    </footer>
  );
}
