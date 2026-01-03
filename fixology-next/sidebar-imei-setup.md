# Sidebar: Add IMEI Lookup

IMEI Lookup is available at `/imei`.

## Where it’s wired

The sidebar items live in:

- `fixology-next/components/dashboard/sidebar.tsx`

We added:

- **emoji**: `🔍`
- **label**: `IMEI Lookup`
- **href**: `/imei`
- **badge**: `New`

## Page + API

- **Page**: `fixology-next/app/(dashboard)/imei/page.tsx`
- **API**: `fixology-next/app/api/imei/lookup/route.ts`

## Optional env

```env
IMEICHECK_API_KEY=your-key-from-imeicheck.net
```

If the key is missing, the API returns **mock data** so the UI still works in demo/dev.

