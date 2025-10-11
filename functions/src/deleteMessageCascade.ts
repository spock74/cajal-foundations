/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {createAuthenticatedFunction} from "./functionWrapper.js"; // NOSONAR
import {getFirestore} from "firebase-admin/firestore";
// import {MessageSender} from "./types";

interface DeleteMessageData {
  groupId: string;
  conversationId: string;
  messageId: string;
  generatedFromId?: string; // Adicionado para receber o ID da mensagem do usuário
}

export const deleteMessageCascade = createAuthenticatedFunction<DeleteMessageData, Promise<{ success: boolean }>>(async (request) => {
  const {groupId, conversationId, messageId, generatedFromId} = request.data;
  const userId = request.auth!.uid;

  if (!groupId || !conversationId || !messageId) {
    throw new HttpsError("invalid-argument", "groupId, conversationId, e messageId são obrigatórios.");
  }

  const db = getFirestore();

  try {
    await db.runTransaction(async (transaction) => {
      const messagesCollectionRef = db.collection(`users/${userId}/groups/${groupId}/conversations/${conversationId}/messages`);
      const messageToDeleteRef = messagesCollectionRef.doc(messageId);      
      
      // 1. Excluir a mensagem principal (da IA)
      transaction.delete(messageToDeleteRef);

      // 2. Excluir itens da biblioteca relacionados a esta mensagem
      const libraryItemsQuery = db.collection(`users/${userId}/libraryItems`).where("messageId", "==", messageId);
      const libraryItemsSnapshot = await libraryItemsQuery.get(); // Usar .get() fora de uma transação para queries
      libraryItemsSnapshot.forEach(doc => transaction.delete(doc.ref));

      // 3. Excluir a pergunta do usuário que originou esta resposta
      if (generatedFromId) {
        const userMessageRef = messagesCollectionRef.doc(generatedFromId);
        transaction.delete(userMessageRef);
      }
    });

    logger.info(`Exclusão em cascata concluída para a mensagem ${messageId}`);
    return {success: true};
  } catch (error) {
    logger.error("Erro na exclusão em cascata via Cloud Function:", error);
    throw new HttpsError("internal", "Falha ao apagar a mensagem e seus dados associados.");
  }
});
