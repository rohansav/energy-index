import type { Drink } from "@/domain/types";
import { availabilityLabels } from "@/domain/catalogue";
import { ProductPhoto } from "@/components/drinks/ProductPhoto";
import { Score } from "@/components/ratings/Score";
export function DrinkTable({
  drinks,
  onSelect,
}: {
  drinks: Drink[];
  onSelect: (drink: Drink) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>CAN</th>
            <th>FLAVOR</th>
            <th>BRAND</th>
            <th className="flavor-cell">AVAILABILITY</th>
            <th>OVERALL</th>
          </tr>
        </thead>
        <tbody>
          {drinks.map((drink) => (
            <tr key={drink.id}>
              <td>
                <ProductPhoto product={drink} className="table-product" />
              </td>
              <td>
                <button type="button" onClick={() => onSelect(drink)}>
                  {drink.name} ↗
                </button>
              </td>
              <td>{drink.brand}</td>
              <td className="flavor-cell">
                {availabilityLabels[drink.status]}
              </td>
              <td>
                <Score value={drink.review.score} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
