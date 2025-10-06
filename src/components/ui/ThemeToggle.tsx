/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppContext } from '@/AppContext';
import { Button } from '@/components/ui/button'; // Supondo que você tenha um componente de botão

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useAppContext();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
};