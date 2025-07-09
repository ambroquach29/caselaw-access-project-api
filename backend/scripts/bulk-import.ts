import { PrismaClient } from '@prisma/client';
import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

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
      const key = court.name_abbreviation || court.name || '';
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

  private async ensureCourt(courtData: any): Promise<number> {
    if (!courtData) {
      throw new Error('Court data is required');
    }

    const courtKey = courtData.name_abbreviation || courtData.name || '';

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
    console.log(`Created new court: ${courtKey} (ID: ${newCourt.id})`);

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
      const gunzip = createGunzip();

      const rl = readline.createInterface({
        input: createReadStream(filePath).pipe(gunzip),
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
}

async function main() {
  const importer = new BulkImporter();

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

export { BulkImporter };
