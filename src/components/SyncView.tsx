import React, { useState, useEffect, useRef } from "react";
import { Product, Sale } from "../types";
import { FileJson, Upload, Download, Wifi, Smartphone, Monitor, CheckCircle, AlertCircle, Scan, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Peer, DataConnection } from "peerjs";
import BarcodeScannerModal from "./BarcodeScannerModal";

interface SyncProps {
  products: Product[];
  sales: Sale[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
}

export default function SyncView({ products, sales, setProducts, setSales }: SyncProps) {
  const [activeTab, setActiveTab] = useState<"file" | "wifi">("file");
  const [statusMsg, setStatusMsg] = useState<{type: "success" | "error" | "info" | "none", text: string}>({type: "none", text: ""});

  // File Sync
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportFile = () => {
    const data = JSON.stringify({ products, sales }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VentaControl_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: "success", text: "Archivo exportado exitosamente." });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.products && json.sales) {
          mergeData(json.products, json.sales);
          setStatusMsg({ type: "success", text: "Datos importados y combinados correctamente." });
        } else {
          setStatusMsg({ type: "error", text: "Formato de archivo inválido. Faltan productos o ventas." });
        }
      } catch (err) {
         setStatusMsg({ type: "error", text: "Error al leer el archivo. Asegúrate de que sea un JSON válido." });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const mergeData = (incomingProducts: Product[], incomingSales: Sale[]) => {
    // Merge sales (union by ID)
    const salesMap = new Map(sales.map(s => [s.id, s]));
    incomingSales.forEach(s => salesMap.set(s.id, s));
    setSales(Array.from(salesMap.values()));

    // Merge products (union by ID, incoming overwrites existing)
    const productsMap = new Map(products.map(p => [p.id, p]));
    incomingProducts.forEach(p => productsMap.set(p.id, p));
    setProducts(Array.from(productsMap.values()));
  };

  // WiFi Sync (PeerJS)
  const [peerId, setPeerId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");

  useEffect(() => {
    if (activeTab === "wifi" && !peer) {
      // Create a short readable ID (6 chars)
      const newPeerId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPeer = new Peer(newPeerId);
      
      newPeer.on("open", (id) => {
        setPeerId(id);
      });

      newPeer.on("connection", (conn) => {
        setupConnection(conn);
      });

      newPeer.on("error", (err) => {
        setStatusMsg({ type: "error", text: `Error de red: ${err.type}` });
        setConnectionState("disconnected");
      });

      setPeer(newPeer);
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (peer) peer.destroy();
    }
  }, [peer]);

  const setupConnection = (conn: DataConnection) => {
    setConnectionState("connecting");
    conn.on("open", () => {
      setConnectionState("connected");
      setStatusMsg({ type: "success", text: "¡Conectado! Intercambiando datos..." });
      
      // Send our data to the connected peer
      conn.send({ type: "SYNC_DATA", payload: { products, sales } });
    });

    conn.on("data", (data: any) => {
      if (data.type === "SYNC_DATA") {
        mergeData(data.payload.products, data.payload.sales);
        setStatusMsg({ type: "success", text: "¡Inventario y Ventas sincronizados por red exitosamente!" });
        setTimeout(() => conn.close(), 2000);
      }
    });

    conn.on("close", () => {
      setConnectionState("disconnected");
    });
  };

  const connectToPeer = () => {
    if (!peer || !targetId) return;
    setStatusMsg({ type: "info", text: `Conectando con ${targetId}...` });
    const conn = peer.connect(targetId.toUpperCase());
    setupConnection(conn);
  };

  const handleScanCode = (code: string) => {
    // Basic verification: only keep alphanumeric chars up to 6 length
    const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    setTargetId(cleanCode);
    setIsScannerOpen(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sincronización</h2>
          <p className="text-slate-500">Mantén los datos actualizados entre tus dispositivos (Windows, Android, etc.)</p>
        </div>
      </div>

      {statusMsg.type !== "none" && (
        <div className={`p-4 rounded-lg flex items-center border ${
          statusMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
          statusMsg.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
          "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {statusMsg.type === "success" ? <CheckCircle className="mr-2 shrink-0" size={20} /> : <AlertCircle className="mr-2 shrink-0" size={20} />}
          <span className="text-sm font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 border border-slate-200 p-1 rounded-xl w-full max-w-sm mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab("file")}
          className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center ${activeTab === "file" ? "bg-white shadow-sm text-slate-800 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
        >
          <FileJson size={16} className="mr-1 sm:mr-2 shrink-0"/> Archivo
        </button>
        <button
          onClick={() => setActiveTab("wifi")}
          className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center ${activeTab === "wifi" ? "bg-white shadow-sm text-slate-800 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Wifi size={16} className="mr-1 sm:mr-2 shrink-0"/> Red (WiFi)
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 w-full flex-1">
        {activeTab === "file" ? (
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Sincronización Manual (Archivo)</h3>
              <p className="text-slate-600 text-sm max-w-2xl mx-auto md:mx-0">
                Ideal para transferir datos mediante memoria USB, correo o WhatsApp cuando no existe conexión de red entre los dispositivos.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                  <Download size={28} />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Exportar Datos</h4>
                <p className="text-xs text-slate-500 mb-6 sm:mb-8 max-w-xs">Guarda un archivo .json con todo tu inventario y ventas para Ilevarlo a otro dispositivo.</p>
                <button onClick={handleExportFile} className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-bold shadow-sm transition-colors w-full flex items-center justify-center gap-2 text-sm sm:text-base">
                  <FileJson size={18} className="shrink-0" /> Descargar Archivo JSON
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-white hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                  <Upload size={28} />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Importar Datos</h4>
                <p className="text-xs text-slate-500 mb-6 sm:mb-8 max-w-xs">Carga un archivo exportado previamente. El sistema combinará los datos nuevos con los actuales de forma segura.</p>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImportFile} 
                />
                <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-3 rounded-lg font-bold shadow-sm transition-colors w-full flex items-center justify-center gap-2 text-sm sm:text-base">
                  <FileJson size={18} className="shrink-0" /> Seleccionar Archivo JSON
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Sincronización Directa (P2P sobre WiFi)</h3>
              <p className="text-slate-600 text-sm max-w-2xl mx-auto md:mx-0">
                Transfiere tu inventario instantáneamente de un dispositivo a otro mediante una conexión segura. 
                <strong className="text-slate-800 block mt-1">Requisito: Ambos equipos deben tener esta pantalla abierta.</strong>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 relative max-w-full">
              
              <div className="hidden md:flex absolute inset-y-0 left-1/2 -ml-[1px] w-[2px] bg-slate-100 flex-col justify-center items-center">
                 <div className="bg-white border border-slate-200 p-2 rounded-full absolute">
                   <Wifi className="text-slate-400" size={16} />
                 </div>
              </div>

              {/* Host Section */}
              <div className="border border-slate-200 p-6 sm:p-7 rounded-xl flex flex-col items-center text-center bg-white shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full flex items-center justify-center mb-4 shrink-0">
                  <Monitor size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-base sm:text-lg mb-4 sm:mb-6">En este dispositivo...</h4>
                
                {peerId ? (
                  <div className="flex flex-col items-center justify-center space-y-4 w-full">
                    <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-sm mb-1 sm:mb-2 w-32 sm:w-48 aspect-square flex items-center justify-center shrink-0">
                      <QRCodeSVG value={peerId} className="w-full h-full" level={"H"} />
                    </div>
                    <div className="bg-slate-50 w-full px-2 sm:px-4 py-3 rounded-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center shrink-0">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 sm:mb-2">Código de Conexión</p>
                      <p className="text-2xl sm:text-3xl font-mono font-bold text-indigo-700 tracking-[0.15em] sm:tracking-[0.2em] break-all text-center">{peerId}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 sm:py-20 flex flex-col items-center justify-center shrink-0">
                    <RefreshCw className="animate-spin text-slate-400 mb-4" size={32} />
                    <p className="text-sm font-medium text-slate-500">Generando código seguro...</p>
                  </div>
                )}
              </div>

              {/* Client Section */}
              <div className="border border-slate-200 p-6 sm:p-7 rounded-xl flex flex-col items-center text-center bg-white shadow-sm">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 border border-teal-100 rounded-full flex items-center justify-center mb-4 shrink-0">
                  <Smartphone size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-base sm:text-lg mb-4 sm:mb-6">Desde el otro dispositivo...</h4>
                
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-6 shrink-0">Ingresa el código que aparece en la otra pantalla o escanea su código QR.</p>
                
                <div className="w-full space-y-4 shrink-0">
                  <div className="flex gap-2 w-full">
                    <input 
                      type="text" 
                      placeholder="CÓDIGO" 
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="flex-1 min-w-0 border border-slate-300 rounded-xl px-2 sm:px-4 py-3 sm:py-4 text-center text-lg sm:text-xl font-mono uppercase tracking-widest focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 placeholder:tracking-normal placeholder:text-slate-400"
                    />
                    <button 
                      onClick={() => setIsScannerOpen(true)}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 w-14 sm:w-16 flex items-center justify-center rounded-xl transition-colors shadow-sm shrink-0 active:scale-95"
                      title="Escanear código QR"
                    >
                      <Scan size={24} className="shrink-0 text-slate-600" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={connectToPeer}
                    disabled={targetId.length !== 6 || connectionState === "connecting"}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:border-slate-200 disabled:border disabled:text-slate-400 text-white px-4 py-3 sm:py-4 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center active:scale-95 text-sm sm:text-base"
                  >
                    {connectionState === "connecting" ? "Conectando..." : "Sincronizar Datos"}
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>

      {isScannerOpen && (
        <BarcodeScannerModal 
          onScan={handleScanCode} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
}
