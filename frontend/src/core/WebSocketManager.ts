// frontend/src/core/WebSocketManager.ts

import { EventEmitter } from './EventEmitter';
import { Logger } from './Logger';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketManager extends EventEmitter {
  private socket: WebSocket | null = null;
  private logger: Logger;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor() {
    super();
    this.logger = new Logger();
  }

  /**
   * WebSocket接続を確立
   * @param url WebSocketのURL
   */
  public connect(url: string): void {
    try {
      this.socket = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      this.logger.error('Failed to create WebSocket connection:', error);
      this.emit('error', 'Failed to create connection');
    }
  }

  /**
   * WebSocket接続を切断
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * メッセージを送信
   * @param message 送信するメッセージ
   */
  public send(message: WebSocketMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.logger.error('WebSocket is not connected');
      this.emit('error', 'WebSocket is not connected');
      return;
    }

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      this.emit('error', 'Failed to send message');
    }
  }

  /**
   * 接続状態を取得
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * WebSocketのイベントハンドラを設定
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.logger.info('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onclose = () => {
      this.logger.info('WebSocket disconnected');
      this.emit('disconnected');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      this.logger.error('WebSocket error:', error);
      this.emit('error', 'Connection error occurred');
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.emit(message.type, message);
      } catch (error) {
        this.logger.error('Failed to parse message:', error);
        this.emit('error', 'Failed to parse message');
      }
    };
  }

  /**
   * 再接続を試みる
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('Max reconnection attempts reached');
      this.emit('error', 'Failed to reconnect');
      return;
    }

    this.reconnectAttempts++;
    this.logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
    
    // 再接続試行の前に少し待機
    setTimeout(() => {
      if (this.socket?.url) {
        this.connect(this.socket.url);
      }
    }, 1000 * this.reconnectAttempts); // 試行回数に応じて待機時間を増やす
  }
}