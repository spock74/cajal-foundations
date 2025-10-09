import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: ["lib/"],
  },
  // Estende as configurações recomendadas para todos os arquivos
  ...tseslint.configs.recommended,
  {
    // Configuração para todos os arquivos de código-fonte TypeScript
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Regras de estilo, agora como avisos para não bloquear o deploy
      "quotes": ["warn", "double"],
      "indent": ["warn", 2],
      "max-len": ["warn", {code: 180}],
      "object-curly-spacing": ["warn", "never"],
      "eol-last": ["warn", "always"],
      // Permite o uso de 'any' para flexibilidade durante o desenvolvimento
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];