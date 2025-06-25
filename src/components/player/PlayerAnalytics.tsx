// src/components/player/PlayerAnalytics.tsx
import React, { useState, useMemo } from 'react';
import { useCapitalsData } from '../../hooks/useCapitalsData';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar
} from 'recharts';

// Local type definition to avoid import issues
interface PlayerStats {
  playerId: number;
  season: number;
  name: string;
  team: string;
  position: string;
  games: number;
  icetime: number;
  xGoals: number;
  xAssists: number;
  xPoints: number;
  goals: number;
  assists: number;
  points: number;
  shots: number;
  corsiForPct: number;
  fenwickForPct: number;
}

interface PlayerCardProps {
  player: PlayerStats;
  isSelected: boolean;
  onClick: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isSelected, onClick }) => {
  const efficiency = player.points / Math.max(player.icetime / 60, 1); // Points per hour
  const xPointsDiff = player.points - player.xPoints;
  
  return (
    <div 
      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-red-500 bg-red-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 truncate">{player.name}</h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{player.position}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Points:</span>
          <span className="font-medium ml-1">{player.points}</span>
        </div>
        <div>
          <span className="text-gray-500">xPoints:</span>
          <span className="font-medium ml-1">{player.xPoints.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-gray-500">CF%:</span>
          <span className="font-medium ml-1">{(player.corsiForPct * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-gray-500">Efficiency:</span>
          <span className="font-medium ml-1">{efficiency.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">vs Expected:</span>
          <span className={`text-xs font-medium ${xPointsDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {xPointsDiff >= 0 ? '+' : ''}{xPointsDiff.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PlayerAnalytics: React.FC = () => {
  const { playerStats, loading, error } = useCapitalsData();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  const filteredPlayers = useMemo(() => {
    if (!playerStats) return [];
    
    let filtered = playerStats.filter(player => player.games >= 5); // Minimum games threshold
    
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }
    
    return filtered.sort((a, b) => b.points - a.points);
  }, [playerStats, positionFilter]);

  const scatterData = useMemo(() => {
    return filteredPlayers.map(player => ({
      x: player.xPoints,
      y: player.points,
      name: player.name,
      position: player.position,
      corsi: player.corsiForPct,
      icetime: player.icetime,
      efficiency: player.points / Math.max(player.icetime / 60, 1)
    }));
  }, [filteredPlayers]);

  const radarData = useMemo(() => {
    if (!selectedPlayer) return [];
    
    // Normalize stats to 0-100 scale based on team percentiles
    const normalizeToPercentile = (value: number, allValues: number[]) => {
      const sorted = allValues.sort((a, b) => a - b);
      const rank = sorted.findIndex(v => v >= value);
      return Math.round((rank / sorted.length) * 100);
    };

    const allPoints = filteredPlayers.map(p => p.points);
    const allCorsi = filteredPlayers.map(p => p.corsiForPct);
    const allXGoals = filteredPlayers.map(p => p.xGoals);
    const allShots = filteredPlayers.map(p => p.shots);
    const allIcetime = filteredPlayers.map(p => p.icetime);

    return [
      {
        metric: 'Points',
        value: normalizeToPercentile(selectedPlayer.points, allPoints),
        fullMark: 100
      },
      {
        metric: 'Corsi%',
        value: normalizeToPercentile(selectedPlayer.corsiForPct, allCorsi),
        fullMark: 100
      },
      {
        metric: 'xGoals',
        value: normalizeToPercentile(selectedPlayer.xGoals, allXGoals),
        fullMark: 100
      },
      {
        metric: 'Shots',
        value: normalizeToPercentile(selectedPlayer.shots, allShots),
        fullMark: 100
      },
      {
        metric: 'Ice Time',
        value: normalizeToPercentile(selectedPlayer.icetime, allIcetime),
        fullMark: 100
      }
    ];
  }, [selectedPlayer, filteredPlayers]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-lg">Loading player analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Error loading player data: {error}</div>
      </div>
    );
  }

  const positions = ['ALL', ...Array.from(new Set(filteredPlayers.map(p => p.position)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Player Analytics Dashboard</h2>
        
        {/* Position Filter */}
        <div className="flex flex-wrap gap-2">
          {positions.map(position => (
            <button
              key={position}
              onClick={() => setPositionFilter(position)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                positionFilter === position
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {position}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Team Roster</h3>
            <p className="text-sm text-gray-500">{filteredPlayers.length} players</p>
          </div>
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {filteredPlayers.map(player => (
              <PlayerCard
                key={player.playerId}
                player={player}
                isSelected={selectedPlayer?.playerId === player.playerId}
                onClick={() => setSelectedPlayer(player)}
              />
            ))}
          </div>
        </div>

        {/* Analysis Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scatter Plot - Points vs Expected Points */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Production vs Expected (xPoints)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    name="Expected Points"
                    label={{ value: 'Expected Points', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="y" 
                    name="Actual Points"
                    label={{ value: 'Actual Points', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toFixed(1) : value, 
                      name === 'x' ? 'Expected Points' : 'Actual Points'
                    ]}
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.name} (${payload[0].payload.position})`;
                      }
                      return '';
                    }}
                  />
                  <Scatter 
                    dataKey="y" 
                    fill="#dc2626"
                    fillOpacity={0.7}
                  />
                  {/* Add diagonal line for expected performance */}
                  {scatterData.length > 0 && (
                    <Scatter 
                      data={[
                        { x: 0, y: 0 },
                        { x: Math.max(...scatterData.map(d => d.x)), y: Math.max(...scatterData.map(d => d.x)) }
                      ]}
                      line={{ stroke: '#6b7280', strokeDasharray: '5 5' }}
                      fill="none"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Points above the diagonal line indicate players outperforming expected production
            </p>
          </div>

          {/* Player Radar Chart */}
          {selectedPlayer && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedPlayer.name} - Performance Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Radar
                        name={selectedPlayer.name}
                        dataKey="value"
                        stroke="#dc2626"
                        fill="#dc2626"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Team Percentile']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Key Statistics</h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Games Played:</span>
                        <span className="font-medium">{selectedPlayer.games}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Goals:</span>
                        <span className="font-medium">{selectedPlayer.goals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Assists:</span>
                        <span className="font-medium">{selectedPlayer.assists}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ice Time/Game:</span>
                        <span className="font-medium">{(selectedPlayer.icetime / selectedPlayer.games / 60).toFixed(1)} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shots/Game:</span>
                        <span className="font-medium">{(selectedPlayer.shots / selectedPlayer.games).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Advanced Metrics</h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Expected Goals:</span>
                        <span className="font-medium">{selectedPlayer.xGoals.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Goals Above Expected:</span>
                        <span className={`font-medium ${(selectedPlayer.goals - selectedPlayer.xGoals) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(selectedPlayer.goals - selectedPlayer.xGoals) >= 0 ? '+' : ''}{(selectedPlayer.goals - selectedPlayer.xGoals).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Corsi For %:</span>
                        <span className="font-medium">{(selectedPlayer.corsiForPct * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fenwick For %:</span>
                        <span className="font-medium">{(selectedPlayer.fenwickForPct * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};