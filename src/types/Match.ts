interface BasePlayer {
  id: number;
}

interface CompletedPlayer extends BasePlayer {
  position: number;
}

type ServerType = "standard" | "private" | "reserved";

interface BaseMatch {
  id: string;
  startTime: number;
  serverType: ServerType;
  expiresAt: Date;
}

type Dictionary = string;
type WordBombGameMode = string; // "default";
type WordBombGenerationType = string; // "default";

interface WordBombProperties {
  gameType: "word-bomb";
  dictionary: Dictionary;
  gameMode: WordBombGameMode;
  generationType: WordBombGenerationType;
}

interface OngoingWordBombMatch extends BaseMatch, WordBombProperties {
  status: "ongoing";
  players: BasePlayer[];
}

interface CompletedWordBombMatch extends BaseMatch, WordBombProperties {
  status: "completed";
  players: CompletedPlayer[];
  endTime: number;
  rounds: number;
  turns: number;
  elapsedTime: number;
}

export type OngoingMatch = OngoingWordBombMatch;
export type CompletedMatch = CompletedWordBombMatch;
export type Match = OngoingMatch | CompletedMatch;
