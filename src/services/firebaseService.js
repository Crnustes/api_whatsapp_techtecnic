/**
 * Firebase Service
 * Servicio para gestionar datos persistentes en Firebase Realtime Database
 * Incluye: ClientProfiles, Sessions, Conversations, Opportunities
 */

import { getClientProfilesRef, getSessionsRef, getConversationsRef, getOpportunitiesRef } from '../config/firebase.js';

/**
 * ============================================
 * CLIENT PROFILES - Perfiles persistentes
 * ============================================
 */

/**
 * Obtener perfil de cliente por teléfono
 */
export const getClientProfile = async (phoneNumber) => {
  const ref = getClientProfilesRef();
  if (!ref) return null;

  try {
    const snapshot = await ref.child(phoneNumber).get();
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error obteniendo perfil cliente:', error);
    return null;
  }
};

/**
 * Crear o actualizar perfil de cliente
 */
export const saveClientProfile = async (phoneNumber, profileData) => {
  const ref = getClientProfilesRef();
  if (!ref) return false;

  try {
    const existingProfile = await getClientProfile(phoneNumber);
    
    const profile = {
      phoneNumber,
      firstName: profileData.firstName || existingProfile?.firstName || '',
      lastName: profileData.lastName || existingProfile?.lastName || '',
      email: profileData.email || existingProfile?.email || '',
      company: profileData.company || existingProfile?.company || '',
      industry: profileData.industry || existingProfile?.industry || '',
      
      // Historial
      firstContactDate: existingProfile?.firstContactDate || new Date().toISOString(),
      lastInteractionDate: new Date().toISOString(),
      totalInteractions: (existingProfile?.totalInteractions || 0) + 1,
      
      // Estado
      status: profileData.status || existingProfile?.status || 'lead',
      
      // Preferencias
      interestedServices: profileData.interestedServices || existingProfile?.interestedServices || [],
      notes: profileData.notes || existingProfile?.notes || '',
      
      // Metadata
      updatedAt: new Date().toISOString()
    };

    await ref.child(phoneNumber).set(profile);
    return profile;
  } catch (error) {
    console.error('Error guardando perfil cliente:', error);
    return false;
  }
};

/**
 * ============================================
 * SESSIONS - Sesiones con contexto
 * ============================================
 */

/**
 * Guardar sesión activa
 */
export const saveSession = async (userId, sessionData) => {
  const ref = getSessionsRef();
  if (!ref) return false;

  try {
    await ref.child(userId).set({
      ...sessionData,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error guardando sesión:', error);
    return false;
  }
};

/**
 * Obtener sesión activa
 */
export const getSession = async (userId) => {
  const ref = getSessionsRef();
  if (!ref) return null;

  try {
    const snapshot = await ref.child(userId).get();
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    return null;
  }
};

/**
 * Eliminar sesión
 */
export const deleteSession = async (userId) => {
  const ref = getSessionsRef();
  if (!ref) return false;

  try {
    await ref.child(userId).remove();
    return true;
  } catch (error) {
    console.error('Error eliminando sesión:', error);
    return false;
  }
};

/**
 * ============================================
 * CONVERSATIONS - Historial completo
 * ============================================
 */

/**
 * Guardar conversación completa
 */
export const saveConversation = async (conversationData) => {
  const ref = getConversationsRef();
  if (!ref) return false;

  try {
    const newConversationRef = ref.push();
    await newConversationRef.set({
      ...conversationData,
      createdAt: new Date().toISOString()
    });
    return newConversationRef.key;
  } catch (error) {
    console.error('Error guardando conversación:', error);
    return false;
  }
};

/**
 * Obtener últimas conversaciones de un usuario
 */
export const getUserConversations = async (phoneNumber, limit = 5) => {
  const ref = getConversationsRef();
  if (!ref) return [];

  try {
    const snapshot = await ref
      .orderByChild('phoneNumber')
      .equalTo(phoneNumber)
      .limitToLast(limit)
      .get();
    
    if (!snapshot.exists()) return [];
    
    const conversations = [];
    snapshot.forEach(child => {
      conversations.push({ id: child.key, ...child.val() });
    });
    
    return conversations;
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    return [];
  }
};

/**
 * ============================================
 * OPPORTUNITIES - Oportunidades de venta
 * ============================================
 */

/**
 * Guardar oportunidad detectada
 */
export const saveOpportunity = async (opportunityData) => {
  const ref = getOpportunitiesRef();
  if (!ref) return false;

  try {
    const newOpportunityRef = ref.push();
    await newOpportunityRef.set({
      ...opportunityData,
      createdAt: new Date().toISOString(),
      status: opportunityData.status || 'pending'
    });
    return newOpportunityRef.key;
  } catch (error) {
    console.error('Error guardando oportunidad:', error);
    return false;
  }
};

/**
 * Obtener oportunidades de un cliente
 */
export const getClientOpportunities = async (phoneNumber) => {
  const ref = getOpportunitiesRef();
  if (!ref) return [];

  try {
    const snapshot = await ref
      .orderByChild('phoneNumber')
      .equalTo(phoneNumber)
      .get();
    
    if (!snapshot.exists()) return [];
    
    const opportunities = [];
    snapshot.forEach(child => {
      opportunities.push({ id: child.key, ...child.val() });
    });
    
    return opportunities;
  } catch (error) {
    console.error('Error obteniendo oportunidades:', error);
    return [];
  }
};

/**
 * ============================================
 * UTILIDADES
 * ============================================
 */

/**
 * Verificar si Firebase está disponible
 */
export const isFirebaseAvailable = () => {
  return getClientProfilesRef() !== null;
};

export default {
  // Client Profiles
  getClientProfile,
  saveClientProfile,
  
  // Sessions
  saveSession,
  getSession,
  deleteSession,
  
  // Conversations
  saveConversation,
  getUserConversations,
  
  // Opportunities
  saveOpportunity,
  getClientOpportunities,
  
  // Utils
  isFirebaseAvailable
};
