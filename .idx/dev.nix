{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.pnpm
  ];
  idx.extensions = [
    # Extensões recomendadas para um projeto React + TypeScript
    "dbaeumer.vscode-eslint" # Integração com ESLint para análise de código
    "esbenp.prettier-vscode" # Formatador de código automático
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}