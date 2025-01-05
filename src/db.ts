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
  order:number;
}

interface CategoryTotal extends Categories {
  totalAmount: number;
}

db.version(1).stores({
  transactions: '++id, category, desc, amount, date_time', 
  categories: '++id, &name, target_amt, bkg_color, tags'
})

// Define multiple tables (object stores) and their indexes
db.version(2).stores({
  transactions: '++id, category, desc, amount, date_time', 
  categories: '++id, &name, target_amt, bkg_color, tags'
}).upgrade(async (tx) => {
  await tx.table("categories").bulkAdd(
    [
      {
        name: "food",
        target_amt: 300,
        bkg_color: "#2D3047",
        tags: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        name: "transport",
        target_amt: 100,
        bkg_color: "#38726C",
        tags: ["Bus", "Cab", "train"],
      },
      {
        name: "leisure",
        target_amt: 200,
        bkg_color: "#B9314F",
        tags: [],
      },
    ],
    { allKeys: true }
  );
});

db.version(3).stores({
  transactions: '++id, category, desc, amount, date_time', 
  categories: '++id, &name, target_amt, bkg_color, tags'
}).upgrade(async (tx) => {
  await tx.table("categories").bulkAdd(
    [
      {
        name: "shopping",
        target_amt: 0,
        bkg_color: "#b9319a",
        tags: []
      },
      {
        name: "gifts",
        target_amt: 0,
        bkg_color: "#31b9b9",
        tags: []
      },
      {
        name: "misc",
        target_amt: 0,
        bkg_color: "#b9b931",
        tags: []
      },
    ],
    { allKeys: true }
  );
})

db.version(4).stores({
  transactions: '++id, category, desc, amount, date_time', 
  categories: '++id, &name, target_amt, bkg_color, tags,order'
}).upgrade(async (tx) => {
  const categories = await tx.table<Categories>("categories").toArray();

  // Sort categories by their existing order or by id if order is undefined
  categories.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

  // Update each category with the new ascending order
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    category.order = i + 1; // Assign new order starting from 1
    await tx.table("categories").put(category);
  }
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
