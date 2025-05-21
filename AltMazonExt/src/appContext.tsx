import {createContext, ReactNode} from 'react';

interface AltMazonContextProps {
  userId: string | undefined;
}

interface AltMazonProviderProps {
  children: ReactNode;
}

export const AltMazonContext = createContext<AltMazonContextProps | undefined>(undefined);

export function PsnxtProvider({ children }: AltMazonProviderProps) {
  // State variables

  return (
    <AltMazonContext.Provider value={{
      userId: undefined, // replace with actual userId state
      //add state variables here
    }}>
      {children}
    </AltMazonContext.Provider>
  );
};