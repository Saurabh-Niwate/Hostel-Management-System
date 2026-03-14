import { useState } from 'react';
import {
  UtensilsCrossed,
  Vote,
  TrendingUp,
  Package,
  Users,
  Trophy,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { mockDailyStats, mockMenuPolls, mockInventory } from './mockData';

export function CanteenDashboard() {
  const [stats] = useState(mockDailyStats);
  const [activePolls] = useState(mockMenuPolls.filter((poll) => poll.status === 'Active'));
  const [lowStockItems] = useState(
    mockInventory.filter((item) => item.status === 'Low Stock' || item.status === 'Out of Stock')
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Canteen Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage menus, voting polls, and inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Polls</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPolls}</p>
                <p className="text-sm text-teal-600 mt-1">
                  {stats.activePolls} active
                </p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <Vote className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalVotes}</p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Today
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Participation Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.participationRate}%
                </p>
                <p className="text-sm text-blue-600 mt-1">Student voting</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {lowStockItems.length}
                </p>
                <p className="text-sm text-red-600 mt-1">Needs attention</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Menu Choices */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Menu Choices</CardTitle>
            <CardDescription>Top voted menu options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularChoices.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-100 text-teal-700 rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.votes} votes</p>
                    </div>
                  </div>
                  {index === 0 && <Trophy className="h-5 w-5 text-amber-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meals */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meal Polls</CardTitle>
            <CardDescription>Scheduled and active polls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingMeals.map((meal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{meal.meal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {meal.status === 'Active' ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Vote className="h-3 w-3 mr-1 inline" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
                      )}
                      <span className="text-sm font-medium text-gray-900">{meal.votes} votes</span>
                    </div>
                  </div>
                  {meal.status === 'Active' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{
                          width: `${(meal.votes / 200) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Polls */}
        <Card>
          <CardHeader>
            <CardTitle>Active Polls</CardTitle>
            <CardDescription>Currently running menu polls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePolls.length > 0 ? (
                activePolls.map((poll) => (
                  <div key={poll.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{poll.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {poll.options.length} options • {poll.totalVotes} votes
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="space-y-1">
                      {poll.options.slice(0, 2).map((option) => (
                        <div key={option.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{option.name}</span>
                          <span className="font-medium text-gray-900">
                            {option.votes} ({option.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No active polls at the moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${item.status === 'Out of Stock'
                            ? 'bg-red-100'
                            : 'bg-amber-100'
                          }`}
                      >
                        <Package
                          className={`h-4 w-4 ${item.status === 'Out of Stock'
                              ? 'text-red-600'
                              : 'text-amber-600'
                            }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} {item.unit} remaining
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        item.status === 'Out of Stock'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  All inventory items are well stocked
                </p>
              )}
              {lowStockItems.length > 0 && (
                <Button variant="outline" className="w-full mt-4">
                  <Package className="h-4 w-4 mr-2" />
                  Update Inventory
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for canteen management</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Update Menu
          </Button>
          <Button variant="outline" className="justify-start">
            <Vote className="h-4 w-4 mr-2" />
            Create Poll
          </Button>
          <Button variant="outline" className="justify-start">
            <Package className="h-4 w-4 mr-2" />
            Manage Inventory
          </Button>
          <Button variant="outline" className="justify-start">
            <Trophy className="h-4 w-4 mr-2" />
            View Results
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}