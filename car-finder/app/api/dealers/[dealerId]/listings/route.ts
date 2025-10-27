import { NextResponse } from 'next/server';
import { SellerType } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageDealer } from '@/lib/authorization';
import { prisma } from '@/lib/db';
import { signature } from '@/utils/dedupe';

type RawRecord = Record<string, unknown>;

type NormalizedRecord = {
  sourceId: string;
  hashSignature: string;
  values: {
    vin?: string;
    title?: string;
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    price?: number;
    mileage?: number;
    body?: string;
    drivetrain?: string;
    transmission?: string;
    fuel?: string;
    colorExt?: string;
    colorInt?: string;
    city?: string;
    state?: string;
    lat?: number;
    lon?: number;
    url?: string;
    phone?: string;
    images?: string[];
    postedAt?: Date;
    updatedAt?: Date;
  };
};

function toOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (typeof value === 'number') {
    return `${value}`;
  }
  return undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toOptionalInt(value: unknown): number | undefined {
  const numeric = toOptionalNumber(value);
  return typeof numeric === 'number' ? Math.round(numeric) : undefined;
}

function toOptionalDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }
  const asString = typeof value === 'number' ? new Date(value) : new Date(String(value));
  return Number.isNaN(asString.valueOf()) ? undefined : asString;
}

function normalizeImages(value: unknown): string[] | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const cleaned = value
      .map((entry) => toOptionalString(entry))
      .filter((entry): entry is string => Boolean(entry));
    return cleaned.length ? cleaned : undefined;
  }
  const asString = toOptionalString(value);
  if (!asString) {
    return undefined;
  }
  const parts = asString.split(/[|,;]/).map((chunk) => chunk.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

function pickFirst<T>(...candidates: (T | undefined)[]): T | undefined {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }
  return undefined;
}

function normalizeRecord(raw: RawRecord): NormalizedRecord | null {
  const vin = toOptionalString(pickFirst(raw.vin, raw.VIN));
  const title = toOptionalString(pickFirst(raw.title, raw.Title, raw.name, raw.Name, raw.description, raw.Description));
  const price = toOptionalInt(pickFirst(raw.price, raw.Price, raw.listPrice, raw.ListPrice));
  const mileage = toOptionalInt(pickFirst(raw.mileage, raw.Mileage, raw.odometer, raw.Odometer));
  const phone = toOptionalString(pickFirst(raw.phone, raw.Phone, raw.dealerPhone, raw.contactPhone));

  if (!vin && !title) {
    return null;
  }

  const year = toOptionalInt(pickFirst(raw.year, raw.Year));
  const make = toOptionalString(pickFirst(raw.make, raw.Make));
  const model = toOptionalString(pickFirst(raw.model, raw.Model));
  const trim = toOptionalString(pickFirst(raw.trim, raw.Trim));
  const body = toOptionalString(pickFirst(raw.body, raw.Body, raw.bodyStyle));
  const drivetrain = toOptionalString(pickFirst(raw.drivetrain, raw.Drivetrain));
  const transmission = toOptionalString(pickFirst(raw.transmission, raw.Transmission));
  const fuel = toOptionalString(pickFirst(raw.fuel, raw.Fuel));
  const colorExt = toOptionalString(pickFirst(raw.colorExt, raw.exteriorColor, raw.ExteriorColor));
  const colorInt = toOptionalString(pickFirst(raw.colorInt, raw.interiorColor, raw.InteriorColor));
  const city = toOptionalString(pickFirst(raw.city, raw.City));
  const state = toOptionalString(pickFirst(raw.state, raw.State));
  const lat = toOptionalNumber(pickFirst(raw.lat, raw.latitude, raw.Latitude));
  const lon = toOptionalNumber(pickFirst(raw.lon, raw.longitude, raw.Longitude));
  const url = toOptionalString(pickFirst(raw.url, raw.URL, raw.link, raw.Link));
  const images = normalizeImages(pickFirst(raw.images, raw.photos, raw.Photos));
  const sourceId = toOptionalString(pickFirst(raw.sourceId, raw.SourceId, raw.stockNumber, raw.StockNumber, raw.id, raw.ID));
  const postedAt = toOptionalDate(pickFirst(raw.postedAt, raw.PostedAt, raw.listedAt, raw.ListedAt));
  const updatedAt = toOptionalDate(pickFirst(raw.updatedAt, raw.UpdatedAt, raw.modifiedAt, raw.ModifiedAt, raw.feedTimestamp));

  const recordSignature = signature({ vin, title, price: price ?? undefined, phone });
  const resolvedSourceId = (sourceId ?? recordSignature).slice(0, 190);

  return {
    sourceId: resolvedSourceId,
    hashSignature: recordSignature,
    values: {
      vin,
      title,
      year: year ?? undefined,
      make,
      model,
      trim,
      price: price ?? undefined,
      mileage: mileage ?? undefined,
      body,
      drivetrain,
      transmission,
      fuel,
      colorExt,
      colorInt,
      city,
      state,
      lat: lat ?? undefined,
      lon: lon ?? undefined,
      url,
      phone,
      images,
      postedAt: postedAt ?? undefined,
      updatedAt: updatedAt ?? undefined,
    },
  };
}

async function parsePayload(request: Request): Promise<RawRecord[]> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    if (Array.isArray(body)) {
      return body as RawRecord[];
    }
    if (body && typeof body === 'object' && Array.isArray((body as { listings?: unknown }).listings)) {
      return (body as { listings: RawRecord[] }).listings;
    }
    throw new Error('JSON payload must be an array of listings or an object with a "listings" array.');
  }

  if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
    const text = await request.text();
    return parseCsv(text);
  }

  throw new Error('Unsupported content type. Please upload JSON or CSV data.');
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function parseCsv(text: string): RawRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const records: RawRecord[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    if (values.every((value) => value === '')) {
      continue;
    }
    const entry: RawRecord = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] ?? '';
    });
    records.push(entry);
  }

  return records;
}

export async function POST(request: Request, { params }: { params: { dealerId: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dealerId = params.dealerId;
  if (!canManageDealer(user, dealerId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  if (!dealer) {
    return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
  }

  let rawRecords: RawRecord[];
  try {
    rawRecords = await parsePayload(request);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
  }

  if (!rawRecords.length) {
    return NextResponse.json({ message: 'No listings provided.', created: 0, updated: 0 });
  }

  const normalized = rawRecords
    .map((record) => normalizeRecord(record))
    .filter((record): record is NormalizedRecord => Boolean(record));

  if (!normalized.length) {
    return NextResponse.json({ error: 'No valid listings found in payload.' }, { status: 400 });
  }

  const deduped = new Map<string, NormalizedRecord>();
  for (const record of normalized) {
    if (!deduped.has(record.hashSignature)) {
      deduped.set(record.hashSignature, record);
    }
  }

  const source = `dealer:${dealerId}`;
  let created = 0;
  let updated = 0;

  try {
    await prisma.$transaction(async (tx) => {
      for (const record of deduped.values()) {
        const existing = await tx.listing.findUnique({
          where: { source_sourceId: { source, sourceId: record.sourceId } },
          select: { id: true, dealerId: true },
        });

        const baseData = {
          ...record.values,
          sellerType: SellerType.dealer,
          dealerId,
          hashSignature: record.hashSignature,
          images: record.values.images && record.values.images.length ? record.values.images : undefined,
          updatedAt: record.values.updatedAt ?? new Date(),
        };

        if (existing) {
          if (existing.dealerId && existing.dealerId !== dealerId) {
            throw new Error('Listing belongs to a different dealer.');
          }

          await tx.listing.update({
            where: { id: existing.id },
            data: baseData,
          });
          updated += 1;
        } else {
          await tx.listing.create({
            data: {
              ...baseData,
              source,
              sourceId: record.sourceId,
            },
          });
          created += 1;
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save listings.' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Listings processed.', created, updated });
}
