import { ChatSkeleton } from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          <ChatSkeleton />
        </div>
      </div>
    </div>
  );
}
