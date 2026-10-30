import { catalogueRepository } from "@/server/catalogue-repository";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
export default async function CataloguePage() {
  return <CatalogueView {...await catalogueRepository.getCatalogue()} />;
}
