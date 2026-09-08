import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { name, email, password, role, branch_id, is_active } = await req.json();

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (email !== undefined) dataToUpdate.email = email.toLowerCase().trim();
    if (role !== undefined) dataToUpdate.role = role;
    if (branch_id !== undefined) dataToUpdate.branch_id = branch_id || null;
    if (is_active !== undefined) dataToUpdate.is_active = Boolean(is_active);

    if (password && password.trim().length > 0) {
      dataToUpdate.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch_id: true,
        is_active: true,
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update staff user' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    // Soft deactivate per spec
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { is_active: false },
    });
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
