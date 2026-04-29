import React, { useState, useRef } from "react";
import { Product } from "../types";
import { Plus, Search, Edit, Trash2, X, Barcode, Image as ImageIcon, Upload, Receipt } from "lucide-react";
import BarcodeScannerModal from "./BarcodeScannerModal";

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function InventoryView({ products, setProducts }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"search" | "sku">("search");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({});

  const handleOpenScanner = (target: "search" | "sku") => {
    setScannerTarget(target);
    setIsScannerOpen(true);
  };

  const handleScan = (decodedText: string) => {
    if (scannerTarget === "search") {
      setSearchTerm(decodedText);
      setCurrentPage(1);
    } else if (scannerTarget === "sku") {
      setFormData(prev => ({ ...prev, sku: decodedText }));
    }
    setIsScannerOpen(false);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ stock: 0, price: 0 }); // Defaults
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingProduct(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Basic resize to avoid huge base64 strings
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    if (editingProduct) {
      // Update
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p));
    } else {
      // Create new
      const newProduct: Product = {
        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        name: formData.name || "",
        sku: formData.sku || "",
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        category: formData.category || "General",
        imageUrl: formData.imageUrl
      };
      setProducts([...products, newProduct]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de querer eliminar este producto?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
          <p className="text-slate-500">Gestiona tus productos y existencias</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center w-full md:w-auto"
        >
          <Plus size={20} className="mr-2" /> Agregar Producto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por nombre o SKU..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 w-full border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border bg-white"
              />
            </div>
            <button
              onClick={() => handleOpenScanner("search")}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0"
              title="Escanear código"
            >
              <Barcode size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto min-w-full">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-xs text-slate-500 uppercase border-b border-slate-100 font-bold">
                  <th scope="col" className="px-6 py-3 text-left">Producto</th>
                  <th scope="col" className="px-6 py-3 text-left">Categoría</th>
                  <th scope="col" className="px-6 py-3 text-right">Precio</th>
                  <th scope="col" className="px-6 py-3 text-center">Stock</th>
                  <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm divide-y divide-slate-50">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron productos. {searchTerm ? "Prueba otra búsqueda." : "Agrega el primero."}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center mr-3">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="text-slate-400" size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 flex items-center">
                              {p.name}
                              {p.hasInvoice && (
                                <div title="Con Factura" className="ml-2 inline-flex">
                              <Receipt size={14} className="text-blue-500" />
                            </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {p.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-slate-800">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          p.stock === 0 ? 'bg-red-100 text-red-700' :
                          p.stock <= 5 ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => handleOpenModal(p)} className="text-blue-600 hover:text-blue-900 mr-4 transition-colors" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 transition-colors" title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100 pb-2">
            {paginatedProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No se encontraron productos. {searchTerm ? "Prueba otra búsqueda." : "Agrega el primero."}
              </div>
            ) : (
              paginatedProducts.map((p) => (
                <div key={p.id} className="p-4 bg-white flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="shrink-0 h-12 w-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center mr-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="text-slate-400" size={20} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="font-medium text-slate-800 truncate flex items-center">
                          {p.name}
                          {p.hasInvoice && (
                            <div title="Con Factura" className="ml-1.5 shrink-0 inline-flex">
                              <Receipt size={14} className="text-blue-500" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">SKU: {p.sku} • {p.category}</div>
                      </div>
                    </div>
                    <div className="flex space-x-3 shrink-0">
                      <button onClick={() => handleOpenModal(p)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 px-1">
                    <div className="text-lg font-bold text-slate-800">
                      ${p.price.toFixed(2)}
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-slate-500 mr-2">Stock:</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.stock === 0 ? 'bg-red-100 text-red-700 border border-red-200' :
                        p.stock <= 5 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {p.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */
        totalPages > 1 && (
          <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="font-medium">{filteredProducts.length}</span> resultados
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

      {/* Modal / Dialog for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/70 transition-opacity" aria-hidden="true" onClick={closeModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl leading-6 font-bold text-slate-900" id="modal-title">
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 py-5 sm:p-6 space-y-4">
                  
                  {/* Image Upload */}
                  <div className="flex flex-col items-center mb-4">
                    <div 
                      className="h-24 w-24 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.imageUrl ? (
                        <>
                          <img src={formData.imageUrl} alt="Vista previa" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Upload className="text-white" size={24} />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="text-slate-400 mb-1" size={24} />
                          <span className="text-[10px] text-slate-500 font-medium">Foto</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                    <p className="text-xs text-slate-500 mt-2">Opcional. Máx. 1MB</p>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre del Producto *</label>
                    <input type="text" id="name" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU / Código *</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input type="text" id="sku" required value={formData.sku || ''} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="flex-1 block w-full border border-slate-300 rounded-l-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                          <button
                            type="button"
                            onClick={() => handleOpenScanner("sku")}
                            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                            title="Escanear código"
                          >
                            <Barcode size={18} />
                          </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Categoría</label>
                        <input type="text" id="category" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-slate-700">Precio de Venta ($) *</label>
                        <input type="number" step="0.01" min="0" id="price" required value={formData.price ?? ''} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-slate-700">Unidades Iniciales (Stock) *</label>
                        <input type="number" min="0" id="stock" required value={formData.stock ?? ''} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>

                  <div className="flex items-center mt-4">
                    <input 
                      type="checkbox" 
                      id="hasInvoice" 
                      checked={formData.hasInvoice || false} 
                      onChange={(e) => setFormData({...formData, hasInvoice: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" 
                    />
                    <label htmlFor="hasInvoice" className="ml-2 block text-sm font-medium text-slate-700">
                      Producto con factura de compra
                    </label>
                  </div>

                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                  <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal 
          onScan={handleScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
}
