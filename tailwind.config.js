/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Ativa o modo escuro baseado na classe `dark` no HTML
  theme: {
    extend: {
      colors: {
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        "background-secondary": withOpacity('--background-secondary'),
        "background-input": withOpacity('--background-input'),
        border: withOpacity('--border'),
        "background-hover": withOpacity('--background-hover'),

        "primary-accent": withOpacity('--primary-accent'),
        "primary-accent-foreground": withOpacity('--primary-accent-foreground'),

        "secondary-accent": withOpacity('--secondary-accent'),
        "secondary-accent-foreground": withOpacity('--secondary-accent-foreground'),
        
        destructive: withOpacity('--destructive'),

        "button-background": withOpacity('--button-background'),
        "button-background-hover": withOpacity('--button-background-hover'),
        "button-foreground": withOpacity('--button-foreground'),
        
        "button-disabled-background": withOpacity('--button-disabled-background'),
        "button-disabled-foreground": withOpacity('--button-disabled-foreground'),

        "foreground-muted": withOpacity('--foreground-muted'),
      },
    },
  },
  plugins: [],
};
