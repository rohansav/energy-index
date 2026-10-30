import { catalogueRepository } from "@/server/catalogue-repository";
import { Editor } from "@/components/editor/Editor";
export const metadata = {
  title: "Review editor",
  robots: { index: false, follow: false },
};
export default async function EditorPage() {
  const { drinks } = await catalogueRepository.getCatalogue();
  const products = drinks.map(
    ({ id, brand, name, image, imageWidth, imageHeight }) => ({
      id,
      brand,
      name,
      image,
      imageWidth,
      imageHeight,
    }),
  );
  return <Editor products={products} />;
}
