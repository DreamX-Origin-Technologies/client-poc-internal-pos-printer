export type ReceiptType = "customer" | "kot";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  instructions?: string;
}

export interface Order {
  restaurantName: string;
  address: string;
  billNumber: string;
  orderNumber: string;
  kotNumber: string;
  tableNumber: string;
  dateTime: string;
  waiterName: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  thankYouMessage: string;
  items: ReceiptItem[];
}
