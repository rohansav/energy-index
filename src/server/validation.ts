import { z } from "zod";
import type { Product, Review } from "@/domain/types";

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "Expected HTTPS URL");
export const productSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brand: z.string().min(1),
  name: z.string().min(1),
  line: z.string().min(1),
  source: httpsUrl,
  imageSource: httpsUrl,
  status: z.enum(["listed", "limited", "uncertain", "retiring"]),
  checkedAt: z.string(),
  image: z.string().regex(/^assets\/drinks\/[a-z0-9-]+\.webp$/),
  imageWidth: z.number().int().positive().max(320),
  imageHeight: z.number().int().positive().max(480),
  catalogueNotes: z.string(),
  catalogueDescription: z.string(),
  aliases: z.array(z.string()),
  statusNote: z.string().optional(),
  statusSource: httpsUrl.optional(),
  legacyAlertness: z
    .object({
      effect: z.string(),
      context: z.string().optional(),
      jitters: z.string().optional(),
    })
    .nullable()
    .optional(),
});
export const catalogueSchema = z.object({
  brands: z.array(
    z.object({
      name: z.string().min(1),
      color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
      text: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    }),
  ),
  products: z.array(productSchema),
});
/** Decap select widgets persist strings; normalize only at the storage boundary. */
function rating(min: number, max: number) {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return null;
      if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value))
        return Number(value);
      return value;
    },
    z
      .number()
      .min(min)
      .max(max)
      .refine(
        (value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-8,
        "Use increments of 0.1",
      )
      .nullable(),
  );
}
export const reviewSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  score: rating(1, 10),
  sweetness: rating(0, 5),
  tartness: rating(0, 5),
  dryness: rating(0, 5),
  energy: rating(0, 5),
  notes: z
    .string()
    .max(300)
    .optional()
    .default("")
    .transform((value) => value.trim()),
  body: z
    .string()
    .max(20000)
    .optional()
    .default("")
    .transform((value) => value.trim()),
});
export function parseReview(raw: unknown, product: Product): Review {
  const review = reviewSchema.parse(raw);
  if (
    review.id !== product.id ||
    review.name !== product.name ||
    review.brand !== product.brand
  ) {
    throw new Error(`Review identity does not match product: ${product.id}`);
  }
  return review;
}
