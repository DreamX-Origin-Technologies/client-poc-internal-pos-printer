import { invoke } from "@tauri-apps/api/core";
import type { Order, ReceiptType } from "../types/receipt";
import { buildReceiptText } from "./receiptTemplates";
import { printReceiptViaPlugin } from "./thermalPrinterService";

interface PrintJob {
  type: ReceiptType;
  order: Order;
}

class PrinterQueue {
  private queue: PrintJob[] = [];
  private isRunning = false;

  async enqueue(order: Order) {
    const jobs: PrintJob[] = [
      { type: "customer", order },
      { type: "kot", order },
    ];

    this.queue.push(...jobs);
    if (!this.isRunning) {
      await this.run();
    }
  }

  private async run() {
    this.isRunning = true;

    try {
      while (this.queue.length > 0) {
        const nextJob = this.queue.shift();
        if (!nextJob) {
          continue;
        }

        await this.printReceipt(nextJob);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async printReceipt(job: PrintJob) {
    const customerPrinter = localStorage.getItem("customer_printer");
    const kitchenPrinter = localStorage.getItem("kitchen_printer");
    const paperSize = localStorage.getItem("printer_paper_size") || "Mm80";

    const targetPrinter = job.type === "customer" ? customerPrinter : kitchenPrinter;

    if (targetPrinter) {
      await printReceiptViaPlugin(targetPrinter, job.order, job.type, paperSize as any);
    } else {
      // Fallback to the original raw Windows spooler printing if no plugin printer is selected
      const content = buildReceiptText(job.order, job.type);
      await invoke("print_receipt", {
        receiptType: job.type,
        content: content,
        printerId: "default",
      });
    }
  }
}

export const printerQueue = new PrinterQueue();
