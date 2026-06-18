import { HoloAvatar } from "@/components/avatar/HoloAvatar";
import type { HoloAvatarState } from "@/components/avatar/types";
import type { HologramAgentState, HologramResultStatus } from "./types";

function mapHologramAvatarState(
  state: HologramAgentState,
  resultStatus?: HologramResultStatus
): HoloAvatarState {
  if (state !== "result") return state;
  if (resultStatus === "success") return "result-success";
  if (resultStatus === "failed") return "result-error";
  return "result-warning";
}

export function AssistantAvatar({
  state,
  resultStatus
}: {
  state: HologramAgentState;
  resultStatus?: HologramResultStatus;
}) {
  const avatarState = mapHologramAvatarState(state, resultStatus);
  const speaking = state === "listening" || state === "running";

  return (
    <div className="assistant-avatar">
      <HoloAvatar state={avatarState} speaking={speaking} />
    </div>
  );
}
