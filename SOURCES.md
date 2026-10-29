# Catalogue provenance

Snapshot checked October 29, 2026. Scope: ready-to-drink energy products in the six brands' US catalogues, including listed seasonal products. This is a source-backed catalogue snapshot, not a guarantee of every retailer-exclusive SKU or local inventory. The discontinued archive is deferred.

| Brand | Entries | Primary catalogue |
| --- | ---: | --- |
| Monster | 52 | https://www.monsterenergy.com/en-us/products/ |
| Celsius | 38 | https://www.celsius.com/products/ |
| Bloom | 10 | https://bloomnu.com/products/sparkling-energy |
| Red Bull | 20 | https://www.redbull.com/us-en/energydrink |
| Ghost | 24 | https://drinkghost.com/collections/energy |
| Alani | 17 | https://www.alaninu.com/collections/energy |

**Total: 161 flavors/formulations.**

## Inclusion and identity

- Keep separate product lines and regular/sugarfree formulations, even if their flavor names overlap.
- Exclude variety packs, duplicate can/pack sizes, powders, supplements, protein-only products, and caffeine-free hydration drinks.
- A flavor exclusive to a mini can is included. Larger/smaller packs of an already-listed flavor are not duplicated.
- Ghost's beverage site is linked from the official Ghost Lifestyle site. Monster's official drinkmonster.com mirror was used to retrieve its public catalogue when the main domain did not serve the request.
- Red Bull Sudachi Lime regular was verified on its individual US product page in addition to the catalogue's sugarfree listing.
All illustrative ratings and critiques have been removed; personal ratings are entered separately from researched product data.

## Availability

`listed` means listed by the brand, not verified in stock. `limited` denotes a seasonal or limited listing. Manufacturer catalogues sometimes retain older products:

- Monster Ultra Rosa, Ultra Red, Ultra Watermelon, Reserve Orange Dreamsicle, and Reserve Peaches n' Creme remain on the official list but conflict with discontinuation reporting. They are marked `uncertain`, with both sources linked.
- Monster Nitro Super Dry, Ultra Fantasy Ruby Red, Java Cafe Latte, Java Irish Creme, Juice Rio Punch, and Rehab Green Tea are marked `retiring`, based on September 28, 2026 reporting of planned US phase-outs before 2027: https://sporked.com/article/heres-all-12-monster-energy-drinks-being-discontinued-by-2027/
- Secondary historical reference for conflicting listings: https://www.historyoasis.com/post/discontinued-monster-energy-flavors

## Photos

Each entry records its official `source`, original `imageSource`, local WebP `image`, dimensions, and check date. Product photos are downloaded for reliable loading, resized with their aspect ratio preserved, and displayed with `object-fit: contain`. Uniform padding is trimmed where possible. For three Bloom flavors whose official packshot includes a multipack, the standalone can at the right is cropped from that same packshot. No substitute flavor images are used.

Photos and packaging remain the property of their respective brands. Sources and original-image links appear in each product's details. The site is an independent catalogue, not an official brand shop.

## Validation

Run `node --test tests/catalogue.test.cjs`. Checks cover unique IDs, official source domains, local image files/dimensions, unrated sorting, the six homepage previews, full brand lists, search/filter behavior, and safe handling of missing brands.

Electric Vibe — Tropical Freeze: [CELSIUS launch release](https://www.bevnet.com/pr/2026/04/23/celsius-launches-limitededition-electric-vibe-a-sparkling-tropical-freeze-flavor-inspired-by-soccer-culture); photo from [Target](https://www.target.com/p/-/A-1009093154). Added October 29, 2026 as an unrated limited edition.
