/**
 * Dashboard Routes
 * Endpoints para visualizar métricas
 */

import express from 'express';
import { getAdminMetrics, getClientMetrics, getServiceStats } from '../services/dashboardService.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

/**
 * Dashboard Admin (Tech Tecnic)
 * GET /dashboard
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.query.tenant || 'techtecnic';
    const htmlPath = join(__dirname, '../views/dashboard-admin.html');
    const html = readFileSync(htmlPath, 'utf8');
    res.send(html);
  } catch (error) {
    console.error('[Dashboard] Error serving admin dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

/**
 * Dashboard API - Métricas Admin
 * GET /dashboard/api/metrics
 */
router.get('/api/metrics', async (req, res) => {
  try {
    const tenantId = req.query.tenant || 'techtecnic';
    const metrics = await getAdminMetrics(tenantId);
    res.json(metrics);
  } catch (error) {
    console.error('[Dashboard] Error getting metrics:', error);
    res.status(500).json({ error: 'Error fetching metrics' });
  }
});

/**
 * Dashboard Cliente
 * GET /dashboard/client/:phone
 */
router.get('/client/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const tenantId = req.query.tenant || 'techtecnic';
    
    const htmlPath = join(__dirname, '../views/dashboard-client.html');
    const html = readFileSync(htmlPath, 'utf8')
      .replace('{{PHONE}}', phone)
      .replace('{{TENANT}}', tenantId);
    
    res.send(html);
  } catch (error) {
    console.error('[Dashboard] Error serving client dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

/**
 * Dashboard API - Métricas Cliente
 * GET /dashboard/api/client/:phone
 */
router.get('/api/client/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const tenantId = req.query.tenant || 'techtecnic';
    const metrics = await getClientMetrics(phone, tenantId);
    res.json(metrics);
  } catch (error) {
    console.error('[Dashboard] Error getting client metrics:', error);
    res.status(500).json({ error: 'Error fetching client metrics' });
  }
});

/**
 * Dashboard API - Estadísticas de Servicios
 * GET /dashboard/api/services
 */
router.get('/api/services', async (req, res) => {
  try {
    const tenantId = req.query.tenant || 'techtecnic';
    const stats = await getServiceStats(tenantId);
    res.json(stats);
  } catch (error) {
    console.error('[Dashboard] Error getting service stats:', error);
    res.status(500).json({ error: 'Error fetching service stats' });
  }
});

export default router;
