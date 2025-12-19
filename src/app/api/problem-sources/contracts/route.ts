import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/problem-sources/contracts - List contracts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");
    const onlyActive = searchParams.get("active") === "true";

    const where: Record<string, unknown> = {};
    if (sourceId) where.sourceId = sourceId;
    if (onlyActive) where.isActive = true;

    const contracts = await prisma.sourceContract.findMany({
      where,
      include: {
        source: {
          select: { id: true, name: true, grade: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

// POST /api/problem-sources/contracts - Create contract
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      sourceId,
      contractType,
      title,
      startDate,
      endDate,
      autoBlock,
      allowLearning,
      allowAITraining,
      allowCommercial,
      revenueShare,
      terms,
      documentUrl,
      notes,
    } = body;

    if (!sourceId || !contractType || !title || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const contract = await prisma.sourceContract.create({
      data: {
        sourceId,
        contractType,
        title,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        autoBlock: autoBlock ?? true,
        allowLearning: allowLearning ?? true,
        allowAITraining: allowAITraining ?? false,
        allowCommercial: allowCommercial ?? false,
        revenueShare,
        terms: terms ? JSON.stringify(terms) : null,
        documentUrl,
        notes,
      },
      include: {
        source: true,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}

// PUT /api/problem-sources/contracts - Update contract
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Contract ID required" },
        { status: 400 }
      );
    }

    // Process date fields
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    if (updateData.terms && typeof updateData.terms !== 'string') {
      updateData.terms = JSON.stringify(updateData.terms);
    }

    const contract = await prisma.sourceContract.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { error: "Failed to update contract" },
      { status: 500 }
    );
  }
}

// DELETE /api/problem-sources/contracts - Delete contract
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contract ID required" },
        { status: 400 }
      );
    }

    await prisma.sourceContract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
