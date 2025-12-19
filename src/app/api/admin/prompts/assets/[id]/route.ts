/**
 * 프롬프트 자산 상세 CRUD API
 * 
 * GET: 단일 자산 조회
 * PUT: 자산 수정
 * DELETE: 자산 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { 
  encryptPrompt, 
  decryptPrompt, 
  hashPrompt 
} from '@/lib/prompt-encryption';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// GET: 단일 프롬프트 자산 조회
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    const asset = await prisma.promptAsset.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, level: true } },
        children: { select: { id: true, name: true, level: true } },
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
          select: {
            id: true,
            version: true,
            status: true,
            changeNote: true,
            createdAt: true,
          },
        },
        problemPrompts: {
          take: 5,
          select: {
            id: true,
            problemId: true,
            isActive: true,
          },
        },
      },
    });
    
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    
    // 권한이 있으면 복호화된 내용 반환
    return NextResponse.json({
      ...asset,
      content: decryptPrompt(asset.content),
    });
  } catch (error) {
    console.error('Failed to fetch prompt asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt asset' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT: 프롬프트 자산 수정
// ============================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      description, 
      content, 
      parentId,
      gradeLevel,
      subjectId,
      unitId,
      isActive,
      isDefault,
      priority,
      createVersion, // true면 새 버전 생성
    } = body;
    
    // 기존 자산 조회
    const existing = await prisma.promptAsset.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
    if (subjectId !== undefined) updateData.subjectId = subjectId;
    if (unitId !== undefined) updateData.unitId = unitId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (priority !== undefined) updateData.priority = priority;
    
    // 내용이 변경된 경우
    if (content !== undefined) {
      updateData.content = encryptPrompt(content);
      updateData.contentHash = hashPrompt(content);
      
      // 버전 생성 요청 시
      if (createVersion) {
        const latestVersion = await prisma.promptVersion.findFirst({
          where: { assetId: id },
          orderBy: { version: 'desc' },
        });
        
        await prisma.promptVersion.create({
          data: {
            assetId: id,
            version: (latestVersion?.version ?? 0) + 1,
            content: encryptPrompt(content),
            changeNote: body.changeNote || 'Updated via admin',
            createdById: session.user.id,
            status: 'DRAFT',
          },
        });
      }
    }
    
    const updated = await prisma.promptAsset.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({
      ...updated,
      content: undefined,
      message: 'Prompt asset updated successfully',
    });
  } catch (error) {
    console.error('Failed to update prompt asset:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt asset' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: 프롬프트 자산 삭제
// ============================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // 자식이 있는지 확인
    const childCount = await prisma.promptAsset.count({
      where: { parentId: id },
    });
    
    if (childCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete asset with children. Delete children first.' },
        { status: 400 }
      );
    }
    
    await prisma.promptAsset.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Prompt asset deleted successfully' });
  } catch (error) {
    console.error('Failed to delete prompt asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt asset' },
      { status: 500 }
    );
  }
}
