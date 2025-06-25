// src/hooks/useCapitalsData.ts
import { useState, useEffect } from 'react';
import { dataIntegrationService } from '../services/dataIntegration';

// Define types locally to avoid import issues
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

interface TeamStatsData {
  basic: any;
  advanced: any;
}

interface UseCapitalsDataReturn {
  roster: any;
  teamStats: TeamStatsData | null;
  playerStats: PlayerStats[] | null;
  loading: boolean;
  error: string | null;
}

export const useCapitalsData = (): UseCapitalsDataReturn => {
  const [roster, setRoster] = useState<any>(null);
  const [teamStats, setTeamStats] = useState<TeamStatsData | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the data integration service
        const data = await dataIntegrationService.fetchAndIntegrateCapitalsData();

        setRoster(data.roster);
        setTeamStats(data.teamStats);
        setPlayerStats(data.playerStats);

      } catch (err) {
        console.error('Error fetching Capitals data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { roster, teamStats, playerStats, loading, error };
};