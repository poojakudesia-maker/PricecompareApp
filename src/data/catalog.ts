import type { PlatformId } from './platforms';

export type Category =
  | 'Dairy & Eggs'
  | 'Fruits & Vegetables'
  | 'Bakery'
  | 'Staples'
  | 'Snacks'
  | 'Beverages'
  | 'Instant Food'
  | 'Personal Care'
  | 'Household';

export interface Product {
  id: string;
  name: string;
  brand: string;
  size: string;
  category: Category;
  emoji: string;
  /** Pastel tile colour behind the emoji. */
  tint: string;
  mrp: number;
  /** Extra words people type: Hindi names, misspellings, generic terms. */
  aliases?: string[];
  /** Platforms that don't list this SKU at all. */
  notListedOn?: PlatformId[];
  /** Platforms that list it but are currently out of stock. */
  outOfStockOn?: PlatformId[];
}

export const CATALOG: Product[] = [
  { id: 'amul-taaza-500', name: 'Amul Taaza Toned Milk', brand: 'Amul', size: '500 ml', category: 'Dairy & Eggs', emoji: '🥛', tint: '#E0F2FE', mrp: 28, aliases: ['doodh', 'milk pouch'] },
  { id: 'amul-gold-1l', name: 'Amul Gold Full Cream Milk', brand: 'Amul', size: '1 L', category: 'Dairy & Eggs', emoji: '🥛', tint: '#FEF9C3', mrp: 68, aliases: ['doodh', 'full cream'], outOfStockOn: ['amazonnow'] },
  { id: 'mother-dairy-curd-400', name: 'Mother Dairy Classic Curd', brand: 'Mother Dairy', size: '400 g', category: 'Dairy & Eggs', emoji: '🥣', tint: '#F1F5F9', mrp: 50, aliases: ['dahi', 'yogurt'] },
  { id: 'amul-butter-100', name: 'Amul Salted Butter', brand: 'Amul', size: '100 g', category: 'Dairy & Eggs', emoji: '🧈', tint: '#FEF3C7', mrp: 60, aliases: ['makhan'] },
  { id: 'amul-paneer-200', name: 'Amul Fresh Paneer', brand: 'Amul', size: '200 g', category: 'Dairy & Eggs', emoji: '🧀', tint: '#FFFBEB', mrp: 95, aliases: ['cottage cheese'], outOfStockOn: ['bbdaily'] },
  { id: 'eggs-white-6', name: 'Farm Fresh White Eggs', brand: 'Eggoz', size: '6 pcs', category: 'Dairy & Eggs', emoji: '🥚', tint: '#FFF7ED', mrp: 72, aliases: ['anda', 'egg'] },
  { id: 'banana-robusta-6', name: 'Banana Robusta', brand: 'Fresh', size: '6 pcs', category: 'Fruits & Vegetables', emoji: '🍌', tint: '#FEF9C3', mrp: 60, aliases: ['kela', 'bananas'], notListedOn: ['amazonnow'] },
  { id: 'onion-1kg', name: 'Onion', brand: 'Fresh', size: '1 kg', category: 'Fruits & Vegetables', emoji: '🧅', tint: '#FCE7F3', mrp: 55, aliases: ['pyaaz', 'pyaz', 'kanda'] },
  { id: 'tomato-500', name: 'Tomato Hybrid', brand: 'Fresh', size: '500 g', category: 'Fruits & Vegetables', emoji: '🍅', tint: '#FEE2E2', mrp: 40, aliases: ['tamatar'], outOfStockOn: ['zepto'] },
  { id: 'potato-1kg', name: 'Potato', brand: 'Fresh', size: '1 kg', category: 'Fruits & Vegetables', emoji: '🥔', tint: '#FEF3C7', mrp: 45, aliases: ['aloo', 'alu'] },
  { id: 'apple-shimla-4', name: 'Shimla Apple', brand: 'Fresh', size: '4 pcs', category: 'Fruits & Vegetables', emoji: '🍎', tint: '#FEE2E2', mrp: 180, aliases: ['seb', 'apples'], notListedOn: ['milkbasket'] },
  { id: 'britannia-bread-400', name: 'Britannia Whole Wheat Bread', brand: 'Britannia', size: '400 g', category: 'Bakery', emoji: '🍞', tint: '#FFEDD5', mrp: 55, aliases: ['bread', 'brown bread'] },
  { id: 'harvest-gold-bread', name: 'Harvest Gold White Bread', brand: 'Harvest Gold', size: '350 g', category: 'Bakery', emoji: '🍞', tint: '#FEF3C7', mrp: 45, aliases: ['bread', 'sandwich bread'], notListedOn: ['amazonnow'] },
  { id: 'aashirvaad-atta-5', name: 'Aashirvaad Shudh Chakki Atta', brand: 'Aashirvaad', size: '5 kg', category: 'Staples', emoji: '🌾', tint: '#FEF3C7', mrp: 295, aliases: ['atta', 'wheat flour', 'aata'] },
  { id: 'tata-salt-1kg', name: 'Tata Salt Iodised', brand: 'Tata', size: '1 kg', category: 'Staples', emoji: '🧂', tint: '#F1F5F9', mrp: 28, aliases: ['namak', 'salt'] },
  { id: 'fortune-oil-1l', name: 'Fortune Sunlite Refined Sunflower Oil', brand: 'Fortune', size: '1 L', category: 'Staples', emoji: '🫗', tint: '#FEF9C3', mrp: 175, aliases: ['tel', 'cooking oil', 'sunflower oil'] },
  { id: 'india-gate-basmati-1kg', name: 'India Gate Basmati Rice Classic', brand: 'India Gate', size: '1 kg', category: 'Staples', emoji: '🍚', tint: '#F8FAFC', mrp: 220, aliases: ['chawal', 'rice', 'basmati'], notListedOn: ['milkbasket'] },
  { id: 'tata-sampann-toor-1kg', name: 'Tata Sampann Toor Dal', brand: 'Tata Sampann', size: '1 kg', category: 'Staples', emoji: '🫘', tint: '#FEF3C7', mrp: 210, aliases: ['arhar dal', 'dal', 'daal'] },
  { id: 'maggi-masala-4', name: 'Maggi 2-Minute Masala Noodles', brand: 'Nestlé', size: '4 x 70 g', category: 'Instant Food', emoji: '🍜', tint: '#FEF9C3', mrp: 60, aliases: ['noodles', 'maggie'] },
  { id: 'kissan-ketchup-950', name: 'Kissan Fresh Tomato Ketchup', brand: 'Kissan', size: '950 g', category: 'Instant Food', emoji: '🥫', tint: '#FEE2E2', mrp: 150, aliases: ['sauce', 'ketchup'], outOfStockOn: ['milkbasket'] },
  { id: 'lays-magic-masala', name: "Lay's India's Magic Masala Chips", brand: "Lay's", size: '52 g', category: 'Snacks', emoji: '🥔', tint: '#DBEAFE', mrp: 20, aliases: ['chips', 'lays', 'wafers'], notListedOn: ['bbdaily'] },
  { id: 'haldiram-bhujia-400', name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", size: '400 g', category: 'Snacks', emoji: '🥨', tint: '#FFEDD5', mrp: 115, aliases: ['namkeen', 'bhujia'] },
  { id: 'parle-g-800', name: 'Parle-G Gold Biscuits', brand: 'Parle', size: '800 g', category: 'Snacks', emoji: '🍪', tint: '#FEF3C7', mrp: 100, aliases: ['biscuit', 'parle g'] },
  { id: 'dairy-milk-silk', name: 'Cadbury Dairy Milk Silk', brand: 'Cadbury', size: '60 g', category: 'Snacks', emoji: '🍫', tint: '#EDE9FE', mrp: 90, aliases: ['chocolate', 'silk'] },
  { id: 'coca-cola-750', name: 'Coca-Cola Soft Drink', brand: 'Coca-Cola', size: '750 ml', category: 'Beverages', emoji: '🥤', tint: '#FEE2E2', mrp: 40, aliases: ['coke', 'cold drink', 'soda'], notListedOn: ['milkbasket'] },
  { id: 'red-bull-250', name: 'Red Bull Energy Drink', brand: 'Red Bull', size: '250 ml', category: 'Beverages', emoji: '🥫', tint: '#DBEAFE', mrp: 125, aliases: ['energy drink', 'redbull'], notListedOn: ['bbdaily', 'milkbasket'] },
  { id: 'tata-tea-gold-500', name: 'Tata Tea Gold', brand: 'Tata', size: '500 g', category: 'Beverages', emoji: '🍵', tint: '#DCFCE7', mrp: 330, aliases: ['chai', 'chai patti', 'tea'] },
  { id: 'nescafe-classic-50', name: 'Nescafé Classic Instant Coffee', brand: 'Nestlé', size: '50 g', category: 'Beverages', emoji: '☕', tint: '#FFEDD5', mrp: 190, aliases: ['coffee', 'nescafe'] },
  { id: 'colgate-strong-200', name: 'Colgate Strong Teeth Toothpaste', brand: 'Colgate', size: '200 g', category: 'Personal Care', emoji: '🪥', tint: '#FEE2E2', mrp: 125, aliases: ['toothpaste', 'manjan'] },
  { id: 'dove-soap-3', name: 'Dove Cream Beauty Bathing Bar', brand: 'Dove', size: '3 x 100 g', category: 'Personal Care', emoji: '🧼', tint: '#E0F2FE', mrp: 210, aliases: ['soap', 'sabun'] },
  { id: 'dettol-handwash-200', name: 'Dettol Original Handwash Refill', brand: 'Dettol', size: '175 ml', category: 'Personal Care', emoji: '🧴', tint: '#DCFCE7', mrp: 99, aliases: ['handwash', 'hand wash'] },
  { id: 'surf-excel-1kg', name: 'Surf Excel Easy Wash Detergent', brand: 'Surf Excel', size: '1 kg', category: 'Household', emoji: '🫧', tint: '#DBEAFE', mrp: 145, aliases: ['detergent', 'washing powder'] },
  { id: 'vim-gel-500', name: 'Vim Lemon Dishwash Gel', brand: 'Vim', size: '500 ml', category: 'Household', emoji: '🍋', tint: '#ECFCCB', mrp: 115, aliases: ['dishwash', 'bartan'], outOfStockOn: ['blinkit'] },
];

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(CATALOG.map((p) => [p.id, p]));

export const TRENDING_IDS = ['amul-taaza-500', 'maggi-masala-4', 'aashirvaad-atta-5', 'banana-robusta-6', 'coca-cola-750', 'onion-1kg'];
