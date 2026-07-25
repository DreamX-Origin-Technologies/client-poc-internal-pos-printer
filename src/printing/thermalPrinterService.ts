import {
  title,
  text,
  line,
  feed,
  cut,
  table,
  print_thermal_printer,
  list_thermal_printers,
  test_thermal_printer,
  reset,
  type PrintSections,
  type PaperSize
} from "tauri-plugin-thermal-printer";
import type { Order } from "../types/receipt";

function formatCurrency(value: number) {
  return `INR ${value.toFixed(2)}`;
}

export function buildCustomerReceiptSections(order: Order): PrintSections[] {
  const sections: PrintSections[] = [
    reset(),
    title(order.restaurantName.toUpperCase(), { align: "center", bold: true, size: "double" }),
    text(order.address, { align: "center" }),
    line("-"),
    title("CUSTOMER BILL", { align: "center", bold: true }),
    line("-"),
  ];

  // Metadata Table or lines
  sections.push(
    text(`Bill No: ${order.billNumber}`),
    text(`Order No: ${order.orderNumber}`),
    text(`Table: ${order.tableNumber}`),
    text(`Waiter: ${order.waiterName}`),
    text(`Date: ${order.dateTime}`),
    line("-"),
    text("ITEMS", { bold: true }),
    line("-")
  );

  // Print items
  for (const item of order.items) {
    const itemTitle = `${item.name}`;
    sections.push(text(itemTitle, { bold: true }));

    const qtyLabel = `${item.quantity} x ${formatCurrency(item.unitPrice)}`;
    const totalLabel = formatCurrency(item.total);
    
    sections.push(
      table(2, [
        [
          { text: qtyLabel, styles: { align: "left" } },
          { text: totalLabel, styles: { align: "right" } }
        ]
      ], { column_widths: [3, 1] })
    );

    if (item.instructions) {
      sections.push(text(`* ${item.instructions}`, { italic: true }));
    }
  }

  sections.push(
    line("-"),
    table(2, [
      [
        { text: "Subtotal", styles: { align: "left" } },
        { text: formatCurrency(order.subtotal), styles: { align: "right" } }
      ],
      [
        { text: "Discount", styles: { align: "left" } },
        { text: formatCurrency(order.discount), styles: { align: "right" } }
      ],
      [
        { text: "Tax", styles: { align: "left" } },
        { text: formatCurrency(order.tax), styles: { align: "right" } }
      ],
      [
        { text: "Grand Total", styles: { align: "left", bold: true } },
        { text: formatCurrency(order.grandTotal), styles: { align: "right", bold: true } }
      ]
    ], { column_widths: [3, 1] }),
    line("-"),
    text(`Payment Method: ${order.paymentMethod}`),
    line("-"),
    text(order.thankYouMessage, { align: "center", italic: true }),
    feed(4),
    cut("partial", 0)
  );

  return sections;
}

export function buildKotSections(order: Order): PrintSections[] {
  const sections: PrintSections[] = [
    reset(),
    title("KITCHEN ORDER", { align: "center", bold: true, size: "double" }),
    line("-"),
    text(`KOT No: ${order.kotNumber}`, { bold: true }),
    text(`Order No: ${order.orderNumber}`),
    text(`Table: ${order.tableNumber}`, { bold: true, size: "double" }),
    text(`Waiter: ${order.waiterName}`),
    text(`Date: ${order.dateTime}`),
    line("-"),
    text("ORDER ITEMS", { bold: true }),
    line("-")
  ];

  for (const item of order.items) {
    sections.push(
      title(`${item.quantity} x ${item.name}`, { bold: true })
    );
    if (item.instructions) {
      sections.push(
        text(`  -> ${item.instructions}`, { italic: true, bold: true })
      );
    }
  }

  sections.push(
    line("-"),
    feed(4),
    cut("partial", 0)
  );

  return sections;
}

export async function getThermalPrinters() {
  try {
    return await list_thermal_printers();
  } catch (error) {
    console.error("Failed to list thermal printers:", error);
    throw error;
  }
}

export async function printReceiptViaPlugin(
  printerName: string,
  order: Order,
  type: "customer" | "kot",
  paperSize: PaperSize = "Mm80"
) {
  const sections = type === "customer" 
    ? buildCustomerReceiptSections(order) 
    : buildKotSections(order);

  try {
    await print_thermal_printer({
      printer: printerName,
      sections,
      options: {
        code_page: 0
      },
      paper_size: paperSize
    });
  } catch (error) {
    console.error(`Failed to print ${type} receipt:`, error);
    throw error;
  }
}

export async function triggerTestPrint(printerName: string, paperSize: PaperSize = "Mm80") {
  try {
    await test_thermal_printer({
      printer_info: {
        printer: printerName,
        sections: [],
        options: { code_page: 0 },
        paper_size: paperSize
      },
      include_text: true,
      include_text_styles: true,
      include_separators: true,
      cut_paper: true
    });
  } catch (error) {
    console.error("Test print failed:", error);
    throw error;
  }
}
