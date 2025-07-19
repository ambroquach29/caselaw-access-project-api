import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import * as readline from 'readline';
import dotenv from 'dotenv';
import { prisma } from '../helpers/prisma';

dotenv.config();

interface CaseData {
  id: number;
  name?: string;
  name_abbreviation?: string;
  decision_date?: string;
  docket_number?: string;
  first_page?: string;
  last_page?: string;
  citations?: any;
  court?: {
    name_abbreviation?: string;
    id?: number;
    name?: string;
  };
  jurisdiction?: {
    id?: number;
    name_long?: string;
    name?: string;
  };
  cites_to?: any;
  analysis?: any;
  provenance?: any;
  casebody?: any;
  last_updated?: string;
  file_name?: string;
  first_page_order?: number;
  last_page_order?: number;
}

interface ProcessedCase {
  id: number;
  name?: string | null;
  name_abbreviation?: string | null;
  decision_date?: Date | null;
  docket_number?: string | null;
  first_page?: string | null;
  last_page?: string | null;
  citations?: any;
  cites_to?: any;
  analysis?: any;
  provenance?: any;
  casebody?: any;
  last_updated?: Date | null;
  file_name?: string | null;
  first_page_order?: number | null;
  last_page_order?: number | null;
  court_id: number;
  jurisdiction_id: number;
}

class AdvancedBulkImporter {
  private courts = new Map<string, number>();
  private jurisdictions = new Map<string, number>();
  private caseBuffer: ProcessedCase[] = [];
  private courtBuffer: Array<{ name_abbreviation?: string; name?: string }> =
    [];
  private jurisdictionBuffer: Array<{ name_long?: string; name?: string }> = [];
  private readonly BATCH_SIZE = 10; // Much smaller for Prisma Dev
  private readonly COURT_BATCH_SIZE = 5; // Much smaller for Prisma Dev
  private readonly JURISDICTION_BATCH_SIZE = 5; // Much smaller for Prisma Dev
  private processedCount = 0;
  private errorCount = 0;
  private startTime!: number;

  constructor() {
    console.log('Initializing advanced bulk importer...');
  }

  async initialize() {
    this.startTime = Date.now();
    await this.loadExistingData();
  }

  private async loadExistingData() {
    console.log('Loading existing courts and jurisdictions...');

    const [existingCourts, existingJurisdictions] = await Promise.all([
      prisma.court.findMany(),
      prisma.jurisdiction.findMany(),
    ]);

    existingCourts.forEach(court => {
      const key = court.name_abbreviation || court.name || '';
      this.courts.set(key, court.id);
    });

    existingJurisdictions.forEach(jurisdiction => {
      const key = jurisdiction.name_long || jurisdiction.name || '';
      this.jurisdictions.set(key, jurisdiction.id);
    });

    console.log(
      `Loaded ${existingCourts.length} courts and ${existingJurisdictions.length} jurisdictions`
    );
  }

  private async flushCourtBuffer() {
    if (this.courtBuffer.length === 0) return;

    try {
      const courtsToCreate = this.courtBuffer.filter(court => {
        const key = court.name_abbreviation || court.name || '';
        return !this.courts.has(key);
      });

      if (courtsToCreate.length > 0) {
        const createdCourts = await prisma.court.createMany({
          data: courtsToCreate,
          skipDuplicates: true,
        });

        // Reload courts to get the new IDs
        const newCourts = await prisma.court.findMany({
          where: {
            OR: courtsToCreate.map(court => ({
              name_abbreviation: court.name_abbreviation || null,
              name: court.name || null,
            })),
          },
        });

        newCourts.forEach(court => {
          const key = court.name_abbreviation || court.name || '';
          this.courts.set(key, court.id);
        });

        console.log(`Created ${createdCourts.count} new courts`);
      }

      this.courtBuffer = [];
    } catch (error) {
      console.error('Error flushing court buffer:', error);
    }
  }

  private async flushJurisdictionBuffer() {
    if (this.jurisdictionBuffer.length === 0) return;

    try {
      const jurisdictionsToCreate = this.jurisdictionBuffer.filter(
        jurisdiction => {
          const key = jurisdiction.name_long || jurisdiction.name || '';
          return !this.jurisdictions.has(key);
        }
      );

      if (jurisdictionsToCreate.length > 0) {
        const createdJurisdictions = await prisma.jurisdiction.createMany({
          data: jurisdictionsToCreate,
          skipDuplicates: true,
        });

        // Reload jurisdictions to get the new IDs
        const newJurisdictions = await prisma.jurisdiction.findMany({
          where: {
            OR: jurisdictionsToCreate.map(jurisdiction => ({
              name_long: jurisdiction.name_long || null,
              name: jurisdiction.name || null,
            })),
          },
        });

        newJurisdictions.forEach(jurisdiction => {
          const key = jurisdiction.name_long || jurisdiction.name || '';
          this.jurisdictions.set(key, jurisdiction.id);
        });

        console.log(`Created ${createdJurisdictions.count} new jurisdictions`);
      }

      this.jurisdictionBuffer = [];
    } catch (error) {
      console.error('Error flushing jurisdiction buffer:', error);
    }
  }

  private async ensureCourt(courtData: any): Promise<number> {
    if (!courtData) {
      throw new Error('Court data is required');
    }

    const courtKey = courtData.name_abbreviation || courtData.name || '';

    if (this.courts.has(courtKey)) {
      return this.courts.get(courtKey)!;
    }

    // Add to buffer for batch creation
    this.courtBuffer.push({
      name_abbreviation: courtData.name_abbreviation,
      name: courtData.name,
    });

    if (this.courtBuffer.length >= this.COURT_BATCH_SIZE) {
      await this.flushCourtBuffer();
    }

    // Try to get the ID again after potential creation
    return this.courts.get(courtKey) || 0;
  }

  private async ensureJurisdiction(jurisdictionData: any): Promise<number> {
    if (!jurisdictionData) {
      throw new Error('Jurisdiction data is required');
    }

    const jurisdictionKey =
      jurisdictionData.name_long || jurisdictionData.name || '';

    if (this.jurisdictions.has(jurisdictionKey)) {
      return this.jurisdictions.get(jurisdictionKey)!;
    }

    // Add to buffer for batch creation
    this.jurisdictionBuffer.push({
      name_long: jurisdictionData.name_long,
      name: jurisdictionData.name,
    });

    if (this.jurisdictionBuffer.length >= this.JURISDICTION_BATCH_SIZE) {
      await this.flushJurisdictionBuffer();
    }

    // Try to get the ID again after potential creation
    return this.jurisdictions.get(jurisdictionKey) || 0;
  }

  private processCase(caseData: CaseData): ProcessedCase | null {
    try {
      if (!caseData.id) {
        console.warn('Skipping case without ID');
        return null;
      }

      return {
        id: caseData.id,
        name: caseData.name || null,
        name_abbreviation: caseData.name_abbreviation || null,
        decision_date: caseData.decision_date
          ? new Date(caseData.decision_date)
          : null,
        docket_number: caseData.docket_number || null,
        first_page: caseData.first_page || null,
        last_page: caseData.last_page || null,
        citations: caseData.citations,
        cites_to: caseData.cites_to,
        analysis: caseData.analysis,
        provenance: caseData.provenance,
        casebody: caseData.casebody,
        last_updated: caseData.last_updated
          ? new Date(caseData.last_updated)
          : null,
        file_name: caseData.file_name || null,
        first_page_order: caseData.first_page_order || null,
        last_page_order: caseData.last_page_order || null,
        court_id: caseData.court?.id || 0,
        jurisdiction_id: caseData.jurisdiction?.id || 0,
      };
    } catch (error) {
      console.error(`Error processing case ${caseData.id}:`, error);
      return null;
    }
  }

  private async flushCaseBuffer() {
    if (this.caseBuffer.length === 0) return;

    try {
      let insertedCount = 0;

      // Process cases individually to handle relationships properly
      for (const caseData of this.caseBuffer) {
        try {
          // Add retry logic for Prisma Dev
          let retries = 3;
          while (retries > 0) {
            try {
              await prisma.case.upsert({
                where: { id: caseData.id },
                update: {}, // No update for now, just skip if exists
                create: {
                  id: caseData.id,
                  name: caseData.name || null,
                  name_abbreviation: caseData.name_abbreviation || null,
                  decision_date: caseData.decision_date || null,
                  docket_number: caseData.docket_number || null,
                  first_page: caseData.first_page || null,
                  last_page: caseData.last_page || null,
                  citations: caseData.citations,
                  cites_to: caseData.cites_to,
                  analysis: caseData.analysis,
                  provenance: caseData.provenance,
                  casebody: caseData.casebody,
                  file_name: caseData.file_name || null,
                  first_page_order: caseData.first_page_order || null,
                  last_page_order: caseData.last_page_order || null,
                  last_updated: caseData.last_updated || null,
                  court: {
                    connect: { id: caseData.court_id },
                  },
                  jurisdiction: {
                    connect: { id: caseData.jurisdiction_id },
                  },
                },
              });
              insertedCount++;
              break; // Success, exit retry loop
            } catch (error) {
              retries--;
              if (retries === 0) {
                console.error(
                  `Error inserting case ${caseData.id} after 3 retries:`,
                  error
                );
                this.errorCount++;
              } else {
                console.log(
                  `Retrying case ${caseData.id}, ${retries} retries left...`
                );
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              }
            }
          }
        } catch (error) {
          console.error(`Error inserting case ${caseData.id}:`, error);
          this.errorCount++;
        }
      }

      console.log(`Inserted ${insertedCount} cases from buffer`);
      this.caseBuffer = [];
    } catch (error) {
      console.error('Error flushing case buffer:', error);
      this.errorCount += this.caseBuffer.length;
      this.caseBuffer = [];
    }
  }

  private async addCaseToBuffer(processedCase: ProcessedCase) {
    this.caseBuffer.push(processedCase);
    this.processedCount++;

    if (this.caseBuffer.length >= this.BATCH_SIZE) {
      await this.flushCaseBuffer();
    }

    if (this.processedCount % 10 === 0) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const rate = this.processedCount / elapsed;
      console.log(
        `Processed ${this.processedCount} cases... (${rate.toFixed(2)} cases/sec)`
      );
      // Add a longer delay for Prisma Dev
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async processFile(filePath: string) {
    console.log(`Starting to process file: ${filePath}`);

    try {
      // Check if file is compressed (.gz) or plain text
      const isCompressed = filePath.endsWith('.gz');

      let inputStream;
      if (isCompressed) {
        const gunzip = createGunzip();
        inputStream = createReadStream(filePath).pipe(gunzip);
      } else {
        inputStream = createReadStream(filePath);
      }

      const rl = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const caseData: CaseData = JSON.parse(line);

          // Ensure court and jurisdiction exist
          const courtId = await this.ensureCourt(caseData.court);
          const jurisdictionId = await this.ensureJurisdiction(
            caseData.jurisdiction
          );

          if (!courtId || !jurisdictionId) {
            console.warn(
              `Skipping case ${caseData.id}: missing court or jurisdiction`
            );
            this.errorCount++;
            continue;
          }

          const processedCase = this.processCase(caseData);

          if (processedCase) {
            processedCase.court_id = courtId;
            processedCase.jurisdiction_id = jurisdictionId;
            await this.addCaseToBuffer(processedCase);
          }
        } catch (error) {
          console.error('Error parsing line:', error);
          this.errorCount++;
        }
      }

      // Flush remaining buffers
      await Promise.all([
        this.flushCourtBuffer(),
        this.flushJurisdictionBuffer(),
        this.flushCaseBuffer(),
      ]);

      const endTime = Date.now();
      const duration = (endTime - this.startTime) / 1000;

      console.log('\n=== Import Summary ===');
      console.log(`Total processed: ${this.processedCount}`);
      console.log(`Errors: ${this.errorCount}`);
      console.log(`Duration: ${duration.toFixed(2)} seconds`);
      console.log(
        `Rate: ${(this.processedCount / duration).toFixed(2)} cases/second`
      );
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  async close() {
    await prisma.$disconnect();
  }
}

async function main() {
  const importer = new AdvancedBulkImporter();

  try {
    await importer.initialize();

    // Process the JSONL.gz file
    const filePath = process.argv[2] || './cal-app-4th-5th-all.jsonl.gz';
    await importer.processFile(filePath);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await importer.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { AdvancedBulkImporter };
