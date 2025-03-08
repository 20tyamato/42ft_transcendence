type StorageKey = 'token' | 'username';

class LocalStorage {
  getUserToken() {
    return this.getStorage('token');
  }

  private getStorage(key: StorageKey) {
    return localStorage.getItem(key);
  }

  private setStorage(key: StorageKey, value: string) {
    localStorage.setItem(key, value);
  }
}

export const storage = new LocalStorage();
