import React from 'react';
import { Menu } from 'lucide-react';

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  categories,
  activeCategory,
  setActiveCategory,
  setSelectedProduct,
  setSearchQuery
}) {
  return (
    <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col hidden sm:flex`}>
      <div className="p-4 border-b flex items-center justify-between">
        {isSidebarOpen && <h1 className="font-bold text-lg text-blue-800">База Знаний</h1>}
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setActiveCategory(category.id);
              setSelectedProduct(null);
              setSearchQuery('');
            }}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeCategory === category.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <div className="flex-shrink-0">{category.icon}</div>
            {isSidebarOpen && (
              <span className="ml-3 text-sm text-left">{category.name}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
