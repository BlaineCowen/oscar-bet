# Next.js Most Preferred Configuration

## Route Handlers and Pages

### Dynamic Route Parameters
Always use Promise-based params in route handlers and pages:

```typescript
// ✅ Correct
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Use id...
}

// ✅ Correct
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Use id...
}

// ❌ Incorrect
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id; // Wrong! Should await params
}
```

### Route Configuration
Always include these exports in API routes:
```typescript
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

### Error Handling
Always include proper error handling in API routes:
```typescript
try {
  // API logic
} catch (error) {
  console.error("Error description:", error);
  return NextResponse.json(
    { error: "User-friendly error message" },
    { status: appropriate_status_code }
  );
} 