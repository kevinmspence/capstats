// src/components/team/SimpleTeamOverview.tsx
import React from 'react';
import { useSimpleDashboard } from '../../hooks/useSimpleDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SimpleTeamOverview: React.FC = () => {
  const { data, loading, error, refreshData } = useSimpleDashboard();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-lg">Loading Capitals data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={refreshData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const basicStats = data.teamStats.basic.stats[0].splits[0].stat;
  const advancedStats = data.teamStats.advanced;

  // Top players for chart
  const topPlayers = data.playerStats.slice(0, 5).map(player => ({
    name: player.name.split(' ').pop(), // Last name only
    points: player.points,
    xPoints: player.xPoints,
    goals: player.goals
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Washington Capitals</h1>
            <p className="text-red-100 mt-1">2024-25 Season Analytics</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-red-100">Last Updated</div>
            <div className="text-sm">{data.lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">W</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Record</dt>
                  <dd className="text-xl font-medium text-gray-900">
                    {basicStats.wins}-{basicStats.losses}-{basicStats.ot}
                  </dd>
                  <dd className="text-sm text-gray-500">{basicStats.pts} points</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">G</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Goals/Game</dt>
                  <dd className="text-xl font-medium text-gray-900">
                    {basicStats.goalsPerGame}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {basicStats.goalsAgainstPerGame} against
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">PP</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Power Play</dt>
                  <dd className="text-xl font-medium text-gray-900">
                    {basicStats.powerPlayPercentage}%
                  </dd>
                  <dd className="text-sm text-gray-500">
                    PK: {basicStats.penaltyKillPercentage}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">xG</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expected Goals</dt>
                  <dd className="text-xl font-medium text-gray-900">
                    {advancedStats.xGoalsFor.toFixed(1)}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {advancedStats.xGoalsAgainst.toFixed(1)} against
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(advancedStats.corsiForPct * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Corsi For %</div>
              <div className="text-xs text-gray-400">Shot attempt differential</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(advancedStats.xGoalsForPct * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Expected Goals %</div>
              <div className="text-xs text-gray-400">Quality chance share</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                +{(advancedStats.xGoalsFor - advancedStats.xGoalsAgainst).toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">xGoal Differential</div>
              <div className="text-xs text-gray-400">Per game average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Players Chart */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Scorers</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPlayers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'points' ? 'Points' : 
                    name === 'xPoints' ? 'Expected Points' : 
                    'Goals'
                  ]}
                />
                <Bar dataKey="points" fill="#dc2626" name="points" />
                <Bar dataKey="goals" fill="#059669" name="goals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Player Stats Table */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Player Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Games
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Goals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assists
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Corsi%
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.playerStats.map((player, index) => (
                  <tr key={player.playerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.games}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.goals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.assists}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(player.corsiForPct * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};