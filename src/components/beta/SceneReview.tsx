"use client";

import { Check, X } from "lucide-react";
import { SignIcon } from "@/components/scenes/SignIcon";
import { IntersectionScene } from "@/components/scenes/IntersectionScene";
import { RoundaboutScene } from "@/components/scenes/RoundaboutScene";
import { LocationScene } from "@/components/scenes/LocationScene";
import { GridScene } from "@/components/scenes/GridScene";
import { SignStripScene } from "@/components/scenes/SignStripScene";
import type { QuestionScene } from "@/lib/questions/types";

/** Read-only rendering of any question scene, with the correct answer(s)
 * highlighted — reuses the real practice-mode scene components in their
 * existing `disabled` + pre-selected-correct-answer state instead of a
 * separate renderer, so the tester sees exactly what a student sees. */
export function SceneReview({ scene }: { scene: QuestionScene }) {
  if (scene.kind === "SINGLE_CHOICE" || scene.kind === "MULTIPLE_CHOICE") {
    const correctIds = scene.kind === "SINGLE_CHOICE" ? [scene.correctOptionId] : scene.correctOptionIds;
    return (
      <div className="space-y-3">
        {scene.kind === "SINGLE_CHOICE" && scene.promptSignId && (
          <div className="flex justify-center">
            <SignIcon id={scene.promptSignId} size={88} />
          </div>
        )}
        {scene.kind === "SINGLE_CHOICE" && scene.promptImageUrl && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- review-only tool, same small fixed local SVG set as QuestionCard. */}
            <img src={scene.promptImageUrl} alt="" width={88} height={88} />
          </div>
        )}
        {scene.kind === "SINGLE_CHOICE" && scene.promptLocationScene && (
          <LocationScene location={scene.promptLocationScene.location} signs={scene.promptLocationScene.signs} />
        )}
        {scene.kind === "SINGLE_CHOICE" && scene.promptGridScene && (
          <GridScene gridSize={scene.promptGridScene.gridSize} tiles={scene.promptGridScene.tiles} signs={scene.promptGridScene.signs} />
        )}
        <div className="space-y-1.5">
          {scene.options.map((opt) => {
            const correct = correctIds.includes(opt.id);
            return (
              <div
                key={opt.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{
                  background: correct ? "color-mix(in srgb, var(--success-500) 12%, transparent)" : "var(--surface-muted)",
                  border: correct ? "2px solid var(--success-500)" : "2px solid transparent",
                }}
              >
                {opt.signId && <SignIcon id={opt.signId} size={24} />}
                <span className="flex-1">{opt.label}</span>
                {correct ? <Check size={16} color="var(--success-600)" /> : <X size={14} color="var(--foreground-muted)" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  switch (scene.sceneId) {
    case "intersection":
      return (
        <IntersectionScene
          actors={scene.actors}
          hasRightOfWaySign={scene.hasRightOfWaySign}
          selectedSlot={scene.correctSlot}
          correctSlot={scene.correctSlot}
          disabled
          onSelect={() => {}}
        />
      );
    case "traffic-light-intersection":
      return (
        <IntersectionScene
          actors={scene.actors}
          trafficLights={scene.trafficLights}
          selectedSlot={scene.correctSlot}
          correctSlot={scene.correctSlot}
          disabled
          onSelect={() => {}}
        />
      );
    case "roundabout":
      return (
        <RoundaboutScene
          armCount={scene.armCount}
          ringLanes={scene.ringLanes}
          sharkTeethArms={scene.sharkTeethArms}
          actors={scene.actors}
          selectedSlot={scene.correctSlot}
          correctSlot={scene.correctSlot}
          disabled
          onSelect={() => {}}
        />
      );
    case "location":
      return (
        <LocationScene
          location={scene.location}
          signs={scene.signs}
          trafficLight={scene.trafficLight}
          actors={scene.actors}
          selectedSlot={scene.correctSlot}
          correctSlot={scene.correctSlot}
          disabled
          onSelect={() => {}}
        />
      );
    case "grid":
      return (
        <GridScene
          gridSize={scene.gridSize}
          tiles={scene.tiles}
          signs={scene.signs}
          actors={scene.actors}
          selectedSlot={scene.correctSlot}
          correctSlot={scene.correctSlot}
          disabled
          onSelect={() => {}}
        />
      );
    case "sign-strip":
      return (
        <SignStripScene
          signs={scene.signs}
          selected={scene.correctSignId}
          correctSignId={scene.correctSignId}
          disabled
          onSelect={() => {}}
        />
      );
    default:
      return null;
  }
}
