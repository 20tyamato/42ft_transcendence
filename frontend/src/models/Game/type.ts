export enum GameAILevel {
  EASY = 1,
  MEDIUM = 3,
  HARD = 5,
  ONI = 10,
}

export interface IGameState {
  ball: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    velocity: {
      x: number;
      y: number;
      z: number;
    };
  };
  players: {
    [key: string]: {
      x: number;
      z: number;
    };
  };
  score: {
    [key: string]: number;
  };
  is_active: boolean;
}

export interface IWSMessageHandler {
  (data: any): void;
}

export interface IMoveConfig {
  currentPosition: number;
  moveAmount: number;
  isPlayer1: boolean;
}

export interface IGameConfig {
  sessionId: string;
  username: string;
  isPlayer1: boolean;
  wsEndpoint: string;
  moveAmount?: number;
}

export interface IGameResult {
  player1: number;
  player2: number;
  ai_level?: GameAILevel;
  opponent?: string;
  disconnected?: boolean;
  disconnectedPlayer?: string;
  sessionId?: string;
}

export type IGameMode = 'singleplayer' | 'multiplayer' | 'tournament';

// ===== Tournament =====
export interface ITournamentInfo {
  tournamentId: string;
  roundType: string;
  matchNumber?: number;
}