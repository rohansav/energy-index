import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalogueRepository } from "@/server/catalogue-repository";
import { brandPath } from "@/lib/paths";
import { DrinkDetail } from "@/components/drinks/DrinkDetail";

type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;
export async function generateStaticParams() {
  const { drinks } = await catalogueRepository.getCatalogue();
  return drinks.map((drink) => ({ id: drink.id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params,
    { drinks } = await catalogueRepository.getCatalogue();
  const drink = drinks.find((item) => item.id === id);
  return { title: drink ? `${drink.brand} ${drink.name}` : "Drink not found" };
}
export default async function DrinkPage({ params }: Props) {
  const { id } = await params,
    { drinks } = await catalogueRepository.getCatalogue();
  const drink = drinks.find((item) => item.id === id);
  if (!drink) notFound();
  return (
    <div className="drink-page">
      <Link className="back-link" href={brandPath(drink.brand)}>
        ← All {drink.brand} flavors
      </Link>
      <DrinkDetail drink={drink} page titleId="drink-title" />
    </div>
  );
}
