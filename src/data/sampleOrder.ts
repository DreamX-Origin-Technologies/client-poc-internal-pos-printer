import type { Order } from "../types/receipt";

export const sampleOrder: Order = {
  restaurantName: "DreamX Bistro",
  address: "12 Harbor Street, Nairobi",
  billNumber: "B-1042",
  orderNumber: "ORD-2049",
  kotNumber: "KOT-88",
  tableNumber: "T12",
  dateTime: "2026-07-19 19:45",
  waiterName: "Mina",
  paymentMethod: "Card",
  subtotal: 35.5,
  discount: 3.5,
  tax: 2.55,
  grandTotal: 34.55,
  thankYouMessage: "Thank you for dining with us!",
  items: [
    {
      name: "Spicy garlic noodles",
      quantity: 2,
      unitPrice: 10.5,
      total: 21,
      instructions: "Extra chili",
    },
    {
      name: "Mango mocktail",
      quantity: 1,
      unitPrice: 8.5,
      total: 8.5,
      instructions: "No ice",
    },
  ],
};
