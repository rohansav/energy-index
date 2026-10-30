import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CommunitySummary } from "../src/components/community/CommunitySummary";
import type { CommunityStats } from "../src/domain/community";
const stats: CommunityStats = {
  count: 2,
  average: 7.35,
  min: 6,
  max: 8.7,
  distribution: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0],
  sensory: {
    sweetness: { average: 0, count: 1 },
    tartness: { average: null, count: 0 },
    dryness: { average: 2, count: 2 },
    energy: { average: 3, count: 1 },
  },
};
test("community box handles empty, single-review and aggregate states", () => {
  const render = (value: CommunityStats | null) =>
    renderToStaticMarkup(
      <CommunitySummary stats={value} loading={false} error="" />,
    );
  const empty = render(null);
  assert.match(empty, /No community ratings yet/);
  assert.doesNotMatch(empty, /Lowest/);
  const single = render({ ...stats, count: 1 });
  assert.doesNotMatch(single, /community-distribution/);
  const multiple = render(stats);
  assert.match(multiple, /7.3/);
  assert.match(multiple, /Lowest/);
  assert.match(multiple, /8.7/);
  assert.match(multiple, /0.0/);
  assert.match(multiple, /Category response counts/);
});
