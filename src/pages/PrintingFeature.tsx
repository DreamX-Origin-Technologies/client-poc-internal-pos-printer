import { useEffect, useState } from "react";
import { getThermalPrinters, triggerTestPrint } from "../printing/thermalPrinterService";
import type { PrinterInfo } from "tauri-plugin-thermal-printer";

interface PrintingFeatureProps {
  onBack: () => void;
}

export function PrintingFeature({ onBack }: PrintingFeatureProps) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customerPrinter, setCustomerPrinter] = useState("");
  const [kitchenPrinter, setKitchenPrinter] = useState("");
  const [paperSize, setPaperSize] = useState("Mm80");

  const [testPrintStatus, setTestPrintStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load saved settings
    setCustomerPrinter(localStorage.getItem("customer_printer") || "");
    setKitchenPrinter(localStorage.getItem("kitchen_printer") || "");
    setPaperSize(localStorage.getItem("printer_paper_size") || "Mm80");

    fetchPrinters();
  }, []);

  const fetchPrinters = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getThermalPrinters();
      setPrinters(list);
    } catch (err) {
      console.error(err);
      setError("Unable to query thermal printers. Verify the tauri-plugin-thermal-printer plugin is configured correctly.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem("customer_printer", customerPrinter);
    localStorage.setItem("kitchen_printer", kitchenPrinter);
    localStorage.setItem("printer_paper_size", paperSize);
    alert("Printer settings saved successfully!");
  };

  const handleTestPrint = async (printerName: string, role: "customer" | "kitchen") => {
    if (!printerName) return;

    setTestPrintStatus((prev) => ({ ...prev, [role]: "Sending test print..." }));
    try {
      await triggerTestPrint(printerName, paperSize as any);
      setTestPrintStatus((prev) => ({ ...prev, [role]: "Test print sent successfully!" }));
    } catch (err) {
      console.error(err);
      setTestPrintStatus((prev) => ({ ...prev, [role]: `Failed: ${err}` }));
    }
  };

  return (
    <div className="printing-config-page">
      <header className="config-header">
        <button className="back-button" onClick={onBack}>
          ← Back to POS
        </button>
        <h2>Thermal Printer Configuration</h2>
        <p className="subtitle">Configure and manage ESC/POS printers for customer receipts and kitchen tickets.</p>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>Hardware Connection Error:</strong>
          <p>{error}</p>
          <button className="refresh-button" onClick={fetchPrinters}>Retry Search</button>
        </div>
      )}

      <div className="config-grid">
        {/* Left column: Setup Form */}
        <section className="config-card setup-card">
          <h3>Printer Mappings</h3>
          
          <div className="form-group">
            <label htmlFor="paper-size-select">Paper Width</label>
            <select
              id="paper-size-select"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
            >
              <option value="Mm58">58mm (Mm58)</option>
              <option value="Mm80">80mm (Mm80 - Standard)</option>
              <option value="Mm72">72mm (Mm72)</option>
              <option value="Mm104">104mm (Mm104)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="customer-printer-select">Customer Receipt Printer</label>
            <p className="input-desc">Sends structured customer bills with full subtotal/tax summary and payment details.</p>
            <select
              id="customer-printer-select"
              value={customerPrinter}
              onChange={(e) => setCustomerPrinter(e.target.value)}
            >
              <option value="">-- Select Customer Printer --</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.interface_type})
                </option>
              ))}
            </select>
            {customerPrinter && (
              <div className="action-row">
                <button
                  type="button"
                  className="test-print-btn"
                  onClick={() => handleTestPrint(customerPrinter, "customer")}
                >
                  Test Customer Printer
                </button>
                {testPrintStatus.customer && <span className="test-status">{testPrintStatus.customer}</span>}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="kitchen-printer-select">Kitchen KOT Printer</label>
            <p className="input-desc">Sends simplified kitchen tickets with item quantities and prep instructions.</p>
            <select
              id="kitchen-printer-select"
              value={kitchenPrinter}
              onChange={(e) => setKitchenPrinter(e.target.value)}
            >
              <option value="">-- Select Kitchen Printer --</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.interface_type})
                </option>
              ))}
            </select>
            {kitchenPrinter && (
              <div className="action-row">
                <button
                  type="button"
                  className="test-print-btn"
                  onClick={() => handleTestPrint(kitchenPrinter, "kitchen")}
                >
                  Test Kitchen Printer
                </button>
                {testPrintStatus.kitchen && <span className="test-status">{testPrintStatus.kitchen}</span>}
              </div>
            )}
          </div>

          <button className="save-btn" onClick={handleSave}>
            Save Printer Configuration
          </button>
        </section>

        {/* Right column: Discovered Hardware List */}
        <section className="config-card info-card">
          <div className="card-header">
            <h3>Discovered Thermal Hardware</h3>
            <button className="refresh-icon-btn" onClick={fetchPrinters} disabled={loading} aria-label="Refresh hardware list">
              {loading ? "Scanning..." : "↻ Refresh"}
            </button>
          </div>
          
          {loading ? (
            <div className="scanning-container">
              <div className="spinner"></div>
              <p>Scanning local USB, Network and Bluetooth ports...</p>
            </div>
          ) : printers.length === 0 ? (
            <div className="empty-hardware">
              <p>No thermal printers found on this system.</p>
              <p className="empty-desc">Ensure your printer is powered on, connected, and the local drivers are initialized.</p>
            </div>
          ) : (
            <ul className="printer-list">
              {printers.map((printer) => {
                const isActiveCustomer = customerPrinter === printer.name;
                const isActiveKitchen = kitchenPrinter === printer.name;
                return (
                  <li key={printer.name} className="printer-item">
                    <div className="printer-info-details">
                      <span className="printer-item-name">{printer.name}</span>
                      <span className="printer-item-type">{printer.interface_type} / {printer.status || "Ready"}</span>
                    </div>
                    <div className="badge-container">
                      {isActiveCustomer && <span className="badge badge--customer">Customer Bill</span>}
                      {isActiveKitchen && <span className="badge badge--kitchen">Kitchen KOT</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
