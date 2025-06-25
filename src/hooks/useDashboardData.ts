// src/hooks/useDashboardData.ts
import { useState, useEffect, useCallback } from 'react';
import { dataIntegrationService } from '../services/dataIntegration';

// Local type definitions to avoid import issues
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

interface DashboardData {
  teamStats: any;
  playerStats: PlayerStats[];
  roster: any;
  schedule: any;
  predictions: {
    playoffProbability: number;
    projectedRecord: { wins: number; losses: number; ot: number };
    keyInsights: string[];
    recommendations: string[];
  };
  contractAnalysis: {
    capEfficiency: number;
    valueOverReplacement: number;
    contractRecommendations: Array<{
      player: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  tradeAnalysis: {
    tradeTargets: Array<{
      player: string;
      team: string;
      value: number;
      fit: string;
      cost: string;
    }>;
    availableAssets: Array<{
      player: string;
      value: number;
      tradeability: 'high' | 'medium' | 'low';
    }>;
    capSpace: number;
    recommendations: string[];
  };
  teamReport: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    actionItems: string[];
  };
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadDashboardData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Loading comprehensive dashboard data...');

      // Fetch core data
      const coreData = await dataIntegrationService.fetchAndIntegrateCapitalsData(isRefresh);
      
      console.log('Core data loaded, generating analytics...');

      // Generate all analytics in parallel for better performance
      const [predictions, teamReport] = await Promise.all([
        dataIntegrationService.generatePredictiveInsights(coreData.teamStats, coreData.playerStats),
        dataIntegrationService.generateTeamReport()
      ]);

      // Create mock contract and trade analysis since these methods don't exist in our simplified service
      const contractAnalysis = {
        capEfficiency: 85.2,
        valueOverReplacement: 12.3,
        contractRecommendations: [
          {
            player: 'Alexander Ovechkin',
            recommendation: 'Contract provides excellent value despite high AAV',
            priority: 'high' as const
          },
          {
            player: 'Tom Wilson',
            recommendation: 'Priority contract extension - excellent value',
            priority: 'high' as const
          }
        ]
      };

      const tradeAnalysis = {
        tradeTargets: [
          {
            player: 'Jakob Chychrun',
            team: 'OTT',
            value: 8.5,
            fit: 'Top-4 defenseman, left shot, excellent PP quarterback',
            cost: '1st round pick + prospect + roster player'
          },
          {
            player: 'Chris Tanev',
            team: 'DAL',
            value: 6.2,
            fit: 'Defensive defenseman, penalty kill specialist',
            cost: '3rd round pick + conditional pick'
          }
        ],
        availableAssets: [
          {
            player: 'Lars Eller',
            value: 5.2,
            tradeability: 'high' as const
          },
          {
            player: 'Martin Fehervary',
            value: 4.8,
            tradeability: 'medium' as const
          }
        ],
        capSpace: 4.7,
        recommendations: [
          'Target: Top-4 defenseman to improve playoff depth',
          'Consider: Veteran forward with playoff experience',
          'Timing: Make moves before trade deadline for integration time'
        ]
      };

      const dashboardData: DashboardData = {
        ...coreData,
        predictions,
        contractAnalysis,
        tradeAnalysis,
        teamReport
      };

      setData(dashboardData);
      setLastUpdate(new Date());
      
      console.log('Dashboard data successfully loaded and processed');

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadDashboardData(true);
  }, [loadDashboardData]);

  // Initial data load
  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  // Set up auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !isRefreshing) {
        console.log('Auto-refreshing dashboard data...');
        loadDashboardData(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, isRefreshing, loadDashboardData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refreshData,
    isRefreshing
  };
};

// Hook for game-specific data
export const useGameData = (gameId: number | null) => {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const loadGameData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await dataIntegrationService.integrateGameData(gameId);
        setGameData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    loadGameData();

    // Set up real-time updates for live games
    const interval = setInterval(loadGameData, 30000); // 30 seconds for live games
    return () => clearInterval(interval);
  }, [gameId]);

  return { gameData, loading, error };
};

// Hook for real-time alerts and notifications
export const useRealTimeAlerts = () => {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    dismissed: boolean;
  }>>([]);

  const addAlert = useCallback((alert: Omit<typeof alerts[0], 'id' | 'timestamp' | 'dismissed'>) => {
    const newAlert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      dismissed: false
    };
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep only latest 10 alerts
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, dismissed: true } : alert
    ));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Monitor data changes and generate alerts
  const { data } = useDashboardData();

  useEffect(() => {
    if (!data) return;

    // Example alert conditions
    const powerPlayPct = data.teamStats?.basic?.stats?.[0]?.splits?.[0]?.stat?.powerPlayPercentage;
    if (powerPlayPct && parseFloat(powerPlayPct) < 18) {
      addAlert({
        type: 'warning',
        title: 'Power Play Efficiency Alert',
        message: `Power play percentage (${powerPlayPct}%) below league average. Consider line adjustments.`
      });
    }

    // Check for player performance alerts
    const underperformers = data.playerStats?.filter(p => 
      p.games >= 10 && (p.points < p.xPoints - 2)
    ) || [];

    if (underperformers.length >= 3) {
      addAlert({
        type: 'warning',
        title: 'Multiple Players Underperforming',
        message: `${underperformers.length} players are significantly below expected production.`
      });
    }

    // Playoff probability alerts
    if (data.predictions?.playoffProbability < 0.5) {
      addAlert({
        type: 'error',
        title: 'Playoff Probability Alert',
        message: `Playoff probability dropped to ${(data.predictions.playoffProbability * 100).toFixed(1)}%. Immediate action required.`
      });
    }

  }, [data, addAlert]);

  return {
    alerts: alerts.filter(alert => !alert.dismissed),
    addAlert,
    dismissAlert,
    clearAllAlerts
  };
};

// Performance monitoring hook
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    apiResponseTime: 0,
    dataProcessingTime: 0,
    renderTime: 0,
    lastMeasurement: null as Date | null
  });

  const measurePerformance = useCallback((operation: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setMetrics(prev => ({
      ...prev,
      [operation]: duration,
      lastMeasurement: new Date()
    }));
    
    console.log(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
  }, []);

  return { metrics, measurePerformance };
};