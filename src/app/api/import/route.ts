import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { processBatch, CRMRecord } from "@/lib/ai/mapper";

export const maxDuration = 60; // Set max duration for Vercel Serverless Functions to handle AI processing

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Validation function as per requirements:
// Skip any record that contains no email AND no mobile number
function isValidRecord(record: CRMRecord): boolean {
  const hasEmail = Boolean(record.email && record.email.trim() !== "");
  const hasMobile = Boolean(record.mobile_without_country_code && record.mobile_without_country_code.trim() !== "");
  return hasEmail || hasMobile;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();

    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.warn("CSV parsing errors/warnings:", parseResult.errors);
    }

    const rawRecords = parseResult.data as Record<string, string>[];
    
    if (rawRecords.length === 0) {
      return NextResponse.json({ error: "Empty CSV file" }, { status: 400 });
    }

    // Batching: Process max 50 records per batch to avoid LLM token limits and timeout issues
    const BATCH_SIZE = 50;
    const batches = chunkArray(rawRecords, BATCH_SIZE);
    
    let allMappedRecords: CRMRecord[] = [];
    
    // Process batches sequentially to respect rate limits, but could be parallelized if API limits allow
    for (const batch of batches) {
      const mappedBatch = await processBatch(batch);
      allMappedRecords = [...allMappedRecords, ...mappedBatch];
    }

    // Filter skipped records based on rules
    let imported = 0;
    let skipped = 0;
    const finalRecords: CRMRecord[] = [];

    for (const record of allMappedRecords) {
      if (isValidRecord(record)) {
        finalRecords.push(record);
        imported++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      records: finalRecords
    });

  } catch (error: any) {
    console.error("Error processing import:", error);
    return NextResponse.json(
      { error: "Failed to process the CSV import", details: error.message },
      { status: 500 }
    );
  }
}
