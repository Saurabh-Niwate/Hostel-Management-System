import { useState } from 'react';
import { Plus, Vote, Trophy, Clock, Calendar, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { mockMenuPolls } from './mockData';
import { MenuPoll } from './canteenTypes';

export function MenuVoting() {
  const [polls, setPolls] = useState<MenuPoll[]>(mockMenuPolls);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<MenuPoll | null>(null);

  const activePolls = polls.filter((poll) => poll.status === 'Active');
  const scheduledPolls = polls.filter((poll) => poll.status === 'Scheduled');
  const closedPolls = polls.filter((poll) => poll.status === 'Closed');

  const getStatusBadge = (status: MenuPoll['status']) => {
    const statusConfig = {
      Active: { className: 'bg-green-100 text-green-700', icon: Vote },
      Scheduled: { className: 'bg-blue-100 text-blue-700', icon: Calendar },
      Closed: { className: 'bg-gray-100 text-gray-700', icon: CheckCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1 inline" />
        {status}
      </Badge>
    );
  };

  const closePoll = (pollId: string) => {
    setPolls((polls) =>
      polls.map((poll) => {
        if (poll.id === pollId) {
          // Find the option with most votes
          const winningOption = poll.options.reduce((prev, current) =>
            prev.votes > current.votes ? prev : current
          );
          return {
            ...poll,
            status: 'Closed' as const,
            winningOption: winningOption.name,
          };
        }
        return poll;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Voting</h2>
          <p className="text-gray-500 mt-1">Create polls for students to vote on meal options</p>
        </div>
        <Button onClick={() => setShowCreatePoll(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Polls</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activePolls.length}</p>
                <p className="text-sm text-green-600 mt-1">Currently voting</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Vote className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{scheduledPolls.length}</p>
                <p className="text-sm text-blue-600 mt-1">Upcoming polls</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Votes Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {activePolls.reduce((sum, poll) => sum + poll.totalVotes, 0)}
                </p>
                <p className="text-sm text-teal-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Active polls
                </p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Polls</h3>
          <div className="grid grid-cols-1 gap-6">
            {activePolls.map((poll) => (
              <Card key={poll.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{poll.title}</CardTitle>
                        {getStatusBadge(poll.status)}
                      </div>
                      <CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {poll.totalVotes} votes
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Closes at {new Date(poll.closesAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => closePoll(poll.id)}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      Close Poll
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {poll.options.map((option, index) => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {index === 0 && option.votes > 0 && (
                              <Trophy className="h-5 w-5 text-amber-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                {option.name}
                                {option.isVeg && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">Veg</Badge>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{option.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Items: {option.items.join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-lg text-gray-900">{option.votes}</p>
                            <p className="text-sm text-gray-500">{option.percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-teal-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedPoll(poll)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Polls */}
      {scheduledPolls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Polls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scheduledPolls.map((poll) => (
              <Card key={poll.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{poll.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(poll.date).toLocaleDateString()}
                        </div>
                      </CardDescription>
                    </div>
                    {getStatusBadge(poll.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{poll.options.length} options available</p>
                  <div className="space-y-2">
                    {poll.options.map((option) => (
                      <div
                        key={option.id}
                        className="p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <p className="font-medium text-gray-900">{option.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Closed Polls */}
      {closedPolls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Polls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {closedPolls.map((poll) => {
              const winningOption = poll.options.find(
                (opt) => opt.name === poll.winningOption
              );

              return (
                <Card key={poll.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{poll.title}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(poll.date).toLocaleDateString()}
                          </div>
                        </CardDescription>
                      </div>
                      {getStatusBadge(poll.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-amber-600" />
                        <p className="text-sm font-medium text-amber-900">Winning Menu</p>
                      </div>
                      <p className="font-semibold text-gray-900">{poll.winningOption}</p>
                      {winningOption && (
                        <p className="text-sm text-gray-600 mt-1">
                          {winningOption.votes} votes ({winningOption.percentage}%)
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Total votes: {poll.totalVotes}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreatePoll && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreatePoll(false)}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Create New Poll</CardTitle>
              <CardDescription>Set up a menu voting poll for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Poll Title</label>
                <input
                  type="text"
                  placeholder="e.g., Tonight's Dinner Menu"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Meal Type</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Closing Time</label>
                <input
                  type="time"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Menu Options (Add 2-4 options)</h3>

                {[1, 2, 3].map((num) => (
                  <div key={num} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Option {num}</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Option name (e.g., North Indian Thali)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Description of items included"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`veg-${num}`}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`veg-${num}`} className="text-sm text-gray-700">
                          Vegetarian
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={() => setShowCreatePoll(false)}
                >
                  Create Poll
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreatePoll(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Poll Details Modal */}
      {selectedPoll && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPoll(null)}
        >
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{selectedPoll.title}</CardTitle>
              <CardDescription>
                Poll ID: {selectedPoll.pollId} • Created: {new Date(selectedPoll.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Votes</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedPoll.totalVotes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPoll.status)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Vote Distribution</h3>
                {selectedPoll.options
                  .sort((a, b) => b.votes - a.votes)
                  .map((option, index) => (
                    <div key={option.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Trophy className="h-5 w-5 text-amber-500" />
                          )}
                          <p className="font-medium text-gray-900">{option.name}</p>
                        </div>
                        <p className="font-bold text-gray-900">
                          {option.votes} ({option.percentage}%)
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedPoll(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
