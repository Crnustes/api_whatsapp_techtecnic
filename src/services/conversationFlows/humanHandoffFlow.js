/**
 * Human Handoff Flow
 * Flujo para escalar a agentes humanos
 * Gestiona asignación de agentes disponibles
 */

import sessionManager from '../sessionManager.js';
import whatsappService from '../whatsappService.js';
import googleSheetsService from '../googleSheetsService.js';

class HumanHandoffFlow {
  /**
   * Iniciar escalado a agente humano
   */
  async initiate(userId) {
    sessionManager.setFlow(userId, 'humanHandoff', {
      step: 'initiate',
      data: {}
    });

    const message = `👤 *Conectando con un especialista...*\n\nEsperando a un agente disponible.\n\nMientras esperas, cuéntanos brevemente tu situación:`;
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Continuar flujo de escalado
   */
  async continueFlow(userId, message) {
    const flowData = sessionManager.getFlowData(userId);

    if (message.type === 'text') {
      const userInput = message.text.body.trim();
      return this.handleEscalationInfo(userId, userInput);
    }
  }

  /**
   * Manejar información de escalado
   */
  async handleEscalationInfo(userId, info) {
    const session = sessionManager.getSession(userId);
    const clientName = sessionManager.getMetadata(userId, 'clientName') || 'Cliente';

    // Guardar ticket de escalado
    const ticketData = {
      timestamp: new Date().toISOString(),
      userId: userId,
      clientName: clientName,
      issue: info,
      status: 'pendiente',
      assignedAgent: null
    };

    try {
      // Guardar en Google Sheets
      const sheetData = [
        ticketData.timestamp,
        userId,
        clientName,
        info,
        'activo'
      ];

      await googleSheetsService(sheetData, 'escalados');

      // Buscar agente disponible
      const agent = await this.findAvailableAgent();

      if (agent) {
        return this.assignToAgent(userId, agent, clientName, info);
      } else {
        return this.createWaitingQueue(userId, clientName, info);
      }

    } catch (error) {
      console.error('Error escalando:', error);
      await whatsappService.sendMessage(userId, '❌ Hubo un error. Intenta nuevamente.');
      sessionManager.clearFlow(userId);
    }
  }

  /**
   * Asignar a agente disponible
   */
  async assignToAgent(userId, agent, clientName, issue) {
    sessionManager.updateFlowData(userId, {
      assignedAgent: agent.id,
      status: 'assigned'
    });

    // Mensaje al cliente
    const clientMessage = `✅ *¡Conectado con ${agent.name}!*\n\nEspecialista en: ${agent.specialization}\n\nTe responderá en breve. Gracias por tu paciencia 😊`;
    await whatsappService.sendMessage(userId, clientMessage);

    // Notificación al agente (esto en un sistema real iría a una BD)
    console.log(`Nuevo ticket asignado al agente ${agent.name}:`);
    console.log(`Cliente: ${clientName}`);
    console.log(`Issue: ${issue}`);
    console.log(`WhatsApp: ${userId}`);

    sessionManager.clearFlow(userId);
  }

  /**
   * Crear cola de espera
   */
  async createWaitingQueue(userId, clientName, issue) {
    sessionManager.updateFlowData(userId, {
      status: 'waiting'
    });

    const message = `⏳ *En la cola de espera*\n\nNo hay agentes disponibles en este momento, pero tu solicitud está en la cola.\n\nUn especialista se pondrá en contacto en menos de 30 minutos.\n\nTu código de ticket: #${this.generateTicketId()}`;

    await whatsappService.sendMessage(userId, message);
    sessionManager.clearFlow(userId);
  }

  /**
   * Buscar agente disponible
   * En un sistema real, esto consultaría una BD o servicio
   */
  async findAvailableAgent() {
    // Mock de agentes disponibles
    const mockAgents = [
      {
        id: 'agent_001',
        name: 'Juan',
        specialization: 'Desarrollo Web',
        available: true
      },
      {
        id: 'agent_002',
        name: 'María',
        specialization: 'Apps Móviles',
        available: false
      },
      {
        id: 'agent_003',
        name: 'Carlos',
        specialization: 'Ecommerce',
        available: true
      }
    ];

    // Buscar primer agente disponible
    return mockAgents.find(agent => agent.available) || null;
  }

  /**
   * Generar ID único de ticket
   */
  generateTicketId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}-${random}`;
  }

  /**
   * Mensaje de bienvenida para agente
   */
  getAgentWelcomeMessage(clientName, issue) {
    return `
🔴 NUEVO TICKET

Cliente: ${clientName}
Asunto: ${issue}
Hora: ${new Date().toLocaleTimeString()}

Detalles disponibles:
- Historial de conversación
- Intentos anteriores de soporte

¿Aceptas este ticket? (Sí/No)
    `.trim();
  }
}

export default new HumanHandoffFlow();
