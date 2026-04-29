import { useState, useEffect } from "react";
import { Product, CartItem, Sale, SaleItem } from "../types";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Receipt, Barcode, Image as ImageIcon, X } from "lucide-react";
import BarcodeScannerModal from "./BarcodeScannerModal";

interface POSProps {
  products: Product[];
  onProcessSale: (sale: Sale) => void;
}

export default function POSView({ products, onProcessSale }: POSProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleComplete, setSaleComplete] = useState<Sale | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');

  const availableProducts = products.filter(p => 
    p.stock > 0 && 
    ((p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
     (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot add more than stock
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, Math.min(item.product.stock, item.quantity + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setPaymentMethod('cash');
    setAmountPaid('');
    setShowCheckoutModal(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const confirmSale = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const saleItems: SaleItem[] = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        hasInvoice: item.product.hasInvoice
      }));

      const newSale: Sale = {
        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        date: new Date().toISOString(),
        items: saleItems,
        total: cartTotal,
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? parseFloat(amountPaid) || cartTotal : undefined,
      };

      onProcessSale(newSale);
      setSaleComplete(newSale);
      setCart([]);
      setIsProcessing(false);
      setShowCheckoutModal(false);
    }, 500); // Simulate brief processing time
  };

  const resetPOS = () => {
    setSaleComplete(null);
    setSearchTerm("");
  };

  const handleScan = (decodedText: string) => {
    setSearchTerm(decodedText);
    setIsScannerOpen(false);
  };

  if (saleComplete) {
    return (
      <div className="flex items-center justify-center h-full py-6">
        <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-xl w-full max-w-lg flex flex-col max-h-full">
          <div className="text-center shrink-0">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">¡Venta Exitosa!</h2>
            <p className="text-sm text-slate-500 mb-6 font-mono">Folio: {saleComplete.id.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center justify-between">
              <span>Detalle de la compra</span>
              <span className="font-normal text-slate-500">{new Date(saleComplete.date).toLocaleString()}</span>
            </h3>
            <div className="space-y-3">
              {saleComplete.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-slate-500 text-xs">{item.quantity} x ${item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-slate-700">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Método de pago:</span>
                <span className="font-medium text-slate-700 capitalize">{saleComplete.paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo'}</span>
              </div>
              {saleComplete.paymentMethod === 'cash' && saleComplete.amountPaid !== undefined && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Pagó con:</span>
                    <span className="font-medium text-slate-700">${saleComplete.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Vuelto:</span>
                    <span className="font-medium text-amber-600">${Math.max(0, saleComplete.amountPaid - saleComplete.total).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-slate-600">Total cobrado:</span>
                <span className="text-emerald-600 text-xl font-bold">${saleComplete.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={resetPOS}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" /> Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:gap-6 h-full min-h-0 lg:overflow-hidden">
      {/* Product Selection area */}
      <div className="flex-1 flex flex-col h-[45vh] lg:h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar producto a vender..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-full text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-colors"
              />
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-full flex items-center justify-center transition-colors shadow-sm shrink-0"
              title="Escanear código de barras"
            >
              <Barcode size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No hay productos en tu inventario. Ãgregalos primero en la pestaÃ±a Inventario.
            </div>
          ) : availableProducts.length === 0 ? (
             <div className="text-center py-10 text-slate-500">
              No se encontraron productos con stock para tu búsqueda.
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              {availableProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="bg-white border border-slate-200 p-3 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center active:scale-95 group w-full"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 mr-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <ImageIcon className="text-slate-400" size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-3 flex flex-col justify-center">
                    <p className="font-semibold text-slate-800 truncate leading-tight">{product.name}</p>
                    <span className="text-xs font-medium text-slate-500 mt-1">Stock: {product.stock}</span>
                  </div>
                  <span className="font-bold text-blue-700 whitespace-nowrap shrink-0">${product.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart / POS Area */}
      <div className="lg:w-96 w-full flex flex-col min-h-[40vh] lg:h-full bg-white border border-slate-200 text-slate-800 rounded-xl shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-bold flex items-center">
            <ShoppingCart className="mr-2" size={20} /> Caja
          </h2>
          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-bold border border-blue-100">
            {cart.length} ítems
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 space-y-4">
              <ShoppingCart size={48} />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-100">
                <div className="flex-1 pr-3">
                  <p className="text-sm font-bold truncate text-slate-900" title={item.product.name}>{item.product.name}</p>
                  <p className="text-xs text-slate-500">${item.product.price.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1">
                  <button onClick={() => handleUpdateQuantity(item.product.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item.product.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                    <Plus size={14} />
                  </button>
                </div>

                <div className="ml-4 flex items-center space-x-2">
                  <span className="font-bold text-blue-600 w-16 text-right">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                  <button onClick={() => handleRemoveFromCart(item.product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 lg:p-6 bg-white border-t border-slate-100 shrink-0">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <span className="text-sm font-bold text-slate-500">Total a pagar</span>
            <span className="text-2xl lg:text-3xl font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
          </div>
          
          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3 lg:py-4 rounded-lg font-bold text-sm flex items-center justify-center transition-colors shadow-sm"
          >
            {isProcessing ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <>
                <CreditCard size={24} className="mr-2" />
                Completar Venta
              </>
            )}
          </button>
        </div>
      </div>

      {isScannerOpen && (
        <BarcodeScannerModal 
          onScan={handleScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Completar Venta</h2>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isProcessing}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Total a cobrar</p>
                <p className="text-4xl font-bold text-emerald-600">${cartTotal.toFixed(2)}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700">Método de Pago</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-3 px-4 rounded-xl font-medium border-2 transition-all ${
                      paymentMethod === 'cash' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-3 px-4 rounded-xl font-medium border-2 transition-all ${
                      paymentMethod === 'transfer' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">¿Con cuánto pagó?</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-lg font-bold"
                        placeholder={cartTotal.toFixed(2)}
                      />
                    </div>
                  </div>
                  
                  {parseFloat(amountPaid) > cartTotal && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">
                      <span className="text-amber-800 font-medium">Vuelto a entregar:</span>
                      <span className="text-amber-600 font-bold text-xl">
                        ${(parseFloat(amountPaid) - cartTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < cartTotal && (
                    <div className="text-red-500 text-sm font-medium mt-1">
                      El monto ingresado es menor al total a cobrar.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                disabled={isProcessing || (paymentMethod === 'cash' && amountPaid !== '' && parseFloat(amountPaid) < cartTotal)}
                onClick={confirmSale}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white py-3 md:py-4 rounded-xl font-bold transition-all flex items-center justify-center shadow-sm"
              >
                {isProcessing ? (
                  <span className="animate-pulse">Procesando...</span>
                ) : (
                  <>Confirmar Pago de ${cartTotal.toFixed(2)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
