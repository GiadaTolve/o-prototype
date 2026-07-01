"use client";

import type { PendingLevelUpBanner } from "@domain/progression/level-up";
import { LevelUpBanner } from "./LevelUpBanner";

type Props = {
  pending: PendingLevelUpBanner;
  visible: boolean;
  onSkiru: () => void;
  onSalta: () => void;
};

export function LevelUpOverlay({ pending, visible, onSkiru, onSalta }: Props) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-[2px] animate__animated animate__fadeIn motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      <div id="level-up-title" className="sr-only">
        Level up — livello {pending.levelLabel}
      </div>
      <LevelUpBanner
        levelLabel={pending.levelLabel}
        grade={pending.grade}
        expCurrent={pending.expIntoLevel}
        expNeeded={pending.expNeededForNext}
        keys={pending.keysAwarded}
        expSpendableNote={`+${pending.expGained} EXP spendibile`}
        onInvestSkiru={onSkiru}
        onSalta={onSalta}
      />
    </div>
  );
}
