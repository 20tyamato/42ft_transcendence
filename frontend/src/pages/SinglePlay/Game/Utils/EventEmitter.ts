// FIXME: このファイルのlintを修正しようとすると画面が真っ白になる
import { logger } from '@/core/Logger';

export default class EventEmitter {
  private callbacks: { [namespace: string]: { [event: string]: Function[] } } = { base: {} };

  on(names: string, callback: Function): this {
    if (!names || !callback) {
      logger.warn('Invalid event name or callback');
      return this;
    }

    names.split(' ').forEach((name) => {
      const { namespace, value } = this.resolveName(name);
      if (!this.callbacks[namespace]) this.callbacks[namespace] = {};
      if (!this.callbacks[namespace][value]) this.callbacks[namespace][value] = [];
      this.callbacks[namespace][value].push(callback);
    });

    return this;
  }

  off(names: string): this {
    if (!names) {
      logger.warn('Invalid event name');
      return this;
    }

    names.split(' ').forEach((name) => {
      const { namespace, value } = this.resolveName(name);
      if (value === '' && namespace !== 'base') delete this.callbacks[namespace];
      else if (this.callbacks[namespace]) delete this.callbacks[namespace][value];
    });

    return this;
  }

  trigger(name: string, args: unknown[] = []): unknown {
    if (!name) {
      logger.warn('Invalid event name');
      return null;
    }

    const { namespace, value } = this.resolveName(name);
    let finalResult: unknown = null;

    if (namespace === 'base') {
      for (const ns in this.callbacks) {
        this.callbacks[ns]?.[value]?.forEach((callback) => {
          finalResult = callback(...args);
        });
      }
    } else {
      this.callbacks[namespace]?.[value]?.forEach((callback) => {
        finalResult = callback(...args);
      });
    }

    return finalResult;
  }

  private resolveName(name: string): { namespace: string; value: string } {
    const [value, namespace = 'base'] = name.split('.');
    return { namespace, value };
  }
}
