export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  hasInvoice?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  hasInvoice?: boolean;
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  items: SaleItem[];
  paymentMethod?: 'cash' | 'transfer';
  amountPaid?: number;
}
