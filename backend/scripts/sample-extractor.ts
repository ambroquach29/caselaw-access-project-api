import { createReadStream, createWriteStream } from 'fs';
import { createGunzip } from 'zlib';
import * as readline from 'readline';

async function extractSample(
  inputFile: string,
  outputFile: string,
  sampleSize: number = 100
) {
  console.log(
    `Extracting ${sampleSize} cases from ${inputFile} to ${outputFile}...`
  );

  // Check if file is compressed (.gz) or plain text
  const isCompressed = inputFile.endsWith('.gz');

  let inputStream;
  if (isCompressed) {
    const gunzip = createGunzip();
    inputStream = createReadStream(inputFile).pipe(gunzip);
  } else {
    inputStream = createReadStream(inputFile);
  }

  const writeStream = createWriteStream(outputFile);

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  let count = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    writeStream.write(line + '\n');
    count++;

    if (count >= sampleSize) {
      break;
    }
  }

  writeStream.end();
  console.log(`Extracted ${count} cases to ${outputFile}`);
}

async function main() {
  // Path starts from root
  const inputFile = process.argv[2] || './cal-app-4th-5th-all.jsonl.gz';
  const outputFile = process.argv[3] || './scripts/sample-cases.jsonl';
  const sampleSize = parseInt(process.argv[4] || '100') || 100;

  try {
    await extractSample(inputFile, outputFile, sampleSize);
  } catch (error) {
    console.error('Error extracting sample:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
