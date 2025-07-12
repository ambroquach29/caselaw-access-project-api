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

interface CourtData {
  id: number;
  name_abbreviation?: string | null;
  name?: string | null;
}

interface JurisdictionData {
  id: number;
  name_long?: string | null;
  name?: string | null;
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

class BulkImporter {
  private courts = new Map<string, CourtData>();
  private jurisdictions = new Map<string, JurisdictionData>();
  private caseBuffer: ProcessedCase[] = [];
  private readonly BATCH_SIZE = 1000;
  private processedCount = 0;
  private errorCount = 0;

  constructor() {
    console.log('Initializing bulk importer...');
  }

  async initialize() {
    // Load existing courts and jurisdictions from database
    await this.loadExistingData();
  }

  private async loadExistingData() {
    console.log('Loading existing courts and jurisdictions...');

    const existingCourts = await prisma.court.findMany();
    const existingJurisdictions = await prisma.jurisdiction.findMany();

    existingCourts.forEach(court => {
      // Use normalized key for courts
      const key = this.normalizeCourtKey(
        court.name_abbreviation || court.name || ''
      );
      this.courts.set(key, court);
    });

    existingJurisdictions.forEach(jurisdiction => {
      const key = jurisdiction.name_long || jurisdiction.name || '';
      this.jurisdictions.set(key, jurisdiction);
    });

    console.log(
      `Loaded ${existingCourts.length} courts and ${existingJurisdictions.length} jurisdictions`
    );
  }

  private normalizeCourtKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/[.,]/g, '') // Remove periods and commas
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async ensureCourt(courtData: any): Promise<number> {
    if (!courtData) {
      throw new Error('Court data is required');
    }

    const courtKey = this.normalizeCourtKey(
      courtData.name_abbreviation || courtData.name || ''
    );

    if (this.courts.has(courtKey)) {
      return this.courts.get(courtKey)!.id;
    }

    // Create new court
    const newCourt = await prisma.court.create({
      data: {
        name_abbreviation: courtData.name_abbreviation,
        name: courtData.name,
      },
    });

    this.courts.set(courtKey, newCourt);
    console.log(
      `Created new court: ${courtData.name_abbreviation || courtData.name} (ID: ${newCourt.id})`
    );

    return newCourt.id;
  }

  private async ensureJurisdiction(jurisdictionData: any): Promise<number> {
    if (!jurisdictionData) {
      throw new Error('Jurisdiction data is required');
    }

    const jurisdictionKey =
      jurisdictionData.name_long || jurisdictionData.name || '';

    if (this.jurisdictions.has(jurisdictionKey)) {
      return this.jurisdictions.get(jurisdictionKey)!.id;
    }

    // Create new jurisdiction
    const newJurisdiction = await prisma.jurisdiction.create({
      data: {
        name_long: jurisdictionData.name_long,
        name: jurisdictionData.name,
      },
    });

    this.jurisdictions.set(jurisdictionKey, newJurisdiction);
    console.log(
      `Created new jurisdiction: ${jurisdictionKey} (ID: ${newJurisdiction.id})`
    );

    return newJurisdiction.id;
  }

  private async processCase(caseData: CaseData): Promise<ProcessedCase | null> {
    try {
      if (!caseData.id) {
        console.warn('Skipping case without ID');
        return null;
      }

      // Ensure court and jurisdiction exist
      const courtId = await this.ensureCourt(caseData.court);
      const jurisdictionId = await this.ensureJurisdiction(
        caseData.jurisdiction
      );

      if (!courtId || !jurisdictionId) {
        console.warn(
          `Skipping case ${caseData.id}: missing court or jurisdiction`
        );
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
        court_id: courtId,
        jurisdiction_id: jurisdictionId,
      };
    } catch (error) {
      console.error(`Error processing case ${caseData.id}:`, error);
      return null;
    }
  }

  private async flushBuffer() {
    if (this.caseBuffer.length === 0) return;

    try {
      // Use upsert to handle duplicates gracefully
      const result = await prisma.case.createMany({
        data: this.caseBuffer,
        skipDuplicates: true,
      });
      console.log(`Inserted ${result.count} cases from buffer`);

      // // Process cases individually to handle relationships properly
      // let insertedCount = 0;
      // for (const caseData of this.caseBuffer) {
      //   try {
      //     await prisma.case.upsert({
      //       where: { id: caseData.id },
      //       update: {}, // No update for now, just skip if exists
      //       create: {
      //         id: caseData.id,
      //         name: caseData.name || null,
      //         name_abbreviation: caseData.name_abbreviation || null,
      //         decision_date: caseData.decision_date || null,
      //         docket_number: caseData.docket_number || null,
      //         first_page: caseData.first_page || null,
      //         last_page: caseData.last_page || null,
      //         citations: caseData.citations,
      //         cites_to: caseData.cites_to,
      //         analysis: caseData.analysis,
      //         provenance: caseData.provenance,
      //         casebody: caseData.casebody,
      //         file_name: caseData.file_name || null,
      //         first_page_order: caseData.first_page_order || null,
      //         last_page_order: caseData.last_page_order || null,
      //         last_updated: caseData.last_updated || null,
      //         court: {
      //           connect: { id: caseData.court_id },
      //         },
      //         jurisdiction: {
      //           connect: { id: caseData.jurisdiction_id },
      //         },
      //       },
      //     });
      //     insertedCount++;
      //   } catch (error) {
      //     console.error(`Error inserting case ${caseData.id}:`, error);
      //     this.errorCount++;
      //   }
      // }
      // console.log(`Inserted ${insertedCount} cases from buffer`);

      this.caseBuffer = [];
    } catch (error) {
      console.error('Error flushing buffer:', error);
      this.errorCount += this.caseBuffer.length;
      this.caseBuffer = [];
    }
  }

  private async addCaseToBuffer(processedCase: ProcessedCase) {
    this.caseBuffer.push(processedCase);
    this.processedCount++;

    if (this.caseBuffer.length >= this.BATCH_SIZE) {
      await this.flushBuffer();
    }

    if (this.processedCount % 1000 === 0) {
      console.log(`Processed ${this.processedCount} cases...`);
    }
  }

  async processFile(filePath: string) {
    console.log(`Starting to process file: ${filePath}`);

    const startTime = Date.now();

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
          const processedCase = await this.processCase(caseData);

          if (processedCase) {
            await this.addCaseToBuffer(processedCase);
          }
        } catch (error) {
          console.error('Error parsing line:', error);
          this.errorCount++;
        }
      }

      // Flush remaining cases
      await this.flushBuffer();

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

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

  // Utility method to clean up duplicate courts
  async cleanupDuplicateCourts() {
    console.log('Cleaning up duplicate courts...');

    const allCourts = await prisma.court.findMany();
    const courtGroups = new Map<string, any[]>();

    // Group courts by normalized key
    allCourts.forEach(court => {
      const normalizedKey = this.normalizeCourtKey(
        court.name_abbreviation || court.name || ''
      );
      if (!courtGroups.has(normalizedKey)) {
        courtGroups.set(normalizedKey, []);
      }
      courtGroups.get(normalizedKey)!.push(court);
    });

    // Find and handle duplicates
    let deletedCount = 0;
    for (const [key, courts] of courtGroups.entries()) {
      if (courts.length > 1) {
        console.log(`Found ${courts.length} duplicate courts for key: ${key}`);

        // Keep the first court, delete the rest
        const [keepCourt, ...duplicateCourts] = courts;

        for (const duplicateCourt of duplicateCourts) {
          // Update cases to reference the kept court
          await prisma.case.updateMany({
            where: { court_id: duplicateCourt.id },
            data: { court_id: keepCourt.id },
          });

          // Delete the duplicate court
          await prisma.court.delete({
            where: { id: duplicateCourt.id },
          });

          deletedCount++;
          console.log(
            `Deleted duplicate court: ${duplicateCourt.name_abbreviation || duplicateCourt.name} (ID: ${duplicateCourt.id})`
          );
        }
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} duplicate courts.`);
  }
}

async function main() {
  const importer = new BulkImporter();

  try {
    await importer.initialize();

    // Check if cleanup is requested
    if (process.argv.includes('--cleanup')) {
      await importer.cleanupDuplicateCourts();
      return;
    }

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

export { BulkImporter };
