/** Persisted identities remain stable when storage moves from Git to a database. */
export type Availability = "listed" | "limited" | "uncertain" | "retiring";
export type RatingKey =
  "score" | "sweetness" | "tartness" | "dryness" | "energy";
export type Rating = number | null;

export interface Brand {
  name: string;
  color: string;
  text: string;
}
export interface Product {
  id: string;
  brand: string;
  name: string;
  line: string;
  source: string;
  imageSource: string;
  status: Availability;
  checkedAt: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  catalogueNotes: string;
  catalogueDescription: string;
  aliases: string[];
  statusNote?: string;
  statusSource?: string;
  legacyAlertness?: {
    effect: string;
    context?: string;
    jitters?: string;
  } | null;
}
export interface Review {
  id: string;
  brand: string;
  name: string;
  score: Rating;
  sweetness: Rating;
  /** Storage key retained for backwards compatibility with published reviews. */
  tartness: Rating;
  dryness: Rating;
  energy: Rating;
  notes: string;
  body: string;
}
export interface Drink extends Product {
  review: Review;
}
export interface Catalogue {
  brands: Brand[];
  drinks: Drink[];
}
