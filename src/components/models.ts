/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

export interface ModelInfo {
    name: string;
    in: number; // Preço por 1M de tokens de entrada
    out: number; // Preço por 1M de tokens de saída
}

export const models: Record<string, ModelInfo> = {
    "gemini-2.5-flash-lite": {
        "name": "gemini-2.5-flash-lite",
        "in": 0.10,
        "out": 0.40
    },
    "gemini-2.5-flash": {
        "name": "gemini-2.5-flash",
        "in": 0.30,
        "out": 2.50
    },
    "gemini-2.5-pro": {
        "name": "gemini-2.5-pro",
        "in": 1.25,
        "out": 2.50
    },
};

export const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export const modelOptions = Object.values(models);