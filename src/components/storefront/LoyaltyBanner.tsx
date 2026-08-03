'use client';

// Loyalty promotion banner component for home page
import { Sparkles, Trophy, Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import dynamic from 'next/dynamic';

const Hyperspeed = dynamic(() => import('@/components/ui/Hyperspeed'), { ssr: false });

interface LoyaltyBannerProps {
  settings: any;
}

export function LoyaltyBanner({ settings }: LoyaltyBannerProps) {
  const threshold = settings?.subscriptionConfig?.activationThreshold || 5000;
  const percentage = settings?.subscriptionConfig?.rewardPercentage || 5;
  const [primaryColor, setPrimaryColor] = useState(0x0D8252);

  useEffect(() => {
    const root = document.documentElement;
    const temp = document.createElement('div');
    temp.style.color = 'var(--primary)';
    document.body.appendChild(temp);
    const computedColor = getComputedStyle(temp).color;
    document.body.removeChild(temp);

    const rgb = computedColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const hex = (parseInt(rgb[0]) << 16) | (parseInt(rgb[1]) << 8) | parseInt(rgb[2]);
      setPrimaryColor(hex);
    }
  }, []);

  return (
    <section className="py-12 bg-black text-white overflow-hidden relative">
      {/* Hyperspeed animated background */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => { },
            onSlowDown: () => { },
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0xFFFFFF,
              brokenLines: 0xFFFFFF,
              leftCars: [primaryColor, primaryColor, primaryColor],
              rightCars: [0xFFFFFF, 0xDDDDDD, 0xEEEEEE],
              sticks: primaryColor,
            }
          }}
        />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              Lifetime Rewards
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
              JOIN THE <span className="text-primary">ELYJEN</span> <br />
              LOYALTY CLUB
            </h2>
            <p className="text-gray-400 text-lg max-w-md">
              Unlock exclusive lifetime benefits. Spend <span className="text-white font-bold">৳{threshold}</span> once and earn <span className="text-primary font-bold">{percentage}% tokens</span> on every future purchase!
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-black font-black">
                <Link href="/shop">
                  SHOP & ACTIVATE NOW
                </Link>
              </Button>
              <Button asChild className="rounded-full px-8 h-12 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-bold transition-colors">
                <Link href="/register">
                  CREATE ACCOUNT
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Activate</h3>
              <p className="text-xs text-gray-500">Buy products worth ৳{threshold} in a single order.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Earn Tokens</h3>
              <p className="text-xs text-gray-500">Get {percentage}% back as tokens on every future order.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Save Big</h3>
              <p className="text-xs text-gray-500">Use tokens for instant discounts on your next checkout.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

