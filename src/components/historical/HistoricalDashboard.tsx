// src/components/historical/HistoricalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { historicalDataService } from '../../services/historicalDataService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HistoricalProgress {
  totalSeasons: number;
  completedSeasons: number;
  currentSeason: string;
  progress: number;
  estimatedTimeRemaining: string;
}

export const HistoricalDashboard: React.FC = () => {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [progress, setProgress] = useState<HistoricalProgress | null>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have historical data cached
    const cachedSeasons = historicalDataService.getCachedSeasons();
    if (cachedSeasons.length > 0) {
      const analysis = historicalDataService.getHistoricalAnalysis();
      setHistoricalData(analysis);
    }
  }, []);

  const startBackfill = async () => {
    setIsBackfilling(true);
    setError(null);
    
    try {
      await historicalDataService.backfillHistoricalData(
        // Progress callback
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
        // Season complete callback
        (seasonData) => {
          console.log(`✅ Completed ${seasonData.season}`);
        }
      );

      // Generate analysis after backfill
      const analysis = historicalDataService.getHistoricalAnalysis();
      setHistoricalData(analysis);
      
    } catch (err) {
      setError('Failed to backfill historical data. Please try again.');
      console.error('Backfill error:', err);
    } finally {
      setIsBackfilling(false);
    }
  };

  const BackfillProgress: React.FC = () => {
    if (!progress) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📚 Historical Data Backfill Progress
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Season: {progress.currentSeason}</span>
            <span>{progress.completedSeasons} / {progress.totalSeasons}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {progress.progress.toFixed(1)}% Complete
            </span>
            <span className="text-gray-600">
              ETA: {progress.estimatedTimeRemaining}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const OvechkinCareerChart: React.FC = () => {
    if (!historicalData?.ovechkinProgression) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 Alexander Ovechkin Career Progression
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData.ovechkinProgression}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="season" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="goals" 
                stroke="#dc2626" 
                strokeWidth={3}
                name="Goals"
              />
              <Line 
                type="monotone" 
                dataKey="xGoals" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Expected Goals"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Red line shows actual goals, blue dashed line shows expected goals
        </p>
      </div>
    );
  };

  const TeamPerformanceChart: React.FC = () => {
    if (!historicalData?.teamProgression) return null;

    const chartData = historicalData.teamProgression.map((season: any) => ({
      ...season,
      goalsPG: (season.goalsFor / season.games).toFixed(2),
      goalsAgainstPG: (season.goalsAgainst / season.games).toFixed(2)
    }));

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Team Performance Over Time
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="season" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="goalsPG" 
                stroke="#059669" 
                strokeWidth={2}
                name="Goals For/Game"
              />
              <Line 
                type="monotone" 
                dataKey="goalsAgainstPG" 
                stroke="#dc2626" 
                strokeWidth={2}
                name="Goals Against/Game"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const HistoricalInsights: React.FC = () => {
    if (!historicalData) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Historical Insights ({historicalData.totalSeasons} Seasons)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key Achievements</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {historicalData.insights?.map((insight: string, index: number) => (
                <li key={index}>• {insight}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Notable Seasons</h4>
            <div className="space-y-2 text-sm">
              {historicalData.bestSeason && (
                <div className="p-2 bg-green-50 rounded">
                  <span className="font-medium text-green-800">Best Offensive: </span>
                  <span className="text-green-700">
                    {historicalData.bestSeason.season} 
                    ({(historicalData.bestSeason.goalsFor / historicalData.bestSeason.games).toFixed(2)} GPG)
                  </span>
                </div>
              )}
              
              {historicalData.cupSeason && (
                <div className="p-2 bg-yellow-50 rounded">
                  <span className="font-medium text-yellow-800">🏆 Stanley Cup: </span>
                  <span className="text-yellow-700">2017-2018</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <h2 className="text-3xl font-bold">Historical Data Analysis</h2>
        <p className="text-blue-100 mt-1">
          Washington Capitals data from 2008-2009 to present
        </p>
      </div>

      {/* Backfill Control */}
      {!historicalData && !isBackfilling && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📚 Load Historical Data
          </h3>
          <p className="text-gray-600 mb-4">
            Load 15+ years of Washington Capitals data to unlock advanced historical analysis, 
            career progressions, and trend insights.
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={startBackfill}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              🚀 Start Historical Backfill
            </button>
            <span className="text-sm text-gray-500">
              This will take 5-10 minutes to complete
            </span>
          </div>
        </div>
      )}

      {/* Progress Display */}
      {isBackfilling && <BackfillProgress />}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Historical Analysis */}
      {historicalData && (
        <>
          <HistoricalInsights />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OvechkinCareerChart />
            <TeamPerformanceChart />
          </div>
          
          {/* Export Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💾 Data Management
            </h3>
            <div className="flex space-x-4">
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => {
                  const data = historicalDataService.exportHistoricalData();
                  console.log('Historical data exported:', data.length, 'seasons');
                  alert(`Exported ${data.length} seasons of data to console`);
                }}
              >
                📊 Export to Console
              </button>
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={startBackfill}
                disabled={isBackfilling}
              >
                🔄 Refresh Historical Data
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};