"use client";

import type { AccountType } from "@sonafrik/types";
import { ACCOUNT_TYPE_OPTIONS } from "@sonafrik/types";
import { cn } from "@sonafrik/ui/server";

interface AccountTypeSelectorProps {
  value: AccountType | null;
  onChange: (value: AccountType) => void;
}

export function AccountTypeSelector({ value, onChange }: AccountTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Comment voulez-vous utiliser SONAFRIK ?">
      <p className="text-center text-lg font-semibold text-texte-principal">
        Comment voulez-vous utiliser SONAFRIK ?
      </p>
      {ACCOUNT_TYPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300",
            value === option.value
              ? "border-vert-energie bg-vert-energie/10"
              : "border-bordure bg-card hover:border-vert-energie/40",
          )}
        >
          <span className="text-2xl" aria-hidden="true">
            {option.emoji}
          </span>
          <div>
            <p className="font-semibold text-texte-principal">{option.label}</p>
            <p className="text-sm text-texte-secondaire">{option.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
