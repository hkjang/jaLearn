/**
 * 프롬프트 자산 CRUD API
 * 
 * POST: 새 프롬프트 자산 생성
 * GET: 프롬프트 자산 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { 
  encryptPrompt, 
  decryptPrompt, 
  hashPrompt,
  sanitizeResponseForClient 
} from '@/lib/prompt-encryption';

// ============================================
// GET: 프롬프트 자산 목록 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const gradeLevel = searchParams.get('gradeLevel');
    const subjectId = searchParams.get('subjectId');
    const isActive = searchParams.get('isActive');
    
    const where: Record<string, unknown> = {};
    if (level) where.level = level;
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (subjectId) where.subjectId = subjectId;
    if (isActive !== null) where.isActive = isActive === 'true';
    
    const assets = await prisma.promptAsset.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, level: true } },
        children: { select: { id: true, name: true, level: true } },
        _count: {
          select: { 
            versions: true,
            problemPrompts: true,
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    
    // 프롬프트 내용 제거 (보안)
    const sanitized = assets.map(asset => ({
      ...asset,
      content: undefined, // 목록에서는 내용 숨김
      contentPreview: asset.content ? `[암호화됨: ${asset.content.length}자]` : null,
    }));
    
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Failed to fetch prompt assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt assets' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 새 프롬프트 자산 생성
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      level, 
      name, 
      description, 
      content, 
      parentId,
      gradeLevel,
      subjectId,
      unitId,
      isDefault,
      priority,
    } = body;
    
    // 필수 필드 검증
    if (!level || !name || !content) {
      return NextResponse.json(
        { error: 'level, name, content are required' },
        { status: 400 }
      );
    }
    
    // 레벨 검증
    const validLevels = ['CORE', 'DOMAIN', 'GRADE', 'SUBJECT', 'UNIT', 'PROBLEM', 'USER_STATE'];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }
    
    // 암호화
    const encryptedContent = encryptPrompt(content);
    const contentHash = hashPrompt(content);
    
    const asset = await prisma.promptAsset.create({
      data: {
        level,
        name,
        description,
        content: encryptedContent,
        contentHash,
        parentId,
        gradeLevel,
        subjectId,
        unitId,
        isDefault: isDefault ?? false,
        priority: priority ?? 0,
      },
    });
    
    // 응답에서 민감 정보 제거
    return NextResponse.json({
      ...asset,
      content: undefined,
      message: 'Prompt asset created successfully',
    });
  } catch (error) {
    console.error('Failed to create prompt asset:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt asset' },
      { status: 500 }
    );
  }
}
