// app/api/chatbot/chatArea/route.ts

import { NextRequest, NextResponse } from 'next/server';

// This is the URL for your new, separate MCP server.
// You'll need to replace this with the actual URL when you deploy it.
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://brixta-mycoco-mcp.fastmcp.app/mcp';

export async function POST(req: NextRequest) {
  try {
    const { messages, reportType, reportId } = await req.json();

    if (!messages || !Array.isArray(messages) || !reportType || !reportId) {
      return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }

    // Determine which internal API route to call based on the user's request
    let reportUrl: string;

    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';

    switch (reportType) {
      case 'dailyVisitReports':
        reportUrl = `${protocol}://${host}/api/dashboardPagesAPI/daily-visit-reports?id=${reportId}`;
        break;
      case 'technicalVisitReports':
        reportUrl = `${protocol}://${host}/api/dashboardPagesAPI/technical-visit-reports?id=${reportId}`;
        break;
      case 'clientReports':
        reportUrl = `${protocol}://${host}/api/dashboardPagesAPI/client-reports?id=${reportId}`;
        break;
      case 'competitionReports':
        reportUrl = `${protocol}://${host}/api/dashboardPagesAPI/competition-reports?id=${reportId}`;
        break;
      case 'dealerReports':
        reportUrl = `${protocol}://${host}/api/dashboardPagesAPI/dealer-reports?id=${reportId}`;
        break;
      case 'salesmanAttendance':
        reportUrl = `${protocol}://${host}/api/dashboardPagesAPI/slm-attendance?id=${reportId}`;
        break;
      case 'salesmanGeotracking':
        reportUrl = `${protocol}://${host}/api/dashboardPagesAPI/slm-geotracking?id=${reportId}`;
        break;
      default:
        return NextResponse.json({ message: 'Invalid report type.' }, { status: 400 });
    }

    // 1. Fetch the data from your existing internal API route
    const reportResponse = await fetch(reportUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
      },
    });

    if (!reportResponse.ok) {
      return NextResponse.json({ message: 'Failed to fetch report data.' }, { status: reportResponse.status });
    }

    const reportData = await reportResponse.json();

    // 2. Send the fetched data and chat history to the MCP server
    const mcpResponse = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Pass along any necessary authentication headers for the MCP server
            'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
            messages,
            reportType,
            reportId,
            reportData, // This is the crucial part that passes context to your MCP
        }),
    });

    if (!mcpResponse.ok) {
        return NextResponse.json({ message: 'Failed to get a response from the MCP server.' }, { status: mcpResponse.status });
    }

    const mcpData = await mcpResponse.json();

    // 3. Send the MCP's response back to the frontend
    // The response is expected to have a 'response' field with the AI-generated text.
    return NextResponse.json({ response: mcpData.response });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred while processing your request.' }, 
        { status: 500 });
  }
}
