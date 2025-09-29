/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import Dexie, { Table } from 'dexie';
import { LibraryItem } from '../types';

export class MyDatabase extends Dexie {
  public savedItems!: Table<LibraryItem, number>; 

  public constructor() {
    super('CajalFoundationsDB');
    // Fix: Cast `this` to Dexie to resolve a TypeScript type inference issue where the `version` method is not found on the subclass.
    (this as Dexie).version(1).stores({
      savedItems: '++id, content, timestamp',
    });
  }

  async addSavedItem(item: LibraryItem): Promise<number> {
    return this.savedItems.add(item);
  }

  async getAllSavedItems(): Promise<LibraryItem[]> {
    // Return sorted by most recent first
    return this.savedItems.orderBy('timestamp').reverse().toArray();
  }
  
  async deleteSavedItem(id: number): Promise<void> {
    return this.savedItems.delete(id);
  }
}

export const db = new MyDatabase();