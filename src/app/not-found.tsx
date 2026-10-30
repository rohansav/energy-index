import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-heading">
      <div>
        <h1>Not found.</h1>
        <p>
          This drink or brand is not in the catalogue.{" "}
          <Link href="/">Browse all brands →</Link>
        </p>
      </div>
    </div>
  );
}
