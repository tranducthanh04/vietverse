import { loadCustomerTranslationsSource, translationCoverage } from './customerTranslationsSource.js';

// Read-only evidence command; intentionally not registered as an importer or bootstrap.
const catalog = loadCustomerTranslationsSource();
console.log(JSON.stringify(process.argv.includes('--entries') ? catalog : {
  source: catalog.source,
  pairs: catalog.entries.length,
  coverage: translationCoverage(catalog),
}, null, 2));
