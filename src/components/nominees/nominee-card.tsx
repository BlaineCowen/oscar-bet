"use client";

import Image from "next/image";
import { cn, getNomineeImageUrl } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import predictions from "@/lib/oscars_predictions.json";
import { getNomineeName } from "@/lib/game-utils";

// Define the Oscar prediction data types
interface ActorPrediction {
  position: string;
  image: string;
  odds: string;
  actor: string;
  movie: string;
}

interface RegularPrediction {
  position: string;
  image: string;
  odds: string;
  name: string;
}

type PredictionItem = ActorPrediction | RegularPrediction;

interface Category {
  category: string;
  predictions: PredictionItem[];
}

// Define a local interface that no longer needs to include the image property
interface NomineeWithImage {
  id: string;
  name: string;
  odds: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the props for the NomineeCard component
export interface NomineeCardProps {
  nominee: any;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showOdds?: boolean;
  categoryName: string;
}

export function NomineeCard({
  nominee,
  isSelected = false,
  onClick,
  disabled = false,
  showOdds = false,
  categoryName,
}: NomineeCardProps) {
  // Get image URL based solely on nominee name and category name
  const imageUrl = getNomineeImageUrl(categoryName, getNomineeName(nominee));

  // Extract movie title for actor categories
  const movieTitle = useMemo(() => {
    // For nominees that have movie property directly
    if ("movie" in nominee && nominee.movie) {
      return nominee.movie;
    }

    // For nominees in the database that might have nested predictions
    if (
      categoryName?.toLowerCase().includes("actor") ||
      categoryName?.toLowerCase().includes("actress")
    ) {
      // Look through predictions to find matching entry with actor property
      const matchingPrediction = predictions.find((category) => {
        if (
          !category.category.toLowerCase().includes("actor") &&
          !category.category.toLowerCase().includes("actress")
        ) {
          return false;
        }

        const matchingNominee = category.predictions.find((pred) => {
          return (
            "actor" in pred && pred.actor.trim() === getNomineeName(nominee)
          );
        });

        return !!matchingNominee;
      });

      if (matchingPrediction) {
        const nomineeData = matchingPrediction.predictions.find(
          (pred) =>
            "actor" in pred && pred.actor.trim() === getNomineeName(nominee)
        );
        return nomineeData && "movie" in nomineeData ? nomineeData.movie : null;
      }
    }

    return null;
  }, [categoryName, nominee]);

  return (
    <div
      className={cn(
        "relative flex items-center p-3 rounded-lg border transition-all",
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-card border-border hover:border-primary/50",
        disabled
          ? "opacity-50 cursor-not-allowed hover:border-border"
          : "cursor-pointer"
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="flex items-center space-x-3 w-full">
        {/* Image with fallback */}
        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={getNomineeName(nominee)}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100px, 150px"
            unoptimized
            onError={(e) => {
              // If image fails to load, replace with fallback
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.classList.remove("hidden");
              }
            }}
          />
          <div className="hidden flex items-center justify-center h-full w-full text-muted-foreground">
            🎬
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {getNomineeName(nominee)}
            {movieTitle && (
              <span className="ml-1 italic text-muted-foreground">
                <span className="mx-1">·</span>
                {movieTitle}
              </span>
            )}
          </h3>
          {showOdds && (
            <p className="text-sm text-muted-foreground">
              Odds: x{nominee.odds}
            </p>
          )}
        </div>

        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// LargeNomineeCard component for detailed views
export function LargeNomineeCard({
  nominee,
  categoryName,
}: {
  nominee: any;
  categoryName: string;
}) {
  const imageUrl = getNomineeImageUrl(categoryName, getNomineeName(nominee));

  // Extract movie title for actor categories
  const movieTitle = useMemo(() => {
    // For nominees that have movie property directly
    if ("movie" in nominee && nominee.movie) {
      return nominee.movie;
    }

    // For nominees from predictions data
    if (
      categoryName?.toLowerCase().includes("actor") ||
      categoryName?.toLowerCase().includes("actress")
    ) {
      const matchingCategory = predictions.find(
        (cat) =>
          cat.category.toLowerCase().includes("actor") ||
          cat.category.toLowerCase().includes("actress")
      );

      if (matchingCategory) {
        const matchingNominee = matchingCategory.predictions.find(
          (pred) =>
            "actor" in pred && pred.actor.trim() === getNomineeName(nominee)
        );

        return matchingNominee && "movie" in matchingNominee
          ? matchingNominee.movie
          : null;
      }
    }

    return null;
  }, [categoryName, nominee]);

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-card">
      <div className="relative aspect-[3/4] w-full bg-muted">
        <Image
          src={imageUrl}
          alt={getNomineeName(nominee)}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
          priority
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg text-foreground">
          {getNomineeName(nominee)}
        </h3>
        {movieTitle && (
          <p className="text-muted-foreground italic">{movieTitle}</p>
        )}
        <div className="mt-2 flex items-center text-muted-foreground">
          <span className="text-sm">Odds: x{nominee.odds}</span>
        </div>
      </div>
    </div>
  );
}
