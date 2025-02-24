// frontend/src/models/Tournament/repository.ts
import { WS_URL } from '@/config/config';

export class TournamentRepository {
  private socket: WebSocket | null = null;
  private sessionId: string | null = null;

  // WebSocket接続を確立
  connect(onMessage: (data: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${WS_URL}/ws/tournament/`);

        this.socket.onopen = () => {
          console.log('Tournament WebSocket connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          onMessage(data);
        };

        this.socket.onerror = (error) => {
          console.error('Tournament WebSocket error:', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('Tournament WebSocket closed');
          this.socket = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // WebSocket切断
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // トーナメントに参加
  joinTournament(): void {
    if (!this.socket) return;

    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found');
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: 'join_tournament',
        username: username,
      })
    );
  }

  // Ready状態を送信
  sendReady(isReady: boolean): void {
    if (!this.socket) {
      console.error('WebSocket connection not established');
      return;
    }

    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found');
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: 'player_ready',
        username: username,
        isReady: isReady,
        sessionId: this.sessionId,
      })
    );
  }

  // トーナメントから離脱
  leaveTournament(): void {
    if (!this.socket) return;

    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found');
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: 'leave_tournament',
        username: username,
      })
    );
  }

  // セッションIDを設定
  setSessionId(id: string): void {
    this.sessionId = id;
  }

  // セッションIDを取得
  getSessionId(): string | null {
    return this.sessionId;
  }

  // WebSocketの状態を確認
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// シングルトンインスタンスをエクスポート
export const tournamentRepository = new TournamentRepository();
