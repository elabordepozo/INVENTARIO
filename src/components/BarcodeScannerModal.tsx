import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera as CameraIcon } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

interface BarcodeScannerModalProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScannerModal({ onScan, onClose }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestPermissionsAndScan = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await BarcodeScanner.requestPermissions();
          if (status.camera === 'granted' || status.camera === 'limited') {
            // Permission granted, start native scan
            try {
              const result = await BarcodeScanner.scan();
              if (result.barcodes.length > 0) {
                onScan(result.barcodes[0].displayValue);
              } else {
                onClose(); // No barcode was scanned, close modal
              }
            } catch (scanErr) {
              console.error("Error during native scan:", scanErr);
              onClose(); // Just close if the user canceled the native scanner
            }
          } else {
             setError("Permiso de cámara denegado. No se puede escanear en este dispositivo.");
          }
        } catch (err) {
          console.error("Error pidiendo permiso de cámara:", err);
          setError("Error al solicitar permiso de cámara.");
        }
      } else {
        // Initialize the web scanner when the component mounts
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10,
            rememberLastUsedCamera: true,
            supportedScanTypes: [0, 1] // 0: camera, 1: file
          },
          false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            // Stop scanning and call onScan completely
            if (scannerRef.current) {
              scannerRef.current.clear().catch(console.error);
            }
            onScan(decodedText);
          },
          (errorMessage) => {
            // We can ignore continuous scanning errors, as they are mostly "barcode not found"
          }
        );
      }
    };
    
    requestPermissionsAndScan();

    return () => {
      // Cleanup when component unmounts
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">Escanear Código</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          {error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : Capacitor.isNativePlatform() ? (
            <div className="w-full h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 flex-col gap-4">
              <CameraIcon size={48} className="animate-pulse" />
              <p>Abriendo cámara...</p>
            </div>
          ) : (
            <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
          )}
          <p className="text-sm text-slate-500 text-center mt-4">
            Apunta la cámara al código de barras, sube una imagen o ingresa el código manualmente.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Ingresar código manual..." 
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onScan(e.currentTarget.value);
                }
              }}
              id="manual-barcode-input"
            />
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              onClick={() => {
                const input = document.getElementById('manual-barcode-input') as HTMLInputElement;
                if (input && input.value) {
                  onScan(input.value);
                }
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
