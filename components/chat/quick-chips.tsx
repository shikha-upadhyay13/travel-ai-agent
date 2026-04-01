interface QuickChipsProps {
  chips: string[];
  onChipClick?: (chip: string) => void;
}

export function QuickChips({ chips, onChipClick }: QuickChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onChipClick?.(chip)}
          className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary-light active:scale-95"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
