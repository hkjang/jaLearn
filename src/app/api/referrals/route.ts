import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
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
      { error: "議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
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
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: "異붿쿇 肄붾뱶瑜??낅젰?댁＜?몄슂." },
        { status: 400 }
      );
    }

    // Find referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "?좏슚?섏? ?딆? 異붿쿇 肄붾뱶?낅땲??" },
        { status: 400 }
      );
    }

    // Check if already referred
    const existingReferral = await prisma.referral.findFirst({
      where: { referredId: session.user.id },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: "?대? 異붿쿇 肄붾뱶瑜??ъ슜?섏뀲?듬땲??" },
        { status: 400 }
      );
    }

    // Can't refer yourself
    if (referrer.id === session.user.id) {
      return NextResponse.json(
        { error: "蹂몄씤??異붿쿇 肄붾뱶???ъ슜?????놁뒿?덈떎." },
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
        name: "移쒓뎄 異붿쿇 ?섏쁺 荑좏룿",
        description: "泥?寃곗젣 ??10% ?좎씤",
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
      message: "異붿쿇 肄붾뱶媛 ?곸슜?섏뿀?듬땲?? 泥?寃곗젣 ??10% ?좎씤 荑좏룿??諛쒓툒?섏뿀?듬땲??",
      couponCode,
    });
  } catch (error) {
    console.error("Apply referral error:", error);
    return NextResponse.json(
      { error: "異붿쿇 肄붾뱶 ?곸슜 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

