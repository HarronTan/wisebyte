// src/db.js
import Dexie from 'dexie';

// Create a new Dexie database instance
const db = new Dexie('database');

interface Transactions {
  id:number;
  category:string;
  desc:string;
  amount:number;
  date_time:Date;
}

interface Categories {
  id:number;
  name:string;
  target_amt:number;
  current_amt:number;
  bkg_color:string;
}

// Define multiple tables (object stores) and their indexes
db.version(1).stores({
  transactions: '++id, category, desc, amount, date_time', 
  categories: '++id, &name, target_amt, current_amt, bkg_color'
});

export async function getTransactionWithinMonth(selectedDate: Date): Promise<Transactions[]> {
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
  try {
    const results = await db.table("transactions")
      .where('date_time')
      .between(startOfMonth, endOfMonth, true, true).reverse().toArray(); // Include bounds

    return results;
  } catch (error) {
    console.error('Error querying transactions:', error);
    return [];
  }
}


export type {Transactions,Categories}
export default db;
