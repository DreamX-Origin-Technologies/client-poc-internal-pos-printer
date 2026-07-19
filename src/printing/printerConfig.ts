export interface PrinterOption {
  id: string;
  name: string;
  kind: string;
}

export function getDefaultPrinters(): PrinterOption[] {
  return [
    { id: "thermal-demo", name: "Demo Thermal Printer", kind: "thermal" },
    { id: "usb-receipt", name: "USB Receipt Printer", kind: "usb" },
    { id: "network-pos", name: "Network POS Printer", kind: "network" },
  ];
}

export function getPrinterName(printers: PrinterOption[], printerId: string) {
  return printers.find((printer) => printer.id === printerId)?.name ?? "Demo Thermal Printer";
}
