import { assetPath } from "@/lib/paths";

export function BeachHero() {
  return (
    <section className="beach-hero" aria-labelledby="catalogue-title">
      <div className="beach-scenery" aria-hidden="true">
        <img
          src={assetPath("assets/backgrounds/sunset-energy-beach-v1.webp")}
          alt=""
          fetchPriority="high"
          width={1536}
          height={1024}
        />
      </div>
      <div className="beach-title-panel">
        <span className="eyebrow">THE ENERGY DRINK INDEX</span>
        <h1 id="catalogue-title">
          Energy,
          <br />
          indexed.
        </h1>
        <p>Flavors, ratings &amp; tasting notes.</p>
        <a href="#browse-catalogue">
          Explore the catalogue <span aria-hidden="true">↓</span>
        </a>
      </div>
      <span className="beach-scene-label" aria-hidden="true">
        SUNSET / ON ICE
      </span>
    </section>
  );
}
