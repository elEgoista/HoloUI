export type VoiceIntent = "confirm" | "cancel" | "edit" | "task";

export function normalizeVoiceTranscript(transcript: string) {
  return transcript
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^codex[:,]?\s*/i, "");
}

export function classifyVoiceIntent(transcript: string): VoiceIntent {
  const normalized = normalizeVoiceTranscript(transcript).toLowerCase();

  if (/^(confirm|send|send to codex|подтвердить|отправить|да|запускай)$/.test(normalized)) {
    return "confirm";
  }

  if (/^(cancel|stop|отмена|отменить|стоп|нет)$/.test(normalized)) {
    return "cancel";
  }

  if (/^(edit|edit command|изменить|редактировать)$/.test(normalized)) {
    return "edit";
  }

  return "task";
}
