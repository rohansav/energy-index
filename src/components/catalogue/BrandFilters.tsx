import type { CatalogueFilters } from "@/domain/catalogue";
import { availabilityLabels } from "@/domain/catalogue";
import type { Availability } from "@/domain/types";
interface Props {
  filters: CatalogueFilters;
  lines: string[];
  onChange: (filters: CatalogueFilters) => void;
}
export function BrandFilters({ filters, lines, onChange }: Props) {
  return (
    <div className="brand-filters">
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          aria-label="Search flavors"
          placeholder="Find a flavor…"
          value={filters.query || ""}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
        />
      </label>
      <label>
        <span className="sr-only">Product line</span>
        <select
          value={filters.line || "all"}
          onChange={(event) =>
            onChange({ ...filters, line: event.target.value })
          }
        >
          <option value="all">All product lines</option>
          {lines.map((line) => (
            <option key={line}>{line}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Availability</span>
        <select
          value={filters.availability || "all"}
          onChange={(event) =>
            onChange({
              ...filters,
              availability: event.target.value as Availability | "all",
            })
          }
        >
          <option value="all">All availability</option>
          {Object.entries(availabilityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Review status</span>
        <select
          value={filters.reviewStatus || "all"}
          onChange={(event) =>
            onChange({
              ...filters,
              reviewStatus: event.target
                .value as CatalogueFilters["reviewStatus"],
            })
          }
        >
          <option value="all">All review statuses</option>
          <option value="unrated">Unrated</option>
          <option value="rated">Rated</option>
        </select>
      </label>
    </div>
  );
}
