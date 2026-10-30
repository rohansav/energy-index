import type { Drink } from "@/domain/types";
import { ratingFields } from "@/domain/ratings";

export function SensoryProfile({ drink }: { drink: Drink }) {
  return (
    <>
      <div className="sensory-profile" aria-label="Sensory intensity profile">
        {ratingFields.slice(1, 4).map((field) => {
          const value = drink.review[field.key];
          return (
            <div className="sensory-metric" key={field.key}>
              <span>{field.label}</span>
              <strong>
                {value === null ? (
                  "Not rated"
                ) : (
                  <>
                    {value.toFixed(1)} <small>/ 5</small>
                  </>
                )}
              </strong>
              <div className="intensity-track" aria-hidden="true">
                <span style={{ width: `${((value ?? 0) / 5) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="profile-caption">Intensity, not quality · 0.0–5.0</p>
      <div className="alertness-note">
        <span>ENERGY · PERSONAL OBSERVATION</span>
        <p>
          {drink.review.energy === null
            ? "Not rated"
            : `${drink.review.energy.toFixed(1)} / 5`}
        </p>
        {drink.legacyAlertness && (
          <p className="alertness-context">
            {drink.legacyAlertness.effect} {drink.legacyAlertness.context}
            {drink.legacyAlertness.jitters &&
              ` Jitteriness: ${drink.legacyAlertness.jitters}`}
          </p>
        )}
      </div>
    </>
  );
}
