type StorageKey = 'token';

class LocalStorage {
  /** User */
  getUserToken() {
    return this.getStorage('token');
  }
  removeUserToken() {
    this.removeStorage('token');
  }
  setUserToken(token: string) {
    this.setStorage('token', token);
  }

  private getStorage(key: StorageKey) {
    return localStorage.getItem(key);
  }

  private setStorage(key: StorageKey, value: string) {
    localStorage.setItem(key, value);
  }

  private removeStorage(key: StorageKey) {
    localStorage.removeItem(key);
  }
}

export const storage = new LocalStorage();
