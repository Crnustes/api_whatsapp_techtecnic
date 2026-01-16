/**
 * Sales Flow - Lead Qualification & Scoring
 * 
 * Manages sales conversations with intelligent lead scoring
 * States: nurture → qualify → schedule → handoff
 * Features: Intent detection, minimal questions, appointment integration
 */

import { SALES_CONFIG, getLeadState, shouldTransition } from '../../config/salesConfig.js';

/**
 * Calculate lead score based on message content and history
 */
export function calculateLeadScore(message, conversationHistory = []) {
  let score = 0;
  const lowerMessage = message.toLowerCase();
  
  // 1. Intent scoring
  for (const [level, config] of Object.entries(SALES_CONFIG.scoring.intent)) {
    if (config.keywords.some(kw => lowerMessage.includes(kw))) {
      score += config.points;
      break; // Solo cuenta el nivel más alto
    }
  }
  
  // 2. Urgency scoring
  for (const [level, config] of Object.entries(SALES_CONFIG.scoring.urgency)) {
    if (config.keywords.some(kw => lowerMessage.includes(kw))) {
      score += config.points;
      break;
    }
  }
  
  // 3. Budget awareness
  const hasBudgetMention = /\$|€|precio|costo|presupuesto|\d+k|\d+mil/i.test(message);
  if (hasBudgetMention) {
    score += SALES_CONFIG.scoring.budget.mentioned.points;
  } else if (SALES_CONFIG.scoring.budget.concern.keywords.some(kw => lowerMessage.includes(kw))) {
    score += SALES_CONFIG.scoring.budget.concern.points;
  }
  
  // 4. Authority detection
  for (const [level, config] of Object.entries(SALES_CONFIG.scoring.authority)) {
    if (config.keywords.some(kw => lowerMessage.includes(kw))) {
      score += config.points;
      break;
    }
  }
  
  // 5. Specificity scoring
  if (message.length > 100 && message.split(' ').length > 20) {
    score += SALES_CONFIG.scoring.specificity.detailed.points;
  } else if (message.length > 50) {
    score += SALES_CONFIG.scoring.specificity.general.points;
  } else {
    score += SALES_CONFIG.scoring.specificity.vague.points;
  }
  
  // 6. Engagement bonus
  const isResponsive = message.length >= SALES_CONFIG.limits.minResponseLength;
  if (isResponsive) {
    score += SALES_CONFIG.scoring.engagement.responsive.points;
  }
  
  const asksQuestions = /\?/.test(message);
  if (asksQuestions) {
    score += SALES_CONFIG.scoring.engagement.asks_questions.points;
  }
  
  const sharesContext = /tenemos|estamos|nuestro|empresa|equipo|proyecto/i.test(message);
  if (sharesContext) {
    score += SALES_CONFIG.scoring.engagement.shares_context.points;
  }
  
  // Cap score at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Get next question based on current state
 */
function getNextQuestion(state, questionCount) {
  const questions = SALES_CONFIG.questions[state];
  if (!questions || questionCount >= SALES_CONFIG.limits.maxQuestionsPerState) {
    return null;
  }
  return questions[questionCount] || null;
}

/**
 * Generate response based on lead state
 */
function generateStateResponse(state, score, leadInfo) {
  const stateMessages = SALES_CONFIG.messages[state.name];
  
  switch (state.name) {
    case 'nurture':
      return {
        message: `${stateMessages.welcome}\n\n${stateMessages.educate}`,
        action: 'educate',
        nextQuestion: getNextQuestion('nurture', 0)
      };
      
    case 'qualify':
      return {
        message: stateMessages.understanding,
        action: 'qualify',
        nextQuestion: getNextQuestion('qualify', leadInfo.questionsAsked || 0)
      };
      
    case 'schedule':
      return {
        message: stateMessages.proposal,
        action: 'schedule',
        shouldTransitionToAppointment: true
      };
      
    case 'handoff':
      return {
        message: `${stateMessages.urgent}\n\n${stateMessages.connect.replace('[NOMBRE]', 'un especialista')}`,
        action: 'handoff',
        requiresHumanHandoff: true,
        priority: 'high'
      };
      
    default:
      return {
        message: '¿Cómo puedo ayudarte?',
        action: 'ask'
      };
  }
}

/**
 * Main sales flow handler
 */
export async function handleSalesFlow(userMessage, sessionData, aiService) {
  try {
    // Initialize or retrieve lead data
    const leadData = sessionData.leadData || {
      score: 0,
      state: 'nurture',
      questionsAsked: 0,
      conversationHistory: [],
      detectedNeeds: [],
      timeline: null,
      budget: null,
      authority: null
    };
    
    // Calculate new score
    const messageScore = calculateLeadScore(userMessage, leadData.conversationHistory);
    leadData.score = Math.min(100, leadData.score + messageScore);
    
    // Update conversation history
    leadData.conversationHistory.push({
      message: userMessage,
      score: messageScore,
      timestamp: Date.now()
    });
    
    // Determine current state
    const currentState = getLeadState(leadData.score);
    leadData.state = currentState.name;
    
    console.log(`[SalesFlow] Score: ${leadData.score} | State: ${currentState.label}`);
    
    // Check for transition triggers
    if (shouldTransition(leadData.score, userMessage, 'handoff')) {
      return {
        message: SALES_CONFIG.messages.handoff.urgent + '\n\n' + 
                 SALES_CONFIG.messages.handoff.immediate,
        nextFlow: 'humanHandoff',
        metadata: {
          leadScore: leadData.score,
          state: 'handoff',
          priority: 'high',
          reason: 'High-value lead detected'
        },
        sessionData: { ...sessionData, leadData }
      };
    }
    
    if (shouldTransition(leadData.score, userMessage, 'schedule')) {
      return {
        message: SALES_CONFIG.messages.schedule.proposal,
        nextFlow: 'appointment',
        metadata: {
          leadScore: leadData.score,
          state: 'schedule',
          reason: 'Lead ready for scheduling'
        },
        sessionData: { ...sessionData, leadData }
      };
    }
    
    // Generate response for current state
    const stateResponse = generateStateResponse(currentState, leadData.score, leadData);
    
    // Build final message
    let finalMessage = stateResponse.message;
    
    // Add next question if applicable
    if (stateResponse.nextQuestion && leadData.questionsAsked < SALES_CONFIG.limits.maxQuestionsPerState) {
      finalMessage += `\n\n${stateResponse.nextQuestion}`;
      leadData.questionsAsked++;
    }
    
    // Add AI-enhanced context if qualify state
    if (currentState.name === 'qualify' && aiService) {
      try {
        const aiPrompt = `Basándote en esta conversación de ventas, genera una respuesta corta (max 2 líneas) que demuestre comprensión y valor:

Usuario dice: "${userMessage}"
Score del lead: ${leadData.score}
Estado: ${currentState.label}

Responde de forma natural y consultiva.`;

        const aiResponse = await aiService.generateResponse(aiPrompt);
        if (aiResponse) {
          finalMessage = `${aiResponse}\n\n${stateResponse.nextQuestion || '¿Qué más necesitas saber?'}`;
        }
      } catch (error) {
        console.error('[SalesFlow] AI enhancement error:', error.message);
        // Continúa con mensaje estándar
      }
    }
    
    // Prepare response
    const response = {
      message: finalMessage,
      metadata: {
        leadScore: leadData.score,
        state: currentState.name,
        stateLabel: currentState.label,
        questionsAsked: leadData.questionsAsked,
        action: stateResponse.action
      },
      sessionData: { ...sessionData, leadData }
    };
    
    // Check if should transition to appointment
    if (stateResponse.shouldTransitionToAppointment) {
      response.nextFlow = 'appointment';
    }
    
    // Check if requires human handoff
    if (stateResponse.requiresHumanHandoff) {
      response.nextFlow = 'humanHandoff';
      response.metadata.priority = stateResponse.priority;
    }
    
    return response;
    
  } catch (error) {
    console.error('[SalesFlow] Error:', error);
    return {
      message: 'Disculpa, déjame conectarte con alguien del equipo.',
      nextFlow: 'humanHandoff',
      error: error.message
    };
  }
}

/**
 * Detect if message indicates sales intent
 */
export function detectSalesIntent(message) {
  const salesKeywords = [
    'precio', 'costo', 'cuánto', 'cotización', 'presupuesto',
    'comprar', 'contratar', 'necesito', 'requiero',
    'interesado', 'quisiera', 'información comercial',
    'demo', 'prueba', 'evaluar', 'comparar'
  ];
  
  const lowerMessage = message.toLowerCase();
  const hasIntent = salesKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (hasIntent) {
    const urgencyKeywords = ['urgente', 'ahora', 'ya', 'hoy', 'inmediato'];
    const isUrgent = urgencyKeywords.some(kw => lowerMessage.includes(kw));
    
    return {
      hasSalesIntent: true,
      confidence: isUrgent ? 0.9 : 0.7,
      urgency: isUrgent ? 'high' : 'medium'
    };
  }
  
  return { hasSalesIntent: false, confidence: 0, urgency: 'low' };
}

/**
 * Export lead data for CRM integration
 */
export function exportLeadData(leadData, contactInfo) {
  return {
    score: leadData.score,
    state: leadData.state,
    qualification: getLeadState(leadData.score).label,
    contact: contactInfo,
    conversationSummary: {
      totalMessages: leadData.conversationHistory.length,
      questionsAsked: leadData.questionsAsked,
      averageScore: leadData.conversationHistory.reduce((sum, h) => sum + h.score, 0) / leadData.conversationHistory.length
    },
    detectedInfo: {
      needs: leadData.detectedNeeds,
      timeline: leadData.timeline,
      budget: leadData.budget,
      authority: leadData.authority
    },
    timestamp: Date.now()
  };
}

export default {
  handleSalesFlow,
  detectSalesIntent,
  exportLeadData,
  calculateLeadScore
};
