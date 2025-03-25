// frontend/src/models/interface.ts

// ===== User =====
export interface IFriend {
  id: number;
  username: string;
  is_online: boolean;
}

export interface IRankingUser {
  username: string;
  level: number;
}
