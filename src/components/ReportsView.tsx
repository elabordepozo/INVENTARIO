import React, { useState } from 'react';
import { Product, Sale } from '../types';
import { DollarSign, Package, TrendingUp, AlertTriangle, Calendar, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
}

export default function ReportsView({ products, sales }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');

  // --- Sales Data ---
  const totalSalesRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay() || 7; 
  if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const salesToday = sales.filter(s => new Date(s.date) >= today).reduce((sum, s) => sum + s.total, 0);
  const salesThisWeek = sales.filter(s => new Date(s.date) >= startOfWeek).reduce((sum, s) => sum + s.total, 0);
  const salesThisMonth = sales.filter(s => new Date(s.date) >= startOfMonth).reduce((sum, s) => sum + s.total, 0);

  // Top Selling Products
  const productSalesCount: Record<string, { name: string, quantity: number, revenue: number }> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSalesCount[item.productId]) {
        productSalesCount[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSalesCount[item.productId].quantity += item.quantity;
      productSalesCount[item.productId].revenue += item.subtotal;
    });
  });

  const topProducts = Object.values(productSalesCount)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // --- Inventory Data ---
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  // Top Products for Chart
  const chartData = topProducts.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    Cantidad: p.quantity,
    Ingresos: p.revenue
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reportes</h2>
          <p className="text-slate-500">Analiza el rendimiento de tus ventas y estado del inventario</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Ventas
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Inventario
          </button>
        </div>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <DollarSign size={20} className="text-emerald-500" />
                <h3 className="font-medium">Total Histórico</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">${totalSalesRevenue.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Calendar size={20} className="text-blue-500" />
                <h3 className="font-medium">Ventas Hoy</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">${salesToday.toFixed(2)}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Calendar size={20} className="text-indigo-500" />
                <h3 className="font-medium">Ventas esta Semana</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">${salesThisWeek.toFixed(2)}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Calendar size={20} className="text-purple-500" />
                <h3 className="font-medium">Ventas este Mes</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">${salesThisMonth.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Award size={20} className="text-amber-500" /> Top 5 Productos Más Vendidos
              </h3>
              {topProducts.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay datos de ventas aún.</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 text-amber-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.quantity} unidades vendidas</p>
                        </div>
                      </div>
                      <p className="font-bold text-emerald-600">${p.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" /> Gráfico de Productos
              </h3>
              {chartData.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay suficientes datos para graficar.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Bar dataKey="Cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <DollarSign size={20} className="text-emerald-500" />
                <h3 className="font-medium">Valor Total del Inventario</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">${totalInventoryValue.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Package size={20} className="text-blue-500" />
                <h3 className="font-medium">Total Unidades</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">{totalUnits}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <AlertTriangle size={20} className="text-amber-500" />
                <h3 className="font-medium">Productos en Riesgo</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">{lowStockProducts.length + outOfStockProducts.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" /> Stock Crítico
              </h3>
              {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                <p className="text-slate-500 text-sm">Todo el inventario está en niveles óptimos.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {outOfStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div>
                        <p className="font-medium text-red-800">{p.name}</p>
                        <p className="text-xs text-red-600">SKU: {p.sku}</p>
                      </div>
                      <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded font-bold">Agotado</span>
                    </div>
                  ))}
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div>
                        <p className="font-medium text-amber-800">{p.name}</p>
                        <p className="text-xs text-amber-600">SKU: {p.sku}</p>
                      </div>
                      <span className="text-amber-700 text-sm font-bold">{p.stock} restantes</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Resumen de Productos</h3>
              <div className="flex-1 overflow-auto pr-2 max-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500 border-b border-slate-200 sticky top-0 bg-white">
                    <tr>
                      <th className="py-2 font-medium">Producto</th>
                      <th className="py-2 font-medium">Stock</th>
                      <th className="py-2 font-medium text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="py-2">
                          <p className="font-medium text-slate-800">{p.name}</p>
                        </td>
                        <td className="py-2">
                          <span className={`${p.stock === 0 ? 'text-red-600 font-bold' : p.stock <= 5 ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-2 text-right font-medium text-slate-700">
                          ${(p.price * p.stock).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-500">No hay productos en inventario</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
