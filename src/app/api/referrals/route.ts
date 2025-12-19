import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Generate referral code
function generateReferralCode(userId: string): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `JALEARN-${random}`;
}

// GET - Get user's referral info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // Get or create referral code
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true },
    });

    if (!user?.referralCode) {
      const referralCode = generateReferralCode(session.user.id);
      user = await prisma.user.update({
        where: { id: session.user.id },
        data: { referralCode },
        select: { referralCode: true },
      });
    }

    // Get referral stats
    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      include: {
        referred: { select: { name: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter((r) => r.status === "REWARDED").length;
    const pendingReferrals = referrals.filter((r) => r.status === "PENDING" || r.status === "COMPLETED").length;
    const totalRewards = referrals
      .filter((r) => r.status === "REWARDED")
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    return NextResponse.json({
      referralCode: user.referralCode,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewards,
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.referred.name ? r.referred.name.charAt(0) + "**" : "***",
        date: r.createdAt.toISOString().split("T")[0],
        status: r.status.toLowerCase(),
        reward: r.rewardAmount,
      })),
    });
  } catch (error) {
    console.error("Get referral error:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST - Apply referral code during registration
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: "추천 코드를 입력해주세요." },
        { status: 400 }
      );
    }

    // Find referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "유효하지 않은 추천 코드입니다." },
        { status: 400 }
      );
    }

    // Check if already referred
    const existingReferral = await prisma.referral.findFirst({
      where: { referredId: session.user.id },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: "이미 추천 코드를 사용하셨습니다." },
        { status: 400 }
      );
    }

    // Can't refer yourself
    if (referrer.id === session.user.id) {
      return NextResponse.json(
        { error: "본인의 추천 코드는 사용할 수 없습니다." },
        { status: 400 }
      );
    }

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: session.user.id,
        referralCode: referralCode.toUpperCase(),
        status: "PENDING",
        rewardAmount: 5000, // Default reward
      },
    });

    // Create welcome coupon for referred user
    const couponCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);

    await prisma.coupon.create({
      data: {
        code: couponCode,
        name: "친구 추천 환영 쿠폰",
        description: "첫 결제 시 10% 할인",
        discountType: "PERCENT",
        discountValue: 10,
        maxUses: 1,
        maxUsesPerUser: 1,
        validFrom: new Date(),
        validUntil,
        createdBy: referrer.id,
      },
    });

    // Assign coupon to user
    await prisma.userCoupon.create({
      data: {
        userId: session.user.id,
        couponId: couponCode, // This would need to be the coupon ID in real implementation
      },
    });

    return NextResponse.json({
      success: true,
      message: "추천 코드가 적용되었습니다. 첫 결제 시 10% 할인 쿠폰이 발급되었습니다.",
      couponCode,
    });
  } catch (error) {
    console.error("Apply referral error:", error);
    return NextResponse.json(
      { error: "추천 코드 적용 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
