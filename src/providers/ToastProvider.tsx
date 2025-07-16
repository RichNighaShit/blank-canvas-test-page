
import { useState, useEffect, createContext, useContext } from "react";
import { Toaster } from "@/components/ui/toaster";

interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastContext = createContext<{}>({});

export function ToastProvider({ children }: ToastProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastContext.Provider value={{}}>
      {children}
      {mounted && <Toaster />}
    </ToastContext.Provider>
  );
}

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};
