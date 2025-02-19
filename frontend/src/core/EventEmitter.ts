// frontend/src/core/EventEmitter.ts
// NOTE: イベント管理機能を持つ基底クラス
type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private listeners: Map<string, Set<EventHandler>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * イベントリスナーを登録
   * @param event イベント名
   * @param handler イベントハンドラ
   */
  public on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * イベントリスナーを削除
   * @param event イベント名
   * @param handler イベントハンドラ
   */
  public off(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.delete(handler);
    if (this.listeners.get(event)!.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * イベントの発火
   * @param event イベント名
   * @param args イベントハンドラに渡す引数
   */
  public emit(event: string, ...args: any[]): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * 1回だけ実行されるイベントリスナーを登録
   * @param event イベント名
   * @param handler イベントハンドラ
   */
  public once(event: string, handler: EventHandler): void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      handler(...args);
    };
    this.on(event, wrapper);
  }

  /**
   * 特定のイベントのすべてのリスナーを削除
   * @param event イベント名
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 登録されているリスナーの数を取得
   * @param event イベント名
   * @returns リスナーの数
   */
  public listenerCount(event: string): number {
    return this.listeners.has(event) ? this.listeners.get(event)!.size : 0;
  }
}