/** 
 * ELKにログを送信する
 */
export class Logger {
  constructor() {
  }

  info(message:string) {
    console.info(message);
  }
  
  log(message: string) {
    console.log(message);
  }

  error(message: string) {
    console.error(message);
  }

  warn(message: string) {
    console.warn(message);
  }
}
