import { TrainCard, type TrainResult } from "./train-card";
import { BookingStatusCard, type BookingStatus } from "./booking-status-card";
import { StayCard, type StayResult } from "./stay-card";
import { QuickChips } from "./quick-chips";

export type MessageType = "text" | "train_results" | "booking_status" | "stay_suggestions" | "chips";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string | null;
  type: MessageType;
  metadata?: {
    results?: TrainResult[];
    booking?: BookingStatus;
    stays?: StayResult[];
    chips?: string[];
  };
}

interface MessageBubbleProps {
  message: ChatMessage;
  onChipClick?: (chip: string) => void;
  onTrainSelect?: (index: number) => void;
}

export function MessageBubble({ message, onChipClick, onTrainSelect }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (message.type === "chips" && message.metadata?.chips) {
    return (
      <div className="ml-12 animate-fade-in-up">
        <QuickChips chips={message.metadata.chips} onChipClick={onChipClick} />
      </div>
    );
  }

  if (message.type === "train_results" && message.metadata?.results) {
    return (
      <div className="ml-12 animate-fade-in-up">
        <TrainCard results={message.metadata.results} onSelect={onTrainSelect} />
      </div>
    );
  }

  if (message.type === "booking_status" && message.metadata?.booking) {
    return (
      <div className="ml-12 animate-fade-in-up">
        <BookingStatusCard booking={message.metadata.booking} />
      </div>
    );
  }

  if (message.type === "stay_suggestions" && message.metadata?.stays) {
    return (
      <div className="ml-12 animate-fade-in-up">
        <StayCard stays={message.metadata.stays} />
      </div>
    );
  }

  // Text messages
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-input-bg px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary text-xs font-bold text-white">
        Y
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-blue-light px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
        {message.content}
      </div>
    </div>
  );
}
