import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const tables = await prisma.table.findMany({
      where: { branch_id: params.id },
      orderBy: { label: 'asc' },
    });
    return NextResponse.json({ tables });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { label } = await req.json();
    if (!label) {
      return NextResponse.json({ error: 'Table label is required' }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        branch_id: params.id,
        label: label.trim(),
        is_active: true,
      },
    });

    return NextResponse.json({ success: true, table });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { table_id, label, is_active } = await req.json();
    if (!table_id) {
      return NextResponse.json({ error: 'table_id is required' }, { status: 400 });
    }

    const updated = await prisma.table.update({
      where: { id: table_id },
      data: {
        ...(label !== undefined ? { label: label.trim() } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
      },
    });

    return NextResponse.json({ success: true, table: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const tableId = req.nextUrl.searchParams.get('table_id');
    if (!tableId) {
      return NextResponse.json({ error: 'table_id query param is required' }, { status: 400 });
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
