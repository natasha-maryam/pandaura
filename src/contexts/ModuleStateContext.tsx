import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface ModuleState {
  [key: string]: any;
}

interface ModuleStateContextType {
  getModuleState: (moduleName: string) => any;
  setModuleState: (moduleName: string, state: any) => void;
  clearModuleState: (moduleName: string) => void;
  saveModuleState: (moduleName: string, state: any) => void;
}

const ModuleStateContext = createContext<ModuleStateContextType | undefined>(undefined);

export const useModuleState = () => {
  const context = useContext(ModuleStateContext);
  if (!context) {
    throw new Error('useModuleState must be used within a ModuleStateProvider');
  }
  return context;
};

interface ModuleStateProviderProps {
  children: ReactNode;
}

export const ModuleStateProvider: React.FC<ModuleStateProviderProps> = ({ children }) => {
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>({});

  const getModuleState = useCallback((moduleName: string) => {
    return moduleStates[moduleName] || {};
  }, [moduleStates]);

  const setModuleState = useCallback((moduleName: string, state: any) => {
    setModuleStates(prev => {
      // Only update if state actually changed
      const currentState = prev[moduleName] || {};
      const newState = { ...currentState, ...state };
      
      // Shallow comparison to avoid unnecessary updates
      if (JSON.stringify(currentState) === JSON.stringify(newState)) {
        return prev;
      }
      
      return {
        ...prev,
        [moduleName]: newState
      };
    });
  }, []);

  const clearModuleState = useCallback((moduleName: string) => {
    setModuleStates(prev => {
      if (!prev[moduleName]) return prev; // No change needed
      
      const newStates = { ...prev };
      delete newStates[moduleName];
      return newStates;
    });
  }, []);

  const saveModuleState = useCallback((moduleName: string, state: any) => {
    // Debounced save to localStorage
    const timeoutId = setTimeout(() => {
      try {
        const savedStates = JSON.parse(localStorage.getItem('pandaura_module_states') || '{}');
        savedStates[moduleName] = state;
        localStorage.setItem('pandaura_module_states', JSON.stringify(savedStates));
      } catch (error) {
        console.warn('Failed to save module state to localStorage:', error);
      }
    }, 100); // 100ms debounce
    
    setModuleState(moduleName, state);
    
    return () => clearTimeout(timeoutId);
  }, [setModuleState]);

  // Load states from localStorage on initialization
  React.useEffect(() => {
    try {
      const savedStates = JSON.parse(localStorage.getItem('pandaura_module_states') || '{}');
      setModuleStates(savedStates);
    } catch (error) {
      console.warn('Failed to load module states from localStorage:', error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    getModuleState,
    setModuleState,
    clearModuleState,
    saveModuleState
  }), [getModuleState, setModuleState, clearModuleState, saveModuleState]);

  return (
    <ModuleStateContext.Provider value={contextValue}>
      {children}
    </ModuleStateContext.Provider>
  );
};