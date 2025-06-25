import React from 'react';
import { useCapitalsData } from '../../hooks/useCapitalsData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TeamOverview: React.FC = () => {
  const { teamStats, loading, error } = useCapitalsData();

  if (loading) return <div className="text-center">Loading team data...</div>;
  if (error) return <div className="text-center text-red-600">Error loading data</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Season Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Record</h3>
              <p className="text-2xl font-bold text-red-900">
                {teamStats?.basic?.stats?.[0]?.splits?.[0]?.stat?.wins || 0}-
                {teamStats?.basic?.stats?.[0]?.splits?.[0]?.stat?.losses || 0}-
                {teamStats?.basic?.stats?.[0]?.splits?.[0]?.stat?.ot || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Goals For</h3>
              <p className="text-2xl font-bold text-blue-900">
                {teamStats?.basic?.stats?.[0]?.splits?.[0]?.stat?.goalsPerGame || 0}
              </p>
              <p className="text-xs text-blue-600">per game</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Corsi For %</h3>
              <p className="text-2xl font-bold text-green-900">
                {teamStats?.advanced?.corsiForPct ? (teamStats.advanced.corsiForPct * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">xGF%</h3>
              <p className="text-2xl font-bold text-purple-900">
                {teamStats?.advanced?.xGoalsForPct ? (teamStats.advanced.xGoalsForPct * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="corsi" stroke="#dc2626" strokeWidth={2} />
                <Line type="monotone" dataKey="xGoals" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
