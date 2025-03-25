export class Logger {
  private _logstashUrl: string;
  constructor() {
    this._logstashUrl = (import.meta as ImportMeta).env.VITE_LOGSTASH_URL;
  }

  public async info(message: string, ...args: unknown[]) {
    console.info(message, ...args);
    await this._sendToLogstash('info', message);
  }

  public async log(message: string, ...args: unknown[]) {
    console.log(message, ...args);
    await this._sendToLogstash('log', message);
  }

  public async error(message: string, ...args: unknown[]) {
    console.error(message, ...args);
    await this._sendToLogstash('error', message);
  }

  public async warn(message: string, ...args: unknown[]) {
    console.warn(message, ...args);
    await this._sendToLogstash('warn', message);
  }

  private async _sendToLogstash(level: string, message: string) {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        level,
        message,
        application: 'frontend',
      };

      await fetch(this._logstashUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      // エラーが発生した場合はコンソールにフォールバック
      logger.error('Logstashへの送信に失敗:', error);
    }
  }
}

export const logger = new Logger();
