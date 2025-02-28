"use client";

import { Coffee } from "lucide-react";
import Link from "next/link";

export function CoffeeSupport() {
  return (
    <Link
      href="https://buymeacoffee.com/blainecowen"
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center overflow-hidden rounded-full bg-primary/50 text-white shadow-lg transition-all duration-300 hover:w-[160px] hover:bg-primary/90 md:bottom-8 md:right-8"
    >
      <Coffee className="h-4 w-4 min-w-[16px] ml-3" />
      <span className="px-3 text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Buy me a coffee
      </span>
    </Link>
  );
}
