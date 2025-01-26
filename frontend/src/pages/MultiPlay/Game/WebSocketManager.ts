export class WebSocketManager {
  // プロパティ管理
  private socket: WebSocket | null = null;
  private endpoint: string;
  private token: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(endpoint: string) {
      this.endpoint = endpoint;
      this.token = localStorage.getItem('token') || '';
  }

  // 接続管理
  connect(): void {
      try {
          const baseUrl = 'ws://127.0.0.1:3001/ws/pong';
          let wsUrl = '';

          // エンドポイントに応じてURLを構築
          if (this.endpoint === 'matchmaking') {
              wsUrl = `${baseUrl}/matchmaking/?token=${this.token}`;
          } else {
              // game_idとして使用
              wsUrl = `${baseUrl}/game/${this.endpoint}/?token=${this.token}`;
          }

          this.socket = new WebSocket(wsUrl);

          this.socket.onopen = () => {
              console.log('WebSocket connection established');
          };

          this.socket.onmessage = (event) => {
              try {
                  const data = JSON.parse(event.data);
                  const handler = this.messageHandlers.get(data.type);
                  if (handler) {
                      handler(data);
                  }
              } catch (error) {
                  console.error('Error parsing message:', error);
              }
          };

          this.socket.onclose = (event) => {
              if (!event.wasClean) {
                  console.error('WebSocket connection closed unexpectedly');
              } else {
                  console.log('WebSocket connection closed cleanly');
              }
          };

          this.socket.onerror = (error) => {
              console.error('WebSocket error:', error);
              this.handleError('Connection error occurred');
          };

      } catch (error) {
          console.error('Failed to establish WebSocket connection:', error);
          this.handleError('Failed to connect to server');
      }
  }

  private handleError(message: string): void {
      const errorHandler = this.messageHandlers.get('error');
      if (errorHandler) {
          errorHandler({ type: 'error', message });
      }
  }

  // メッセージ管理
  addMessageHandler(type: string, handler: (data: any) => void): void {
      this.messageHandlers.set(type, handler);
  }

  sendMessage(type: string, data: any): void {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          try {
              this.socket.send(JSON.stringify({
                  type,
                  ...data
              }));
          } catch (error) {
              console.error('Error sending message:', error);
              this.handleError('Failed to send message');
          }
      } else {
          this.handleError('Connection not established');
      }
  }

  disconnect(): void {
      if (this.socket) {
          this.socket.close();
          this.socket = null;
      }
  }
}