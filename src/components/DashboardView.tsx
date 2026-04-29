import { useState } from "react";
import { Product, Sale } from "../types";
import { DollarSign, PackageOpen, TrendingUp, AlertTriangle, BarChart3, Filter } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

export default function DashboardView({ products, sales }: DashboardProps) {
  const totalSalesRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + (sale.items || []).reduce((iSum, item) => iSum + (item.quantity || 0), 0), 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const currentYearStr = new Date().getFullYear().toString();
  const [filterYear, setFilterYear] = useState<string>(currentYearStr);
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const availableYears = Array.from(new Set(sales.map(s => new Date(s.date).getFullYear().toString()))).sort((a,b) => b.localeCompare(a));
  if (!availableYears.includes(currentYearStr)) {
    availableYears.push(currentYearStr);
    availableYears.sort((a,b) => b.localeCompare(a));
  }

  const getChartData = () => {
    if (filterMonth === "all") {
      const data = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(parseInt(filterYear), i, 1);
        const monthName = d.toLocaleString('es', { month: 'short' });
        const name = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace('.', '');
        
        const monthTotal = sales.reduce((sum, sale) => {
          const saleDate = new Date(sale.date);
          if (saleDate.getFullYear().toString() === filterYear && saleDate.getMonth() === i) {
            return sum + (sale.total || 0);
          }
          return sum;
        }, 0);

        data.push({ name, Ingresos: monthTotal });
      }
      return data;
    } else {
      const monthIndex = parseInt(filterMonth) - 1;
      const daysInMonth = new Date(parseInt(filterYear), monthIndex + 1, 0).getDate();
      const data = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const dayTotal = sales.reduce((sum, sale) => {
          const saleDate = new Date(sale.date);
          if (saleDate.getFullYear().toString() === filterYear && 
              saleDate.getMonth() === monthIndex && 
              saleDate.getDate() === i) {
            return sum + (sale.total || 0);
          }
          return sum;
        }, 0);
        data.push({ name: `${i}`, Ingresos: dayTotal });
      }
      return data;
    }
  };

  const trendData = getChartData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Tablero General</h2>
        <p className="text-slate-500">Resumen de la situación actual de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ventas Totales */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Ventas Totales</p>
            <p className="text-2xl font-bold text-slate-800">${totalSalesRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Card 2: Artículos Vendidos */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Artículos Vendidos</p>
            <p className="text-2xl font-bold text-slate-800">{totalItemsSold}</p>
          </div>
        </div>

        {/* Card 3: Productos en Inventario */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <PackageOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Tipos de Productos</p>
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
          </div>
        </div>

        {/* Card 4: Alertas de Stock */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Stock Bajo / Agotado</p>
            <p className="text-2xl font-bold text-slate-800">{lowStockProducts.length + outOfStockProducts.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <AlertTriangle className="text-amber-500 mr-2" size={20}/> Productos con Stock Bajo
          </h3>
          {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay problemas de stock actualmente.</p>
          ) : (
            <div className="space-y-4">
              {outOfStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                  <div>
                    <p className="font-semibold text-red-800">{p.name}</p>
                    <p className="text-xs text-red-600">SKU: {p.sku}</p>
                  </div>
                  <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded font-bold">Agotado</span>
                </div>
              ))}
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <div>
                    <p className="font-semibold text-amber-800">{p.name}</p>
                    <p className="text-xs text-amber-600">SKU: {p.sku}</p>
                  </div>
                  <span className="text-amber-700 text-sm font-bold">{p.stock} restantes</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Últimas Ventas</h3>
          {sales.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no hay ventas registradas.</p>
          ) : (
             <div className="space-y-4">
               {[...sales].reverse().slice(0, 5).map((sale) => (
                 <div key={sale.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                   <div>
                     <p className="font-medium text-slate-800">Venta #{sale.id.slice(0, 8)}</p>
                     <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-emerald-600">${sale.total.toFixed(2)}</p>
                     <p className="text-xs text-slate-500">{sale.items.length} artículos</p>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <BarChart3 className="text-blue-500 mr-2" size={20}/> Tendencia de Ventas
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm capitalize"
            >
              <option value="all">Todo el año</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m.toString()}>{new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
              />
              <Area type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
