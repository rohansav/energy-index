"use client";
import Link from "next/link";
import { useState } from "react";
import { SessionControl } from "@/components/auth/SessionControl";
import { Modal } from "@/components/ui/Modal";
import { ScoringGuide } from "@/components/ratings/ScoringGuide";

export function SiteHeader() {
  const [guideOpen, setGuideOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <Link className="wordmark" href="/">
          Energy index<span> / </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">Catalogue</Link>
          <button type="button" onClick={() => setGuideOpen(true)}>
            Scoring guide <span>↗</span>
          </button>
        </nav>
        <div className="header-account">
          <span className="header-note">A PERSONAL DRINK LOG</span>
          <SessionControl />
        </div>
      </header>
      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        titleId="guide-title"
      >
        <ScoringGuide titleId="guide-title" />
      </Modal>
    </>
  );
}
