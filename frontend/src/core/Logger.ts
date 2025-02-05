/**
 * ELKにログを送信する
 */
export class Logger {
  private logstashUrl: string;
  constructor() {
    this.logstashUrl = import.meta.env.VITE_LOGSTASH_URL || 'http://localhost:50000';
  }

  public info(message: string) {
    console.info(message);
  }

  public log(message: string) {
    console.log(message);
  }

  public error(message: string) {
    console.error(message);
  }

  public warn(message: string) {
    console.warn(message);
  }
}
