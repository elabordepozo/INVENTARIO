import { useState, useEffect } from "react";
import { Product, Sale } from "./types";
import { LayoutDashboard, Package, ShoppingCart, Menu, X, RefreshCw, FileText, BarChart2 } from "lucide-react";
import DashboardView from "./components/DashboardView";
import InventoryView from "./components/InventoryView";
import POSView from "./components/POSView";
import SyncView from "./components/SyncView";
import SalesHistoryView from "./components/SalesHistoryView";
import ReportsView from "./components/ReportsView";

type View = "dashboard" | "inventory" | "pos" | "sales-history" | "reports" | "sync";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States for our Mini-Database (LocalStorage)
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedProducts = localStorage.getItem("inventory_products");
    const savedSales = localStorage.getItem("inventory_sales");
    
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed)) setProducts(parsed);
      } catch (e) {}
    }
    
    if (savedSales) {
      try {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed)) setSales(parsed);
      } catch (e) {}
    }
    
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("inventory_products", JSON.stringify(products));
    }
  }, [products, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("inventory_sales", JSON.stringify(sales));
    }
  }, [sales, isLoaded]);

  const navItems = [
    { id: "dashboard", label: "Tablero", icon: <LayoutDashboard size={20} /> },
    { id: "inventory", label: "Inventario", icon: <Package size={20} /> },
    { id: "pos", label: "Punto de Venta", icon: <ShoppingCart size={20} /> },
    { id: "sales-history", label: "Historial de Ventas", icon: <FileText size={20} /> },
    { id: "reports", label: "Reportes", icon: <BarChart2 size={20} /> },
    { id: "sync", label: "Sincronización", icon: <RefreshCw size={20} /> },
  ] as const;

  const handleProcessSale = (sale: Sale) => {
    // Save sale
    setSales([...sales, sale]);
    
    // Deduct stock
    setProducts((currentProducts) => 
      currentProducts.map((product) => {
        const soldItem = sale.items.find(item => item.productId === product.id);
        if (soldItem) {
          return { ...product, stock: product.stock - soldItem.quantity };
        }
        return product;
      })
    );
  };

  const handleUpdateSale = (oldSale: Sale, newSale: Sale) => {
    setSales(sales.map(s => s.id === oldSale.id ? newSale : s));
    
    setProducts((currentProducts) => {
      let updatedProducts = [...currentProducts];

      for (const oldItem of oldSale.items) {
        const prodIndex = updatedProducts.findIndex(p => p.id === oldItem.productId);
        if (prodIndex !== -1) {
          updatedProducts[prodIndex] = {
            ...updatedProducts[prodIndex],
            stock: updatedProducts[prodIndex].stock + oldItem.quantity
          };
        }
      }

      for (const newItem of newSale.items) {
        const prodIndex = updatedProducts.findIndex(p => p.id === newItem.productId);
        if (prodIndex !== -1) {
          updatedProducts[prodIndex] = {
            ...updatedProducts[prodIndex],
            stock: updatedProducts[prodIndex].stock - newItem.quantity
          };
        }
      }

      return updatedProducts;
    });
  };

  const handleDeleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;
    
    setSales(sales.filter(s => s.id !== saleId));
    
    setProducts((currentProducts) => {
      let updatedProducts = [...currentProducts];
      for (const oldItem of saleToDelete.items) {
        const prodIndex = updatedProducts.findIndex(p => p.id === oldItem.productId);
        if (prodIndex !== -1) {
          updatedProducts[prodIndex] = {
            ...updatedProducts[prodIndex],
            stock: updatedProducts[prodIndex].stock + oldItem.quantity
          };
        }
      }
      return updatedProducts;
    });
  };

  if (!isLoaded) return <div className="h-screen w-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="flex bg-slate-50 h-[100dvh] overflow-hidden text-slate-800 font-sans w-full">
      {/* Mobile Header / Nav toggle */}
      <div className="md:hidden flex items-center justify-between bg-blue-700 text-white p-4 fixed top-0 w-full z-20 shadow-md">
        <div className="font-bold text-lg tracking-tight">SistemaVentas</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`
        fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-64 transform transition-transform duration-300 ease-in-out z-10
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-col pt-16 md:pt-0
      `}>
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-slate-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Package size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">StockFlow</h1>
        </div>
        
        <div className="flex flex-col px-4 py-4 space-y-1 mt-4 md:mt-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-md font-medium transition-colors ${
                currentView === item.id 
                ? "bg-blue-50 text-blue-700" 
                : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pt-20 md:p-6 w-full max-w-7xl mx-auto overflow-y-auto flex flex-col items-stretch">
        {currentView === "dashboard" && <DashboardView products={products} sales={sales} />}
        {currentView === "inventory" && <InventoryView products={products} setProducts={setProducts} />}
        {currentView === "pos" && <POSView products={products} onProcessSale={handleProcessSale} />}
        {currentView === "sales-history" && <SalesHistoryView sales={sales} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} />}
        {currentView === "reports" && <ReportsView products={products} sales={sales} />}
        {currentView === "sync" && <SyncView products={products} sales={sales} setProducts={setProducts} setSales={setSales} />}
      </main>

      {/* Overlay for mobile menus */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
