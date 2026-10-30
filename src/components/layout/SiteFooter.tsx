import { editorUrl } from "@/lib/paths";
export function SiteFooter() {
  return (
    <footer>
      <span>
        Energy index / <span className="muted">Working title</span>
      </span>
      <span>US flavor catalogue · Personal ratings</span>
      <a href={editorUrl}>Editor ↗</a>
    </footer>
  );
}
