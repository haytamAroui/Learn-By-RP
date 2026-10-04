/**
 * The subset of IndexedDB this archive uses.
 *
 * Declared locally rather than pulling `lib: dom` into the project tsconfig: the
 * native build has no IndexedDB, and widening the global lib would make every
 * other file quietly able to reference `document` and `window`. Anything added to
 * the web repository has to be added here too, which keeps the boundary explicit.
 *
 * Only the members actually used are declared. `IDBValidKey` is `any` because the
 * real type is a recursive union over string/number/date/array and nothing here
 * depends on which.
 */

export type IDBValidKey = any;

export interface IDBRequest<T> {
  result: T;
  error: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

export interface IDBObjectStore {
  get(key: IDBValidKey): IDBRequest<any>;
  getAll(): IDBRequest<any[]>;
  put(value: unknown, key?: IDBValidKey): void;
  delete(key: IDBValidKey): void;
  clear(): void;
}

export interface IDBTransaction {
  abort(): void;
  objectStore(name: string): IDBObjectStore;
  oncomplete: (() => void) | null;
  onabort: (() => void) | null;
  onerror: (() => void) | null;
  error: unknown;
}

export interface IDBDatabase {
  /** Releases the connection. An open connection blocks upgrades and deletes. */
  close(): void;
  transaction(names: string[], mode: 'readonly' | 'readwrite'): IDBTransaction;
  createObjectStore(name: string): IDBObjectStore;
  objectStoreNames: { contains(name: string): boolean };
}

export interface IDBOpenRequest extends IDBRequest<IDBDatabase> {
  onupgradeneeded: (() => void) | null;
  onblocked: (() => void) | null;
}

export interface IDBOpenDeleteRequest extends IDBRequest<undefined> {
  onblocked: (() => void) | null;
}

export interface IDBFactory {
  open(name: string, version: number): IDBOpenRequest;
  deleteDatabase(name: string): IDBOpenDeleteRequest;
}

declare const indexedDB: IDBFactory | undefined;
