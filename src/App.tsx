// src/App.tsx
import React, { useState } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SimpleTeamOverview } from './components/team/SimpleTeamOverview';
import { PlayerAnalytics } from './components/player/PlayerAnalytics';
import { DataModeSwitch } from './components/common/DataModeSwitch';
import { dataIntegrationService } from './services/dataIntegration';
import './App.css';

import { HistoricalDashboard } from './components/historical/HistoricalDashboard';

type ActiveTab = 'team' | 'players' | 'games' | 'advanced' | 'historical';

const NavigationTabs: React.FC<{ activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void }> = ({
  activeTab,
  setActiveTab
}) => {
  const tabs = [
    { id: 'team' as const, label: 'Team Overview', icon: '🏒' },
    { id: 'players' as const, label: 'Player Analytics', icon: '👤' },
    { id: 'games' as const, label: 'Game Analysis', icon: '🥅' },
    { id: 'advanced' as const, label: 'Advanced Stats', icon: '📊' },
    { id: 'historical' as const, label: 'Historical Data', icon: '📚' }
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

const GameAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Washington Capitals vs New York Rangers</h1>
            <p className="text-red-100 mt-1">Period 3 - 15:23</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">3 - 2</div>
            <div className="text-sm text-red-100">Shots: 28 - 24</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-sm font-medium text-gray-500">Expected Goals</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold text-red-600">2.8</span>
            <span className="text-lg text-gray-400 mx-2">-</span>
            <span className="text-2xl font-bold text-gray-600">2.1</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-sm font-medium text-gray-500">Shot Quality</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600">0.093</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Avg xG per shot</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-sm font-medium text-gray-500">High Danger</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold text-green-600">8</span>
            <span className="text-lg text-gray-400 mx-2">-</span>
            <span className="text-2xl font-bold text-gray-600">5</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-sm font-medium text-gray-500">Corsi</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-600">52.1%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Shot attempt share</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Key Events</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">P3 4:37</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">WSH</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">GOAL</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Goal by T. Wilson (Assist: Ovechkin, Backstrom)</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">P2 18:45</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">WSH</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">SHOT</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Shot by A. Ovechkin - Save by Shesterkin</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
            <div className="w-2 h-2 rounded-full mt-2 bg-red-500" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">P2 12:30</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">NYR</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">PENALTY</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Tripping - C. Kreider - 2 min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvancedStats: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Analytics Suite</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Predictive Models */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">🔮 Predictive Models</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Playoff probability: 73.2%</li>
              <li>• Expected final record: 47-28-7</li>
              <li>• Stanley Cup odds: 8.1%</li>
              <li>• Trade deadline buyer probability: 65%</li>
            </ul>
          </div>

          {/* Contract Analytics */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">💰 Contract Analytics</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>• Cap efficiency: 85.2%</li>
              <li>• Value over replacement: +12.3</li>
              <li>• Expiring contracts: $23.1M</li>
              <li>• Draft pick value: $45.2M</li>
            </ul>
          </div>

          {/* Real-time Data Status */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3">📡 Live Data Feed</h3>
            <ul className="space-y-2 text-sm text-red-800">
              <li>• Data source: NHL Official API</li>
              <li>• MoneyPuck analytics: Active</li>
              <li>• Update frequency: 2 minutes</li>
              <li>• Cache status: Optimized</li>
            </ul>
          </div>

          {/* Matchup Analysis */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">⚔️ Matchup Analysis</h3>
            <ul className="space-y-2 text-sm text-orange-800">
              <li>• Best matchup: vs Philadelphia</li>
              <li>• Worst matchup: vs Boston</li>
              <li>• Home advantage: +12.3%</li>
              <li>• Back-to-back impact: -8.7%</li>
            </ul>
          </div>

          {/* Line Optimization */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">🔄 Line Optimization</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li>• Optimal line chemistry score: 87.4</li>
              <li>• Suggested changes: 3</li>
              <li>• Power play efficiency: 94.2%</li>
              <li>• Penalty kill rating: 91.8%</li>
            </ul>
          </div>

          {/* Trade Analysis */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🔄 Trade Scenarios</h3>
            <ul className="space-y-2 text-sm text-gray-800">
              <li>• Top trade target value: $8.2M</li>
              <li>• Assets available: 12</li>
              <li>• Cap space available: $4.7M</li>
              <li>• Deadline strategy: Aggressive buyer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Real-time Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Real-time Alerts</h3>
        
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                🔴 LIVE DATA: Connected to NHL Official API
              </p>
              <p className="text-xs text-green-600">Real-time updates every 2 minutes</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                MoneyPuck advanced analytics integrated
              </p>
              <p className="text-xs text-blue-600">Expected goals and possession metrics active</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Performance optimized with intelligent caching
              </p>
              <p className="text-xs text-yellow-600">Balancing real-time data with fast load times</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('team');
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  const handleDataModeChange = async (useRealData: boolean) => {
    console.log(`🔄 Switching to ${useRealData ? 'REAL' : 'MOCK'} data mode...`);
    
    if (useRealData) {
      // Force refresh real data
      await dataIntegrationService.fetchAndIntegrateCapitalsData(true);
      
      // Start auto-refresh for real data
      dataIntegrationService.startAutoRefresh(2); // Every 2 minutes
      
      console.log('✅ Real NHL data mode activated!');
    } else {
      console.log('✅ Mock data mode activated!');
    }
    
    // Trigger re-render of components
    setDataRefreshKey(prev => prev + 1);
  };

  const renderActiveComponent = () => {
    const key = `${activeTab}-${dataRefreshKey}`;
    
    switch (activeTab) {
      case 'team':
        return <SimpleTeamOverview key={key} />;
      case 'players':
        return <PlayerAnalytics key={key} />;
      case 'games':
        return <GameAnalysis key={key} />;
      case 'advanced':
        return <AdvancedStats key={key} />;
      case 'historical':
        return <HistoricalDashboard key={key} />;
      default:
        return <SimpleTeamOverview key={key} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        {/* Data Mode Switch */}
        <div className="mb-6">
          <DataModeSwitch onModeChange={handleDataModeChange} />
        </div>
        
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        {renderActiveComponent()}
      </div>
    </DashboardLayout>
  );
}

export default App;