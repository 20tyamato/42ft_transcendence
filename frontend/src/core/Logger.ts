/**
 * ELKにログを送信する
 */
export class Logger {
  constructor() {}

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
