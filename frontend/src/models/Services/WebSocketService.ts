// frontend/src/models/Services/WebSocketService.ts
import { logger } from '@/core/Logger';
import { IWSMessageHandler } from '../Game/type';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, IWSMessageHandler[]> = new Map();
  private url: string = '';

  constructor(private connectionErrorHandler?: () => void) {}

  async connect(url: string): Promise<void> {
    this.url = url;
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          logger.info('WebSocket connected:', { url, timestamp: new Date().toISOString() });
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.socket.onerror = (error) => {
          logger.error('WebSocket error:', error);
          if (this.connectionErrorHandler) {
            this.connectionErrorHandler();
          }
          reject(error);
        };

        this.socket.onclose = () => {
          logger.info('WebSocket connection closed:', {
            url: this.url,
            timestamp: new Date().toISOString(),
          });
          this.socket = null;
        };
      } catch (error) {
        logger.error('Error establishing WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const messageType = data.type;

      if (this.messageHandlers.has(messageType)) {
        const handlers = this.messageHandlers.get(messageType) || [];
        for (const handler of handlers) {
          handler(data);
        }
      }
    } catch (e) {
      logger.error('Error handling WebSocket message:', e);
    }
  }

  addMessageHandler(type: string, handler: IWSMessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  removeMessageHandler(type: string, handler: IWSMessageHandler): void {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type) || [];
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  send(message: Record<string, unknown>): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      logger.error('WebSocket not connected', { url: this.url, message });
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.messageHandlers.clear();
    }
  }
}
