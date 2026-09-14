"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/Navbar";

export default function Calculator() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(5);

  const r = rate / 1200;
  const n = years * 12;

  const emi =
    r === 0
      ? Math.round(amount / n)
      : Math.round(
          (amount * r * Math.pow(1 + r, n)) /
            (Math.pow(1 + r, n) - 1)
        );

  return (
    <>
      <Header />

      <main className="formwrap">
        <div className="formbox">
          <h1>Estimated EMI Calculator</h1>

          <p className="muted">
            For planning only. Actual terms depend on scheme sanction.
          </p>

          <div className="field">
            <label>Loan amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(+e.target.value)}
            />
          </div>

          <div className="field">
            <label>Interest rate (% p.a.)</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(+e.target.value)}
            />
          </div>

          <div className="field">
            <label>Tenure (years)</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(+e.target.value)}
            />
          </div>

          <div className="result">
            <span className="muted">Estimated monthly EMI</span>
            <h2>₹{emi.toLocaleString("en-IN")}</h2>
          </div>

          <Link className="btn" href="/partners">
            Find Eligible Partners →
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}