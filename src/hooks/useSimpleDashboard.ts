// src/hooks/useSimpleDashboard.ts
import { useState, useEffect } from 'react';

// Simple mock data that works without external dependencies
const mockCapitalsData = {
  teamStats: {
    basic: {
      stats: [{
        splits: [{
          stat: {
            wins: 25,
            losses: 15,
            ot: 3,
            pts: 53,
            goalsPerGame: 3.2,
            goalsAgainstPerGame: 2.8,
            powerPlayPercentage: "22.5",
            penaltyKillPercentage: "81.2"
          }
        }]
      }]
    },
    advanced: {
      team: 'WSH',
      corsiForPct: 0.521,
      xGoalsFor: 2.85,
      xGoalsAgainst: 2.42,
      xGoalsForPct: 0.541
    }
  },
  playerStats: [
    {
      playerId: 8471214,
      name: "Alexander Ovechkin",
      team: "WSH",
      position: "L",
      games: 43,
      goals: 18,
      assists: 15,
      points: 33,
      shots: 145,
      icetime: 1205,
      xGoals: 15.2,
      xAssists: 12.8,
      xPoints: 28.0,
      corsiForPct: 0.485,
      fenwickForPct: 0.492
    },
    {
      playerId: 8470638,
      name: "Nicklas Backstrom",
      team: "WSH",
      position: "C",
      games: 35,
      goals: 8,
      assists: 22,
      points: 30,
      shots: 89,
      icetime: 1089,
      xGoals: 9.1,
      xAssists: 19.5,
      xPoints: 28.6,
      corsiForPct: 0.512,
      fenwickForPct: 0.518
    },
    {
      playerId: 8476346,
      name: "Tom Wilson",
      team: "WSH",
      position: "R",
      games: 40,
      goals: 12,
      assists: 18,
      points: 30,
      shots: 98,
      icetime: 945,
      xGoals: 10.8,
      xAssists: 15.2,
      xPoints: 26.0,
      corsiForPct: 0.495,
      fenwickForPct: 0.501
    },
    {
      playerId: 8477493,
      name: "Evgeny Kuznetsov",
      team: "WSH",
      position: "C",
      games: 38,
      goals: 10,
      assists: 16,
      points: 26,
      shots: 76,
      icetime: 892,
      xGoals: 8.9,
      xAssists: 14.1,
      xPoints: 23.0,
      corsiForPct: 0.478,
      fenwickForPct: 0.485
    },
    {
      playerId: 8474590,
      name: "T.J. Oshie",
      team: "WSH",
      position: "R",
      games: 35,
      goals: 9,
      assists: 12,
      points: 21,
      shots: 67,
      icetime: 721,
      xGoals: 7.8,
      xAssists: 10.5,
      xPoints: 18.3,
      corsiForPct: 0.501,
      fenwickForPct: 0.508
    }
  ],
  roster: {
    roster: [
      {
        person: {
          id: 8471214,
          fullName: "Alexander Ovechkin",
          firstName: "Alexander",
          lastName: "Ovechkin"
        },
        jerseyNumber: "8",
        position: {
          code: "L",
          name: "Left Wing",
          abbreviation: "LW"
        }
      }
    ]
  },
  lastUpdated: new Date()
};

interface UseSimpleDashboardReturn {
  data: typeof mockCapitalsData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useSimpleDashboard = (): UseSimpleDashboardReturn => {
  const [data, setData] = useState<typeof mockCapitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        ...mockCapitalsData,
        lastUpdated: new Date()
      });
      
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    loading,
    error,
    refreshData
  };
};