import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Generate coupon code
function generateCouponCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - List coupons
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "沅뚰븳???놁뒿?덈떎." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (isActive === "true") {
      where.isActive = true;
      where.validUntil = { gte: new Date() };
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "荑좏룿 紐⑸줉 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// POST - Create coupon
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "沅뚰븳???놁뒿?덈떎." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      maxUses,
      maxUsesPerUser,
      validFrom,
      validUntil,
      planIds,
    } = body;

    // Generate code if not provided
    const couponCode = code || generateCouponCode();

    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "?대? 議댁옱?섎뒗 荑좏룿 肄붾뱶?낅땲??" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: couponCode.toUpperCase(),
        name,
        description,
        discountType: discountType || "PERCENT",
        discountValue: discountValue || 10,
        minPurchaseAmount,
        maxDiscountAmount,
        maxUses,
        maxUsesPerUser: maxUsesPerUser || 1,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: new Date(validUntil),
        planIds: planIds ? JSON.stringify(planIds) : null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      { error: "荑좏룿 ?앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// PUT - Update coupon
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "沅뚰븳???놁뒿?덈떎." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "荑좏룿 ID媛 ?꾩슂?⑸땲??" },
        { status: 400 }
      );
    }

    // Convert dates
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }
    if (updateData.planIds) {
      updateData.planIds = JSON.stringify(updateData.planIds);
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json(
      { error: "荑좏룿 ?섏젙 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate coupon
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "沅뚰븳???놁뒿?덈떎." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "荑좏룿 ID媛 ?꾩슂?⑸땲??" },
        { status: 400 }
      );
    }

    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "荑좏룿??鍮꾪솢?깊솕?섏뿀?듬땲??",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      { error: "荑좏룿 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

