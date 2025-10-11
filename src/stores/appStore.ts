/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { create } from 'zustand';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createGroupSlice, GroupSlice } from './groupSlice';
// No futuro, você importará outros slices aqui
// import { createGroupSlice, GroupSlice } from './groupSlice';

// O tipo do store combinado será a interseção de todos os slices
type AppState = ChatSlice & GroupSlice; // & OutroSlice...

export const useAppStore = create<AppState>()((...a) => ({
  ...createChatSlice(...a),
  ...createGroupSlice(...a),
  // ...createGroupSlice(...a),
  // ...createOutroSlice(...a),
}));

// Agora, em vez de `useAppContext`, você usará `useAppStore` nos seus componentes.
// Ex: const { chatMessages, sendMessage, isLoading } = useAppStore();