# Bulk Import Scripts

This directory contains scripts for efficiently importing large case law datasets into the database.

## Scripts Overview

### 1. Sample Extractor (`sample-extractor.ts`)

Extracts a small sample from large JSONL.gz files for testing purposes.

```bash
# Extract 100 cases for testing
npm run extract:sample ./cal-app-4th-5th-all.jsonl.gz ./scripts/sample-cases.jsonl 100

# Extract 1000 cases for larger testing
npm run extract:sample ./cal-app-4th-5th-all.jsonl.gz ./scripts/test-cases.jsonl 1000
```

### 2. Basic Bulk Importer (`bulk-import.ts`)

Simple bulk import script that processes cases in chunks of 1000.

```bash
# Import from the main file
npm run import:bulk ./cal-app-4th-5th-all.jsonl.gz

# Import from a sample file
npm run import:bulk ./scripts/sample-cases.jsonl
```

### 3. Advanced Bulk Importer (`bulk-import-advanced.ts`)

More sophisticated importer with better error handling, progress tracking, and efficient court/jurisdiction management.

```bash
# Import from the main file (recommended)
npm run import:bulk:advanced ./cal-app-4th-5th-all.jsonl.gz

# Import from a sample file
npm run import:bulk:advanced ./scripts/sample-cases.jsonl
```

## Performance Features

### Batch Processing

- Cases are processed in batches of 1000 for optimal database performance
- Courts and jurisdictions are created in batches of 100
- Uses `createMany` with `skipDuplicates: true` to handle duplicates gracefully

### Memory Efficiency

- Streams the JSONL.gz file line by line instead of loading everything into memory
- Maintains in-memory maps of existing courts and jurisdictions for fast lookups
- Buffers data for batch operations

### Error Handling

- Continues processing even if individual cases fail
- Logs errors without stopping the entire import
- Provides detailed progress and summary statistics

## Recommended Workflow

1. **Test with a small sample first:**

   ```bash
   npm run extract:sample ./cal-app-4th-5th-all.jsonl.gz ./test-sample.jsonl 100
   npm run import:bulk:advanced ./test-sample.jsonl
   ```

2. **Test with a larger sample:**

   ```bash
   npm run extract:sample ./cal-app-4th-5th-all.jsonl.gz ./larger-test.jsonl 1000
   npm run import:bulk:advanced ./larger-test.jsonl
   ```

3. **Import the full dataset:**
   ```bash
   npm run import:bulk:advanced ./cal-app-4th-5th-all.jsonl.gz
   ```

## Expected Performance

- **Processing Rate:** 500-2000 cases/second (depending on data complexity)
- **Memory Usage:** ~50-100MB (streaming approach)
- **Database Load:** Optimized with batch inserts and connection pooling

## Monitoring

The scripts provide real-time progress updates:

- Cases processed per second
- Error count
- Buffer flush notifications
- Final summary with total duration and rate

## Troubleshooting

### Common Issues

1. **Memory Issues:** If you encounter memory problems, reduce the batch sizes in the script
2. **Database Connection Timeout:** Ensure your database connection pool is properly configured
3. **Duplicate Key Errors:** The scripts use `skipDuplicates: true` to handle this automatically

### Database Preparation

Ensure your database is ready:

```bash
# Run migrations
npm run db:migrate

# Check database connection
npm run db:queries
```

## Data Format

The scripts expect JSONL format with each line containing a JSON object representing a case:

```json
{
  "id": 1177184,
  "name": "Case Name",
  "name_abbreviation": "Short Name",
  "decision_date": "1991-11-21",
  "docket_number": "No. D011485",
  "court": {
    "name_abbreviation": "Cal. Ct. App.",
    "id": 8799,
    "name": "Court of Appeal of the State of California"
  },
  "jurisdiction": {
    "id": 30,
    "name_long": "California",
    "name": "Cal."
  },
  "citations": [...],
  "cites_to": [...],
  "analysis": {...},
  "provenance": {...},
  "casebody": {...}
}
```
