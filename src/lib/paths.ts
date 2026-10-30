import { brandSlug } from "@/domain/catalogue";

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/energy-index";
export const assetPath = (relative: string): string =>
  `${basePath}/${relative.replace(/^\//, "")}`;
export const brandPath = (name: string): string =>
  `/brands/${brandSlug(name)}/`;
export const drinkPath = (id: string): string => `/drinks/${id}/`;
export const editorUrl = `${basePath}/editor/`;
