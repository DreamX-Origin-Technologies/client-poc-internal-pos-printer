import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { ReceiptPreview } from "./components/ReceiptPreview";
import { sampleOrder } from "./data/sampleOrder";
import { printerQueue } from "./printing/printerQueue";
import { PrintingFeature } from "./pages/PrintingFeature";

function App() {
  const [view, setView] = useState<"pos" | "settings">("pos");
  const [status, setStatus] = useState("Press Space or click Print to send both receipts to the configured thermal printers.");

  const order = useMemo(() => sampleOrder, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (view === "pos" && event.code === "Space") {
        event.preventDefault();
        void handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  async function handlePrint() {
    const customerPrinter = localStorage.getItem("customer_printer");
    const kitchenPrinter = localStorage.getItem("kitchen_printer");
    
    if (customerPrinter || kitchenPrinter) {
      setStatus(`Printing to configured printers: Customer (${customerPrinter || "Default"}), Kitchen (${kitchenPrinter || "Default"})...`);
    } else {
      setStatus("Printing customer bill and kitchen ticket on the Windows default printer...");
    }

    try {
      await printerQueue.enqueue(order);
      setStatus("Print jobs queued successfully.");
    } catch (error) {
      console.error(error);
      setStatus("Printing failed. Please verify printer connection and settings.");
    }
  }

  if (view === "settings") {
    return (
      <main className="pos-shell" style={{ gridTemplateColumns: "1fr" }}>
        <PrintingFeature onBack={() => setView("pos")} />
      </main>
    );
  }

  return (
    <main className="pos-shell">
      <section className="panel panel--summary" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>DreamX POS Printing Demo</h1>
          <p className="subtitle" style={{ margin: 0 }}>Offline-first thermal receipt printing for customer bills and kitchen tickets.</p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
          <button className="print-button" type="button" onClick={() => void handlePrint()}>
            Print Both Receipts
          </button>
          
          <button className="nav-link-btn" type="button" onClick={() => setView("settings")}>
            ⚙ Configure Printers
          </button>
        </div>

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
