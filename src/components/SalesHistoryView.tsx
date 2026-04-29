import { useState } from "react";
import { Sale, SaleItem } from "../types";
import { Search, Calendar, FileText, X, Edit, Trash2, Plus, Minus } from "lucide-react";

interface SalesHistoryProps {
  sales: Sale[];
  onUpdateSale: (oldSale: Sale, newSale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
}

export default function SalesHistoryView({ sales, onUpdateSale, onDeleteSale }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editedItems, setEditedItems] = useState<SaleItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterInvoice, setFilterInvoice] = useState<string>("all");

  const availableYears = Array.from(new Set(sales.map(s => new Date(s.date).getFullYear().toString()))).sort((a,b) => b.localeCompare(a));

  const filteredSales = sales.map(s => {
    if (filterInvoice === "all") return s;
    const filteredItems = s.items.filter(i => filterInvoice === "with" ? i.hasInvoice : !i.hasInvoice);
    return {
      ...s,
      items: filteredItems,
      total: filteredItems.reduce((acc, item) => acc + item.subtotal, 0)
    };
  }).filter(s => {
    if (s.items.length === 0) return false;
    const d = new Date(s.date);
    const yearMatch = filterYear === "all" || d.getFullYear().toString() === filterYear;
    const monthMatch = filterMonth === "all" || (d.getMonth() + 1).toString() === filterMonth;
    const dayMatch = filterDay === "all" || d.getDate().toString().padStart(2, '0') === filterDay;
    const searchMatch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) || d.toLocaleDateString().includes(searchTerm);

    return yearMatch && monthMatch && dayMatch && searchMatch;
  });

  const reversedSales = [...filteredSales].reverse();
  const totalPages = Math.ceil(reversedSales.length / itemsPerPage);
  const paginatedSales = reversedSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSaveEdit = () => {
    if (!editingSale) return;
    
    // Remove items with 0 quantity
    const finalItems = editedItems.filter(item => item.quantity > 0);
    
    if (finalItems.length === 0) {
      if(window.confirm('No hay artículos. ¿Deseas eliminar la venta?')) {
        onDeleteSale(editingSale.id);
      }
      setEditingSale(null);
      return;
    }

    const total = finalItems.reduce((acc, item) => acc + item.subtotal, 0);
    
    const newSale = {
      ...editingSale,
      items: finalItems,
      total
    };
    
    onUpdateSale(editingSale, newSale);
    setEditingSale(null);
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setEditedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price
        };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Historial de Ventas</h2>
        <p className="text-slate-500">Consulta y revisa las transacciones completadas</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por folio o fecha..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-full border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border bg-white text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="all">Año</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              value={filterMonth}
              onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm capitalize"
            >
              <option value="all">Mes</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m.toString()}>{new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}</option>
              ))}
            </select>

            <select
              value={filterDay}
              onChange={(e) => { setFilterDay(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="all">Día</option>
              {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
              ))}
            </select>

            <select
              value={filterInvoice}
              onChange={(e) => { setFilterInvoice(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="all">Factura</option>
              <option value="with">Con Factura</option>
              <option value="without">Sin Factura</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto min-w-full">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-xs text-slate-500 uppercase border-b border-slate-100 font-bold">
                  <th scope="col" className="px-6 py-3 text-left">Folio</th>
                  <th scope="col" className="px-6 py-3 text-left">Fecha y Hora</th>
                  <th scope="col" className="px-6 py-3 text-center">Artículos</th>
                  <th scope="col" className="px-6 py-3 text-right">Total</th>
                  <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm divide-y divide-slate-50">
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron ventas.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-800">
                        {sale.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-slate-400" />
                          {new Date(sale.date).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-100 items-center justify-center inline-flex">
                          {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        ${sale.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => setSelectedSale(sale)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Ver detalles"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingSale(sale);
                              setEditedItems([...sale.items]);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Editar venta"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm('¿Estás seguro de eliminar esta venta? El stock será devuelto.')) {
                                onDeleteSale(sale.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Eliminar venta"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredSales.length > 0 && (
                <tfoot className="bg-emerald-50 sticky bottom-0 border-t-2 border-emerald-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <tr className="font-bold text-slate-800">
                    <td colSpan={2} className="px-6 py-4 text-right text-emerald-800 uppercase text-xs tracking-wider">
                      Total del Período
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 inline-flex">
                        {filteredSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)} arts.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-700 text-lg">
                      ${filteredSales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pb-24">
              {paginatedSales.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                  No se encontraron ventas.
                </div>
              ) : (
                paginatedSales.map((sale) => (
                  <div key={sale.id} className="p-4 bg-white flex flex-col gap-2">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-mono font-bold text-slate-800 text-sm">#{sale.id.slice(0, 8).toUpperCase()}</span>
                        <div className="text-xs text-slate-500 flex items-center mt-1">
                          <Calendar size={12} className="mr-1" />
                          {new Date(sale.date).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setSelectedSale(sale)}
                          className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSale(sale);
                            setEditedItems([...sale.items]);
                          }}
                          className="text-amber-600 bg-amber-50 p-2 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('¿Estás seguro de eliminar esta venta?')) {
                              onDeleteSale(sale.id);
                            }
                          }}
                          className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="text-xs text-slate-500">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)} artículos
                      </div>
                      <div className="font-bold text-emerald-600 text-lg">
                        ${sale.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Mobile Footer Summary */}
            {filteredSales.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-emerald-50 border-t-2 border-emerald-200 p-4 shadow-lg flex justify-between items-center z-10">
                <div>
                  <div className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">Total Período</div>
                  <div className="text-xs text-emerald-700">
                    {filteredSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)} arts.
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-700">
                  ${filteredSales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */
        totalPages > 1 && (
          <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, reversedSales.length)}</span> de <span className="font-medium">{reversedSales.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1 
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                        : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
            {/* Mobile Pagination */}
            <div className="flex items-center justify-between flex-1 sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-700">
                Pág {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/70 transition-opacity" onClick={() => setSelectedSale(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-lg font-bold">Detalle de Venta</h3>
                  <p className="text-xs text-slate-400 font-mono tracking-wider">FOLIO: {selectedSale.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 bg-slate-50">
                <p className="text-sm text-slate-500 mb-4 flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {new Date(selectedSale.date).toLocaleString()}
                </p>
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} x ${item.price.toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-slate-700">${item.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total de Venta</span>
                  <span className="text-2xl font-bold text-emerald-600">${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                <button onClick={() => setSelectedSale(null)} className="w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/70 transition-opacity" onClick={() => setEditingSale(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-amber-600 px-6 py-4 border-b border-amber-700 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-lg font-bold">Editar Venta</h3>
                  <p className="text-xs text-amber-200 font-mono tracking-wider">FOLIO: {editingSale.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setEditingSale(null)} className="text-amber-200 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 bg-slate-50">
                <p className="text-sm text-slate-500 mb-4">
                  Ajusta las cantidades de los artículos vendidos. Pon la cantidad en 0 para quitar un artículo.
                </p>
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {editedItems.map((item, idx) => (
                    <div key={idx} className={`flex justify-between items-center bg-white p-3 rounded-lg border ${item.quantity === 0 ? 'border-red-200 opacity-50' : 'border-slate-200'}`}>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${item.quantity === 0 ? 'text-red-700 line-through' : 'text-slate-800'}`}>{item.name}</p>
                        <p className="text-xs text-slate-500">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => updateItemQuantity(item.productId, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.productId, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className={`w-20 text-right font-bold ${item.quantity === 0 ? 'text-slate-400' : 'text-slate-700'}`}>${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Nuevo Total</span>
                  <span className="text-2xl font-bold text-amber-600">${editedItems.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-white px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:justify-end gap-2 border-t border-slate-200">
                <button onClick={() => setEditingSale(null)} className="w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:w-auto sm:text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:w-auto sm:text-sm transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
