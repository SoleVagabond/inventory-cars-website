#!/usr/bin/env tsx

import fs from 'fs/promises';

function detectContentType(file: string) {
  if (file.endsWith('.csv')) {
    return 'text/csv';
  }
  return 'application/json';
}

async function main() {
  const endpoint = process.env.DEALER_FEED_ENDPOINT;
  if (!endpoint) {
    throw new Error('Set DEALER_FEED_ENDPOINT to your ingestion URL (e.g. https://app.example.com/api/dealers/<id>/listings).');
  }

  const sessionCookie = process.env.SESSION_COOKIE;
  if (!sessionCookie) {
    throw new Error('Set SESSION_COOKIE to an authenticated cookie string (e.g. "next-auth.session-token=...").');
  }

  const file = process.argv[2] ?? 'scripts/samples/dealer-feed.csv';
  const body = await fs.readFile(file, file.endsWith('.csv') ? 'utf8' : 'utf8');
  const contentType = detectContentType(file);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Cookie: sessionCookie,
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  console.log('Upload complete:', payload);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
