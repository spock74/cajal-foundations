/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {onCall, HttpsError, CallableOptions, CallableRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Opções padrão para todas as Cloud Functions 'onCall'.
 * Centraliza a configuração de CORS, segredos e região.
 */
const defaultOptions: CallableOptions = {
  secrets: ["GEMINI_API_KEY"],
  cors: [
    /^https:\/\/localhost:\d+$/,
    /^https:\/\/.*\.cloudworkstations\.dev$/,
    // Adicionando a origem específica do Cloud Workstation para garantir a permissão
    "https://5173-firebase-cajalfoundationsgit-1759352952209.cluster-thle3dudhffpwss7zs5hxaeu2o.cloudworkstations.dev",
    // Adiciona o domínio de produção explicitamente para resolver o problema de CORS.
    "https://newcajalfoundations.web.app",
  ],
  // Adicionar outras opções globais aqui, como 'region'.
};

/**
 * Cria uma Cloud Function 'onCall' segura, encapsulando a verificação de autenticação.
 * @param handler A função de negócio a ser executada se o usuário estiver autenticado.
 *                Recebe os mesmos parâmetros que o handler original do onCall.
 * @returns Uma Cloud Function pronta para ser exportada.
 */
export function createAuthenticatedFunction<T, ReturnT>(
  handler: (request: CallableRequest<T>) => ReturnT | Promise<ReturnT>
) {
  return onCall<T>(defaultOptions, (request) => {
    if (!request.auth) {
      logger.error("Tentativa de chamada não autenticada.");
      throw new HttpsError("unauthenticated", "A função só pode ser chamada por usuários autenticados.");
    }
    return handler(request);
  });
}
