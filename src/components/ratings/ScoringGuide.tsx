import { scoreBands, scoreColor } from "@/domain/ratings";

export function ScoringGuide({ titleId }: { titleId: string }) {
  return (
    <>
      <div className="eyebrow">SCORING GUIDE</div>
      <h2 id={titleId}>One verdict. A fuller profile.</h2>
      <p>
        <strong>Overall</strong> is a subjective verdict on the drink as a
        whole: taste, informed by sweetness, sourness, dryness, and your
        personal experience. It is not an average or a weighted formula. Energy
        records your perceived boost separately; it is not added to Overall by a
        formula.
      </p>
      <h3>Overall · 1.0–10.0</h3>
      <p>
        Scored in 0.1 increments. Higher means more enjoyable. Rankings use
        Overall; unrated drinks follow alphabetically.
      </p>
      {scoreBands.map((band) => (
        <div className="scale-row" key={band.min}>
          <span
            className="score-guide-value"
            style={{ color: scoreColor(band.min) }}
          >
            {band.range}
          </span>
          <span>{band.label}</span>
        </div>
      ))}
      <h3>The sensory profile · 0.0–5.0</h3>
      <p>
        These measure intensity, not quality: more is not automatically better.
        An unrecorded value is “Not rated,” never zero.
      </p>
      <dl className="guide-fields">
        <dt>Sweetness</dt>
        <dd>
          How sweet it tastes, regardless of sugar content. 0.0 = none; 5.0 =
          extremely sweet.
        </dd>
        <dt>Sourness</dt>
        <dd>How sour or tangy it tastes. 0.0 = none; 5.0 = intensely sour.</dd>
        <dt>Dryness</dt>
        <dd>
          The mouth-drying or puckering sensation. 0.0 = none; 5.0 = strongly
          mouth-drying. This describes a sensation, not measured tannin content
          or bitterness.
        </dd>
      </dl>
      <p>
        Use 1.0 for slight, 2.5 for moderate, and 4.0 for strong intensity as
        working anchors. Tenths allow finer distinctions; they do not imply
        laboratory precision.
      </p>
      <h3>Energy · 0.0–5.0</h3>
      <p>
        Your perceived boost after drinking: 0.0 = no noticeable lift, 2.5 =
        moderate lift, 5.0 = very strong lift. Use 0.1 increments. Leave
        unrecorded observations blank. This is subjective and can vary with
        sleep, tolerance, and prior caffeine.
      </p>
      <p className="sample-note">
        Our own rubric, informed by professional sensory practice: separating
        description from judgment in the{" "}
        <a
          href="https://sca.coffee/value-assessment"
          target="_blank"
          rel="noopener noreferrer"
        >
          SCA Coffee Value Assessment
        </a>
        , and sweetness, sourness, and bitterness in{" "}
        <a
          href="https://www.ars.usda.gov/research/project/?accnNo=438353&fy=2023"
          target="_blank"
          rel="noopener noreferrer"
        >
          USDA juice research
        </a>
        .
      </p>
      <p className="sample-note">
        Only personal ratings determine rankings. Drinks without an Overall
        rating are marked Unrated; unrecorded sensory values stay blank until a
        tasting is entered.
      </p>
    </>
  );
}
