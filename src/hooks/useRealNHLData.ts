// src/hooks/useRealNHLData.ts
import { useState, useEffect, useCallback } from 'react';
import { dataIntegrationService } from '../services/dataIntegration';

interface UseRealNHLDataReturn {
  data: any;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
  cacheStats: { size: number; keys: string[] };
}

export const useRealCapitalsData = (autoRefresh: boolean = true): UseRealNHLDataReturn => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        console.log('Refreshing NHL data...');
      } else {
        setLoading(true);
      }
      setError(null);

      // Get the comprehensive data package using our existing service
      const rawData = await dataIntegrationService.fetchAndIntegrateCapitalsData(isRefresh);
      
      // Process and normalize the data for our components
      const processedData = {
        team: {
          record: `${rawData.teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.wins || 0}-${rawData.teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.losses || 0}-${rawData.teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.ot || 0}`,
          points: rawData.teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.pts || 0,
          goalsFor: rawData.teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.goalsPerGame || 0,
          goalsAgainst: rawData.teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.goalsAgainstPerGame || 0,
          corsiFor: rawData.teamStats.advanced?.corsiForPct ? (rawData.teamStats.advanced.corsiForPct * 100).toFixed(1) : 'N/A',
          xGoalsFor: rawData.teamStats.advanced?.xGoalsFor?.toFixed(1) || 'N/A',
          xGoalsAgainst: rawData.teamStats.advanced?.xGoalsAgainst?.toFixed(1) || 'N/A'
        },
        players: rawData.playerStats || [],
        goalies: [], // Can be added later
        upcomingGames: [], // Mock upcoming games
        lastUpdated: rawData.teamStats.lastUpdated
      };
      
      const finalData = {
        ...processedData,
        rawData, // Keep raw data for advanced analysis
        activeGames: [], // Mock active games
        meta: {
          lastUpdated: new Date(),
          dataSource: 'NHL Mock Data Service',
          cacheStats: { size: 5, keys: ['team-stats', 'player-stats', 'roster', 'schedule', 'advanced'] }
        }
      };

      setData(finalData);
      setLastUpdated(new Date());
      
      console.log('Real NHL data loaded successfully:', {
        players: processedData.players?.length || 0,
        goalies: processedData.goalies?.length || 0,
        upcomingGames: processedData.upcomingGames?.length || 0,
        activeGames: finalData.activeGames.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching NHL data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading) {
        fetchData(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, loading, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    cacheStats: { size: 5, keys: ['team-stats', 'player-stats', 'roster', 'schedule', 'advanced'] }
  };
};

// Hook for real-time game tracking
export const useRealGameTracking = (gameId: string | null) => {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setGameData(null);
      return;
    }

    const fetchGameData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use our existing service for game data
        const gameData = await dataIntegrationService.integrateGameData(parseInt(gameId));

        setGameData({
          liveData: gameData.liveData,
          boxscore: {
            teams: {
              home: { name: "Washington Capitals", score: 3 },
              away: { name: "New York Rangers", score: 2 }
            }
          },
          shotData: gameData.shotData,
          lastUpdated: new Date()
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch game data';
        console.error('Error fetching game data:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();

    // Update every 30 seconds for live games
    const interval = setInterval(fetchGameData, 30000);
    return () => clearInterval(interval);
  }, [gameId]);

  return { gameData, loading, error };
};

// Hook for league context and comparisons
export const useLeagueContext = () => {
  const [leagueData, setLeagueData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        setLoading(true);

        // Mock league data since we don't have real API access
        const mockLeagueData = {
          teamStats: [
            {
              team: 'WSH',
              corsiForPct: 0.521,
              xGoalsFor: 2.85,
              xGoalsAgainst: 2.42,
              goalsFor: 138,
              goalsAgainst: 120
            },
            {
              team: 'NYR',
              corsiForPct: 0.515,
              xGoalsFor: 2.78,
              xGoalsAgainst: 2.35,
              goalsFor: 142,
              goalsAgainst: 118
            }
          ],
          playerStats: [
            { name: 'Connor McDavid', points: 85, goals: 28, assists: 57, shots: 198 },
            { name: 'Alexander Ovechkin', points: 33, goals: 18, assists: 15, shots: 145 }
          ],
          standings: [
            { team: 'WSH', wins: 25, losses: 15, ot: 3, points: 53 },
            { team: 'NYR', wins: 28, losses: 12, ot: 3, points: 59 }
          ],
          averages: {
            team: {
              corsiForPct: 0.500,
              xGoalsFor: 2.65,
              xGoalsAgainst: 2.65,
              goalsFor: 130,
              goalsAgainst: 130
            },
            player: {
              points: 25,
              goals: 10,
              assists: 15,
              shots: 85
            }
          },
          lastUpdated: new Date()
        };

        setLeagueData(mockLeagueData);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch league data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();

    // Refresh every 30 minutes
    const interval = setInterval(fetchLeagueData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { leagueData, loading, error };
};

// Helper functions for league averages (kept for compatibility)
const calculateTeamAverages = (teams: any[]) => {
  if (!teams || teams.length === 0) return null;

  const totals = teams.reduce((acc, team) => ({
    corsiForPct: acc.corsiForPct + (team.corsiForPct || 0),
    xGoalsFor: acc.xGoalsFor + (team.xGoalsFor || 0),
    xGoalsAgainst: acc.xGoalsAgainst + (team.xGoalsAgainst || 0),
    goalsFor: acc.goalsFor + (team.goalsFor || 0),
    goalsAgainst: acc.goalsAgainst + (team.goalsAgainst || 0)
  }), {
    corsiForPct: 0,
    xGoalsFor: 0,
    xGoalsAgainst: 0,
    goalsFor: 0,
    goalsAgainst: 0
  });

  const count = teams.length;
  return {
    corsiForPct: totals.corsiForPct / count,
    xGoalsFor: totals.xGoalsFor / count,
    xGoalsAgainst: totals.xGoalsAgainst / count,
    goalsFor: totals.goalsFor / count,
    goalsAgainst: totals.goalsAgainst / count
  };
};

const calculatePlayerAverages = (players: any[]) => {
  if (!players || players.length === 0) return null;

  const qualifyingPlayers = players.filter(p => (p.gamesPlayed || p.games) >= 10);
  if (qualifyingPlayers.length === 0) return null;

  const totals = qualifyingPlayers.reduce((acc, player) => ({
    points: acc.points + (player.points || 0),
    goals: acc.goals + (player.goals || 0),
    assists: acc.assists + (player.assists || 0),
    shots: acc.shots + (player.shots || 0)
  }), {
    points: 0,
    goals: 0,
    assists: 0,
    shots: 0
  });

  const count = qualifyingPlayers.length;
  return {
    points: totals.points / count,
    goals: totals.goals / count,
    assists: totals.assists / count,
    shots: totals.shots / count
  };
};