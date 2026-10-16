// Replace the legacy black "★" glyph image on shop items with the round emoji badge the seed now uses.
// Run with mongosh against the `vietverse` database. Dry run by default; set APPLY=1 to write.
//   docker exec -e APPLY=0 -i vietverse-mongo mongosh --quiet <uri> < fix-legacy-star-asset.mongosh.js
// Idempotent: only documents whose assetUrl is exactly the old legacy value are touched.

const OLD =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Ctext x="20" y="55" font-size="48"%3E★%3C/text%3E%3C/svg%3E';

// Same builder as server/src/seeds/catalog.ts `emojiAsset('🌟', '#FFF3C4')`.
const emojiAsset = (emoji, background) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="${background}"/><text x="40" y="54" font-size="40" text-anchor="middle">${emoji}</text></svg>`,
  );
const NEW = emojiAsset('🌟', '#FFF3C4');

const apply = (typeof process !== 'undefined' && process.env.APPLY) === '1';
const items = db.shopitems.find({ assetUrl: OLD }, { name: 1, type: 1, active: 1 }).toArray();

print(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
print(`Items with the legacy black star: ${items.length}`);
items.forEach((item) => print(` - ${item._id} | ${item.name} | ${item.type} | active=${item.active}`));

if (apply && items.length > 0) {
  const result = db.shopitems.updateMany({ assetUrl: OLD }, { $set: { assetUrl: NEW } });
  print(`Updated: matched=${result.matchedCount} modified=${result.modifiedCount}`);
  print(`Remaining legacy: ${db.shopitems.countDocuments({ assetUrl: OLD })}`);
}
