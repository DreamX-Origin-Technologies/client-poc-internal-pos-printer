import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { ReceiptPreview } from "./components/ReceiptPreview";
import { sampleOrder } from "./data/sampleOrder";
import { getDefaultPrinters, getPrinterName } from "./printing/printerConfig";
import { printerQueue } from "./printing/printerQueue";

function App() {
  const [status, setStatus] = useState("Press Space or click Print to send both receipts to the printer.");
  const [selectedPrinterId, setSelectedPrinterId] = useState("thermal-demo");
  const [printers] = useState(() => getDefaultPrinters());

  const order = useMemo(() => sampleOrder, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        void handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handlePrint() {
    setStatus(`Printing customer bill and kitchen ticket on ${getPrinterName(printers, selectedPrinterId)}...`);
    try {
      await printerQueue.enqueue(order, selectedPrinterId);
      setStatus("Print jobs queued successfully.");
    } catch (error) {
      console.error(error);
      setStatus("Printing failed. Please verify the printer setup.");
    }
  }

  return (
    <main className="pos-shell">
      <section className="panel panel--summary">
        <h1>DreamX POS Printing Demo</h1>
        <p className="subtitle">Offline-first thermal receipt printing for customer bills and kitchen tickets.</p>
        <label className="printer-select" htmlFor="printer-select">
          Printer
          <select id="printer-select" value={selectedPrinterId} onChange={(event) => setSelectedPrinterId(event.target.value)}>
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.name}
              </option>
            ))}
          </select>
        </label>
        <button className="print-button" type="button" onClick={() => void handlePrint()}>
          Print Both Receipts
        </button>
        <p className="status">{status}</p>
        <div className="meta-grid">
          <div>
            <strong>Order</strong>
            <p>{order.orderNumber}</p>
          </div>
          <div>
            <strong>Table</strong>
            <p>{order.tableNumber}</p>
          </div>
          <div>
            <strong>Waiter</strong>
            <p>{order.waiterName}</p>
          </div>
        </div>
      </section>

      <section className="panel panel--preview">
        <ReceiptPreview order={order} receiptType="customer" />
        <ReceiptPreview order={order} receiptType="kot" />
      </section>
    </main>
  );
}

export default App;
