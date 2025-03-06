// frontend/src/models/Services/InputHandlerService.ts

import { IMoveConfig } from '../Game/type';

export type MoveCallback = (newPosition: number) => void;

export class InputHandlerService {
  private keyState: Record<string, boolean> = {
    ArrowLeft: false,
    ArrowRight: false,
  };
  private moveCallback: MoveCallback | null = null;
  private config: IMoveConfig;

  constructor(config: IMoveConfig) {
    this.config = config;
  }

  init(moveCallback: MoveCallback): void {
    this.moveCallback = moveCallback;
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.moveCallback = null;
  }

  setPosition(position: number): void {
    this.config.currentPosition = position;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      this.keyState[e.key] = true;
      e.preventDefault();
      this.sendMovement();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      this.keyState[e.key] = false;
      e.preventDefault();
      this.sendMovement();
    }
  };

  private sendMovement(): void {
    if (!this.moveCallback) return;

    let movement = 0;
    if (this.keyState.ArrowLeft) movement -= this.config.moveAmount;
    if (this.keyState.ArrowRight) movement += this.config.moveAmount;

    // プレイヤー2の場合は反転
    if (!this.config.isPlayer1) movement *= -1;

    if (movement !== 0) {
      const newPosition = this.config.currentPosition + movement;
      this.config.currentPosition = newPosition;
      this.moveCallback(newPosition);
    }
  }
}
