import { useState } from 'react';
import { Search, Plus, Edit2, Package, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { mockInventory } from './mockData';
import { InventoryItem } from './canteenTypes';

export function FoodAvailability() {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const categories = ['all', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Others'];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: InventoryItem['status']) => {
    const statusConfig = {
      'In Stock': 'bg-green-100 text-green-700',
      'Low Stock': 'bg-amber-100 text-amber-700',
      'Out of Stock': 'bg-red-100 text-red-700',
    };
    return <Badge className={statusConfig[status]}>{status}</Badge>;
  };

  const updateStock = (id: string, quantity: number) => {
    setInventory((items) =>
      items.map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + quantity;
          let newStatus: InventoryItem['status'];
          if (newQuantity === 0) {
            newStatus = 'Out of Stock';
          } else if (newQuantity < item.minimumStock) {
            newStatus = 'Low Stock';
          } else {
            newStatus = 'In Stock';
          }
          return {
            ...item,
            quantity: newQuantity,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  const lowStockCount = inventory.filter((item) => item.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter((item) => item.status === 'Out of Stock').length;
  const totalItems = inventory.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Food Inventory</h2>
          <p className="text-gray-500 mt-1">
            Manage stock levels and reduce food wastage
          </p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {totalItems - lowStockCount - outOfStockCount}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {lowStockCount}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <TrendingDown className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {outOfStockCount}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Showing {filteredInventory.length} item(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Item Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Min. Stock
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Expiry
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const isExpiringSoon =
                    item.expiryDate &&
                    new Date(item.expiryDate).getTime() - new Date().getTime() <
                    3 * 24 * 60 * 60 * 1000; // 3 days

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{item.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">
                          {item.quantity} {item.unit}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700">
                          {item.minimumStock} {item.unit}
                        </p>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-4">
                        {item.expiryDate ? (
                          <div className="flex items-center gap-1">
                            {isExpiringSoon && (
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={`text-sm ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-700'
                                }`}
                            >
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStock(item.id, -5)}
                            disabled={item.quantity === 0}
                            className="text-xs"
                          >
                            -5
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStock(item.id, 5)}
                            className="text-xs"
                          >
                            +5
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingItem(item)}
                            className="p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">No inventory items found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setEditingItem(null)}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Update Stock</CardTitle>
              <CardDescription>Update inventory details for {editingItem.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Current Quantity</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    defaultValue={editingItem.quantity}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">{editingItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Minimum Stock Level</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    defaultValue={editingItem.minimumStock}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">{editingItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    defaultValue={editingItem.expiryDate?.split('T')[0]}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={() => setEditingItem(null)}
                >
                  Update
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
