// src/lib/download-utils.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { stringify } from 'csv-stringify';

// NOTE: For a real XLSX implementation, you would need to install
// and use a library like `exceljs`.
// import ExcelJS from 'exceljs';

export async function getAuthClaims() {
  const claims = await getTokenClaims();
  if (!claims || !claims.sub || !claims.org_id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  return claims;
}

/**
 * Generates and streams a CSV file.
 * @param data The data to be written to the CSV, including headers.
 * @param filename The desired filename for the download.
 * @returns A NextResponse containing the CSV file.
 */
export async function generateAndStreamCsv(data: any[][], filename: string): Promise<NextResponse> {
  const csvString = await new Promise<string>((resolve, reject) => {
    stringify(data, (err, result) => {
      if (err) reject(err);
      resolve(result || '');
    });
  });

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Generates and streams an XLSX file.
 * NOTE: This is a placeholder. A real implementation requires a library like ExcelJS.
 * @param data The formatted data for the report.
 * @param headers The column headers for the report.
 * @param filename The desired filename for the download.
 * @returns A NextResponse containing the XLSX file.
 */
export async function generateAndStreamXlsx(data: any[], headers: string[], filename: string): Promise<NextResponse> {
  // In a real implementation, you would use ExcelJS or a similar library here
  // to create the workbook, add the data, and generate a buffer.
  
  // Example of a placeholder response:
  return new NextResponse('XLSX generation is not yet implemented.', { status: 501 });
}