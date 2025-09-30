/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';

const themes = [
  { name: 'light', icon: <Sun size={16} /> },
  { name: 'dark', icon: <Moon size={16} /> },
  { name: 'dracula', icon: <Palette size={16} /> },
  { name: 'system', icon: <Monitor size={16} /> },
];

const ThemeSwitcher: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; 
  }

  return (
    <div className="flex items-center p-1 bg-background-input rounded-full">
      {themes.map((t) => {
        const isActive = theme === t.name;
        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 capitalize 
              ${isActive 
                ? 'bg-background shadow-sm' 
                : 'hover:bg-background-hover'
              }
            `}
            title={`Mudar para tema ${t.name}`}
            aria-label={`Mudar para tema ${t.name}`}
          >
            <span className={isActive ? 'text-primary-accent' : 'text-foreground-muted'}>
              {t.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
