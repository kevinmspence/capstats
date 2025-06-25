// src/components/common/DataModeSwitch.tsx
import React, { useState } from 'react';

interface DataModeSwitchProps {
  onModeChange: (useRealData: boolean) => void;
}

export const DataModeSwitch: React.FC<DataModeSwitchProps> = ({ onModeChange }) => {
  const [useRealData, setUseRealData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const newMode = !useRealData;
    setUseRealData(newMode);
    
    try {
      await onModeChange(newMode);
    } catch (error) {
      console.error('Error switching data mode:', error);
      // Revert on error
      setUseRealData(!newMode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-2">
        <span className={`text-sm font-medium ${!useRealData ? 'text-blue-600' : 'text-gray-500'}`}>
          Mock Data
        </span>
        
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
            useRealData ? 'bg-red-600' : 'bg-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              useRealData ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        
        <span className={`text-sm font-medium ${useRealData ? 'text-red-600' : 'text-gray-500'}`}>
          🔴 Live NHL Data
        </span>
      </div>
      
      {isLoading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          <span className="text-xs text-gray-500">Switching...</span>
        </div>
      )}
      
      {useRealData && !isLoading && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">LIVE</span>
        </div>
      )}
    </div>
  );
};