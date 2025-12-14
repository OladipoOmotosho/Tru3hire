import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  hasCompletedOnboarding: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    // TODO: Implement actual login logic
    // For now, mock a logged-in user
    setUser({
      id: "1",
      email,
      name: "John Doe",
      hasCompletedOnboarding: false,
    });
  };

  const signup = (name: string, email: string, password: string) => {
    // TODO: Implement actual signup logic
    // For now, mock a new user who needs onboarding
    setUser({
      id: "1",
      email,
      name,
      hasCompletedOnboarding: false,
    });
  };

  const logout = () => {
    setUser(null);
  };

  const completeOnboarding = () => {
    if (user) {
      setUser({
        ...user,
        hasCompletedOnboarding: true,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        completeOnboarding,
        isAuthenticated: !!user,
        hasCompletedOnboarding: user?.hasCompletedOnboarding ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
