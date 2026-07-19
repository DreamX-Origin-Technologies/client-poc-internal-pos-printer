import type { Order, ReceiptType } from "../types/receipt";
import { buildReceiptText } from "../printing/receiptTemplates";

interface ReceiptPreviewProps {
  order: Order;
  receiptType: ReceiptType;
}

export function ReceiptPreview({ order, receiptType }: ReceiptPreviewProps) {
  const text = buildReceiptText(order, receiptType);

  return (
    <section className="receipt-preview" aria-label={`${receiptType} receipt preview`}>
      <pre>{text}</pre>
    </section>
  );
}
