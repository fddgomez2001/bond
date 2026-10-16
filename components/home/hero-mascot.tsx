"use client";

import { useState } from "react";
import Image from "next/image";
import mascot from "@/public/brand/hero-mascot.png";

/**
 * The hero mascot fades in on its own transparent background once loaded.
 * (No blur placeholder: Next.js's blur fills transparent pixels with a dark
 * colour, which showed as a box behind the mascot.) It stays visible
 * without JavaScript — see .hero-mascot-img in globals.css.
 */
export function HeroMascot() {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={mascot}
      alt="BOND's mascot, a smiling monkey in a blue BOND cap carrying gifts, balloons and party treats"
      preload
      quality={85}
      sizes="(min-width: 1536px) 640px, (min-width: 1024px) 45vw, (min-width: 768px) 448px, (min-width: 640px) 416px, 84vw"
      onLoad={() => setLoaded(true)}
      data-loaded={loaded || undefined}
      className="hero-mascot-img h-auto w-full drop-shadow-[0_18px_24px_rgba(56,73,73,0.28)] select-none"
      draggable={false}
    />
  );
}
