export interface IFriend {
id: number;
username: string;
is_online: boolean;
}

export interface IUserData {
display_name: string;
email: string;
avatar?: string;
language?: string;
}

export interface IRankingUser {
username: string;
level: number;
}


export interface ITournamentHistory {
    date: string;
    result: string;
  }
  
  export interface IBlockchainScore {
    txHash: string;
    score: number;
  }

  export interface IGameScore {
    player1: number;
    player2: number;
  }
