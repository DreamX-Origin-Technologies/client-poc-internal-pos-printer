import { invoke } from "@tauri-apps/api/core";
import type { Order, ReceiptType } from "../types/receipt";
import { buildReceiptText } from "./receiptTemplates";

interface PrintJob {
  type: ReceiptType;
  content: string;
  printerId: string;
}

class PrinterQueue {
  private queue: PrintJob[] = [];
  private isRunning = false;

  async enqueue(order: Order, printerId: string) {
    const jobs: PrintJob[] = [
      { type: "customer", content: buildReceiptText(order, "customer"), printerId },
      { type: "kot", content: buildReceiptText(order, "kot"), printerId },
    ];

    this.queue.push(...jobs);
    if (!this.isRunning) {
      await this.run();
    }
  }

  private async run() {
    this.isRunning = true;

    while (this.queue.length > 0) {
      const nextJob = this.queue.shift();
      if (!nextJob) {
        continue;
      }

      await this.printReceipt(nextJob);
    }

    this.isRunning = false;
  }

  private async printReceipt(job: PrintJob) {
    try {
      await invoke("print_receipt", {
        receiptType: job.type,
        content: job.content,
        printerId: job.printerId,
      });
    } catch (error) {
      console.error(`Unable to print ${job.type} receipt`, error);
    }
  }
}

export const printerQueue = new PrinterQueue();
