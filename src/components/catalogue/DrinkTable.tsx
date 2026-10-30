import Link from "next/link";
import { drinkPath } from "@/lib/paths";
import { CommunityCompact } from "@/components/community/CommunityCompact";
import type { Drink } from "@/domain/types";
import { availabilityLabels } from "@/domain/catalogue";
import { ProductPhoto } from "@/components/drinks/ProductPhoto";
import { Score } from "@/components/ratings/Score";
export function DrinkTable({ drinks }: { drinks: Drink[] }) {
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
                <Link href={drinkPath(drink.id)}>{drink.name} ↗</Link>
                <CommunityCompact stats={drink.community} />
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
