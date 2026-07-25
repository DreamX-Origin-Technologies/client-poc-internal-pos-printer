use std::fs;
use std::thread;
use std::time::Duration;

use windows::core::{PCWSTR, PWSTR};
use windows::Win32::Graphics::Printing::{
    ClosePrinter, EndDocPrinter, EndPagePrinter, OpenPrinterW, PRINTER_HANDLE, StartDocPrinterW,
    StartPagePrinter, WritePrinter, DOC_INFO_1W,
};

fn build_escpos_payload(content: &str, receipt_type: &str, printer_id: &str) -> Vec<u8> {
    let mut payload = Vec::new();
    payload.extend_from_slice(b"\x1B\x40");
    payload.extend_from_slice(b"\x1B\x61\x01");
    payload.extend_from_slice(format!("{}\n", receipt_type.to_uppercase()).as_bytes());
    payload.extend_from_slice(content.as_bytes());
    payload.extend_from_slice(b"\n\n");
    payload.extend_from_slice(b"\x1B\x64\x03");
    payload.extend_from_slice(b"\x1D\x56\x00");

    match printer_id {
        "usb-receipt" => {
            payload.extend_from_slice(b"\n[USB receipt printer]\n");
        }
        "network-pos" => {
            payload.extend_from_slice(b"\n[Network POS printer]\n");
        }
        _ => {
            payload.extend_from_slice(b"\n[Demo thermal printer]\n");
        }
    }

    payload
}

fn wide_string(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(std::iter::once(0)).collect()
}

#[cfg(target_os = "windows")]
fn print_bytes_to_windows_spooler(payload: &[u8], printer_name: &str) -> Result<(), String> {
    let mut printer_handle = PRINTER_HANDLE::default();

    let printer_name_wide = wide_string(printer_name);
    let name_pcwstr = if printer_name == "default" || printer_name.is_empty() {
        PCWSTR(std::ptr::null())
    } else {
        PCWSTR(printer_name_wide.as_ptr())
    };

    let opened = unsafe { OpenPrinterW(name_pcwstr, &mut printer_handle, None) };
    if opened.is_err() {
        return Err(format!("Unable to open printer: {}", printer_name));
    }

    let doc_name_wide = wide_string("DreamX POS Receipt");
    let output_file_wide = wide_string("");
    let datatype_wide = wide_string("RAW");
    let doc_info = DOC_INFO_1W {
        pDocName: PWSTR(doc_name_wide.as_ptr() as *mut u16),
        pOutputFile: PWSTR(output_file_wide.as_ptr() as *mut u16),
        pDatatype: PWSTR(datatype_wide.as_ptr() as *mut u16),
    };

    let doc_id = unsafe { StartDocPrinterW(printer_handle, 1, &doc_info as *const DOC_INFO_1W) };
    if doc_id == 0 {
        unsafe {
            let _ = ClosePrinter(printer_handle);
        }
        return Err(format!("Unable to start a print job for printer {}", printer_name));
    }

    let page_started = unsafe { StartPagePrinter(printer_handle) };
    if !page_started.as_bool() {
        unsafe {
            let _ = EndDocPrinter(printer_handle);
            let _ = ClosePrinter(printer_handle);
        }
        return Err(format!("Unable to start a page for printer {}", printer_name));
    }

    let payload_len: u32 = payload
        .len()
        .try_into()
        .map_err(|_| format!("Receipt payload is too large for printer {}", printer_name))?;
    let mut bytes_written = 0u32;
    let written = unsafe { WritePrinter(printer_handle, payload.as_ptr().cast(), payload_len, &mut bytes_written) };
    if !written.as_bool() {
        unsafe {
            let _ = EndPagePrinter(printer_handle);
            let _ = EndDocPrinter(printer_handle);
            let _ = ClosePrinter(printer_handle);
        }
        return Err(format!("Unable to write the receipt payload to printer {}", printer_name));
    }

    unsafe {
        let _ = EndPagePrinter(printer_handle);
        let _ = EndDocPrinter(printer_handle);
        let _ = ClosePrinter(printer_handle);
    }

    Ok(())
}

#[tauri::command]
fn print_receipt(receipt_type: String, content: String, printer_id: String) -> Result<String, String> {
    println!("Printing {} receipt on {}", receipt_type, printer_id);

    let payload = build_escpos_payload(&content, &receipt_type, &printer_id);
    let output_dir = std::env::temp_dir().join("dreamx-pos-poc");
    fs::create_dir_all(&output_dir).map_err(|error| format!("Unable to create temp dir: {error}"))?;

    let file_name = format!("{}-{}.txt", receipt_type, printer_id);
    let output_path = output_dir.join(file_name);
    fs::write(&output_path, &payload).map_err(|error| format!("Unable to write receipt payload: {error}"))?;

    thread::sleep(Duration::from_millis(600));

    #[cfg(target_os = "windows")]
    {
        if let Ok(()) = print_bytes_to_windows_spooler(&payload, &printer_id) {
            println!("Receipt sent to printer {}", printer_id);
            return Ok(format!("{} receipt printed to printer {}", receipt_type, printer_id));
        }

        println!("Windows print submission to {} did not complete, but the receipt payload was saved", printer_id);
        return Ok(format!("{} receipt saved to {} for Windows printing", receipt_type, output_path.display()));
    }

    #[cfg(not(target_os = "windows"))]
    {
        println!("Receipt payload prepared at {}", output_path.display());
        return Ok(format!("{} receipt emitted to {}", receipt_type, output_path.display()));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_thermal_printer::init())
        .invoke_handler(tauri::generate_handler![print_receipt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
