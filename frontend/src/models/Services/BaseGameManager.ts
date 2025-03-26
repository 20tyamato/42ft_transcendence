// frontend/src/models/Services/BaseGameManager.ts
import { logger } from '@/core/Logger';
import { IGameConfig, IGameState, IMoveConfig } from '../Game/type';
import { InputHandlerService } from './InputHandlerService';
import { WebSocketService } from './WebSocketService';

export abstract class BaseGameManager {
  protected wsService: WebSocketService;
  protected inputHandler: InputHandlerService;
  protected config: IGameConfig;
  protected currentPosition: number = 0;
  protected isActive: boolean = true;

  constructor(config: IGameConfig) {
    this.config = {
      ...config,
      moveAmount: config.moveAmount || 10,
    };

    this.wsService = new WebSocketService(this.handleConnectionError.bind(this));

    const moveConfig: IMoveConfig = {
      currentPosition: this.currentPosition,
      moveAmount: this.config.moveAmount || 10,
      isPlayer1: this.config.isPlayer1,
    };

    this.inputHandler = new InputHandlerService(moveConfig);
  }

  async init(): Promise<void> {
    // WebSocket接続
    try {
      await this.wsService.connect(this.config.wsEndpoint);

      // メッセージハンドラの登録
      this.wsService.addMessageHandler('state_update', this.handleStateUpdate.bind(this));
      this.wsService.addMessageHandler(
        'player_disconnected',
        this.handlePlayerDisconnected.bind(this)
      );
      this.wsService.addMessageHandler('error', this.handleError.bind(this));

      // 入力ハンドラの初期化
      this.inputHandler.init(this.handleMovement.bind(this));

      await this.onInitialized();
      logger.log('Game manager initialized successfully:', {
        sessionId: this.config.sessionId,
        username: this.config.username,
        isPlayer1: this.config.isPlayer1,
      });
    } catch (error) {
      logger.error('Failed to initialize game:', error);
      this.handleConnectionError();
    }
  }

  protected handleMovement(newPosition: number): void {
    if (this.wsService.isConnected() && this.isActive) {
      this.wsService.send({
        type: 'move',
        username: this.config.username,
        position: newPosition,
      });
    }
  }

  protected handleStateUpdate(data: { state: IGameState }): void {
    this.onStateUpdate(data.state);

    // ゲーム終了チェック
    if (!data.state.is_active && this.isActive) {
      this.isActive = false;
      this.handleGameEnd(data);
    }
  }

  protected handlePlayerDisconnected(data: {
    disconnected_player: string;
    state: IGameState;
  }): void {
    this.isActive = false;
    this.onPlayerDisconnected(data.disconnected_player, data.state);
  }

  protected handleError(data: { message: string }): void {
    logger.error('Game error:', data.message);
    this.onError(data.message);
  }

  protected handleConnectionError(): void {
    this.isActive = false;
    this.onConnectionError();
  }

  protected handleGameEnd(data: { state: IGameState }): void {
    this.onGameEnd(data);
  }

  public cleanup(): void {
    this.isActive = false;
    this.inputHandler.cleanup();
    this.wsService.disconnect();
    this.onCleanup();
  }

  // サブクラスで実装するメソッド
  protected abstract onInitialized(): Promise<void>;
  protected abstract onStateUpdate(state: IGameState): void;
  protected abstract onPlayerDisconnected(player: string, state: IGameState): void;
  protected abstract onConnectionError(): void;
  protected abstract onError(message: string): void;
  protected abstract onGameEnd(data: { state: IGameState }): void;
  protected abstract onCleanup(): void;
}
