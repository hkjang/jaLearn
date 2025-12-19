import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/crawler/jobs - List crawl jobs
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
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (sourceId) where.sourceId = sourceId;
    if (status) where.status = status;

    const jobs = await prisma.crawlJob.findMany({
      where,
      include: {
        source: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: { items: true, logs: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/crawler/jobs - Create and start a crawl job
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
    const { sourceId, priority = 0 } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    // Check source exists
    const source = await prisma.collectionSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    // Create job
    const job = await prisma.crawlJob.create({
      data: {
        sourceId,
        priority,
        status: "PENDING",
      },
      include: {
        source: true,
      },
    });

    // Log creation
    await prisma.crawlLog.create({
      data: {
        jobId: job.id,
        level: "INFO",
        action: "CREATE",
        message: `?¨Î°§Îß??ëÏóÖ ?ùÏÑ±: ${source.name}`,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}

// PUT /api/crawler/jobs - Update job status
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
    const { id, status, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Job ID required" },
        { status: 400 }
      );
    }

    // Add timestamps based on status
    if (status === "RUNNING" && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    if ((status === "COMPLETED" || status === "FAILED") && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const job = await prisma.crawlJob.update({
      where: { id },
      data: { status, ...updateData },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE /api/crawler/jobs - Cancel job
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
        { error: "Job ID required" },
        { status: 400 }
      );
    }

    // Soft cancel - update status
    const job = await prisma.crawlJob.update({
      where: { id },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });

    await prisma.crawlLog.create({
      data: {
        jobId: id,
        level: "INFO",
        action: "CANCEL",
        message: "?ëÏóÖ??Ï∑®ÏÜå?òÏóà?µÎãà??,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { error: "Failed to cancel job" },
      { status: 500 }
    );
  }
}
