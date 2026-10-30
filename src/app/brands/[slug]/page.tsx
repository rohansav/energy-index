import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalogueRepository } from "@/server/catalogue-repository";
import { brandSlug } from "@/domain/catalogue";
import { BrandView } from "@/components/catalogue/BrandView";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export async function generateStaticParams() {
  const { brands } = await catalogueRepository.getCatalogue();
  return brands.map((brand) => ({ slug: brandSlug(brand.name) }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params,
    { brands } = await catalogueRepository.getCatalogue();
  return {
    title: `${brands.find((brand) => brandSlug(brand.name) === slug)?.name || "Brand"} flavors & reviews`,
  };
}
export default async function BrandPage({ params }: Props) {
  const { slug } = await params,
    { brands, drinks } = await catalogueRepository.getCatalogue();
  const brand = brands.find((item) => brandSlug(item.name) === slug);
  if (!brand) notFound();
  return (
    <BrandView
      brand={brand}
      brands={brands}
      drinks={drinks.filter((drink) => drink.brand === brand.name)}
    />
  );
}
