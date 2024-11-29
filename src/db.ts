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
  bkg_color:string;
  tags: string[];
}

interface CategoryTotal extends Categories {
  totalAmount: number;
}

// Define multiple tables (object stores) and their indexes
db.version(2).stores({
  transactions: '++id, category, desc, amount, date_time', 
  categories: '++id, &name, target_amt, bkg_color, tags'
})  .upgrade(async (tx) => {
  // Access all existing data in the `expenses` table
  const categories = await tx.table('categories').toArray();

  // Rewrite the data without `oldField`
  const transformedExpenses = categories.map(({ current_amt, ...rest }) => rest);
  console.log(transformedExpenses)
  // Clear the table and bulk add transformed data
  const expensesTable = tx.table('categories');
  await expensesTable.clear();
  await expensesTable.bulkAdd(transformedExpenses);
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

export async function getTotalTransactionAmountByCategoryWithinMonth(selectedDate: Date) {
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
  // Fetch all transactions
  const transactions = await db.table("transactions")
  .where('date_time')
  .between(startOfMonth, endOfMonth, true, true).toArray();
  const categories: Categories[] = await db.table("categories").toArray();

   // Create a lookup map for category details
  const categoryMap: Record<string, Categories> = categories.reduce((acc, category) => {
    acc[category.name] = category;
    return acc;
  }, {} as Record<string, Categories>);

  // Group transactions by category and calculate total amount
  const totals: Record<string, CategoryTotal> = transactions.reduce((acc, transaction) => {
    const { category, amount } = transaction;

    // Initialize the category in the totals if not already present
    if (!acc[category]) {
      const categoryDetails = categoryMap[category];
      if (categoryDetails) {
        acc[category] = {
          ...categoryDetails,
          totalAmount: 0,
        };
      } else {
        // Handle missing categories gracefully
        throw new Error(`Category "${category}" not found in categories table.`);
      }
    }

    // Increment the total amount for the category
    acc[category].totalAmount += amount;

    return acc;
  }, {} as Record<string, CategoryTotal>);

  return totals;
}

export type {Transactions,Categories,CategoryTotal}
export default db;
