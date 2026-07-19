import type { Order, ReceiptType } from "../types/receipt";

const lineWidth = 42;

function padRight(value: string, width: number) {
  return value.padEnd(width, " ");
}

function padLeft(value: string, width: number) {
  return value.padStart(width, " ");
}

// function wrapText(value: string, width: number) {
//   const words = value.split(/(\s+)/).filter(Boolean);
//   const lines: string[] = [];
//   let current = "";

//   for (const word of words) {
//     if (!current) {
//       current = word;
//       continue;
//     }

//     if ((current + word).length <= width) {
//       current += word;
//     } else {
//       lines.push(current.trim());
//       current = word;
//     }
//   }

//   if (current) {
//     lines.push(current.trim());
//   }

//   return lines.length ? lines : [value];
// }

function formatCurrency(value: number) {
  return `INR ${value.toFixed(2)}`;
}

function makeDivider() {
  return "-".repeat(lineWidth);
}

function makeHeader(order: Order, receiptType: ReceiptType) {
  const lines: string[] = [];
  lines.push(order.restaurantName.toUpperCase());
  lines.push(order.address);
  lines.push(makeDivider());
  lines.push(receiptType === "customer" ? "CUSTOMER BILL" : "KITCHEN ORDER");
  lines.push(`Bill: ${order.billNumber}`);
  lines.push(`Order: ${order.orderNumber}`);
  lines.push(`Table: ${order.tableNumber}`);
  lines.push(`Date/Time: ${order.dateTime}`);
  lines.push(`Waiter: ${order.waiterName}`);
  lines.push(makeDivider());
  return lines.join("\n");
}

export function buildReceiptText(order: Order, receiptType: ReceiptType) {
  const sections: string[] = [];
  sections.push(makeHeader(order, receiptType));

  if (receiptType === "customer") {
    sections.push("ITEMS");
    for (const item of order.items) {
      const itemName = item.name.length > 20 ? `${item.name.slice(0, 17)}...` : item.name;
      sections.push(`${itemName}`);
      const qtyLabel = `${item.quantity} x ${formatCurrency(item.unitPrice)}`;
      const totalLabel = formatCurrency(item.total);
      sections.push(`${padRight(qtyLabel, 24)}${padLeft(totalLabel, 12)}`);
      if (item.instructions) {
        sections.push(`* ${item.instructions}`);
      }
    }

    sections.push(makeDivider());
    sections.push(`${padRight("Subtotal", 26)}${padLeft(formatCurrency(order.subtotal), 16)}`);
    sections.push(`${padRight("Discount", 26)}${padLeft(formatCurrency(order.discount), 16)}`);
    sections.push(`${padRight("Tax", 26)}${padLeft(formatCurrency(order.tax), 16)}`);
    sections.push(`${padRight("Grand Total", 26)}${padLeft(formatCurrency(order.grandTotal), 16)}`);
    sections.push(`Payment: ${order.paymentMethod}`);
  } else {
    sections.push("ORDER ITEMS");
    for (const item of order.items) {
      sections.push(`${item.quantity}x ${item.name}`);
      if (item.instructions) {
        sections.push(`  -> ${item.instructions}`);
      }
    }
    sections.push(`KOT: ${order.kotNumber}`);
  }

  sections.push(makeDivider());
  sections.push(order.thankYouMessage);
  return sections.join("\n");
}
