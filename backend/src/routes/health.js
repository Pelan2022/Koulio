const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * @route   GET /health
 * @desc    Simple health check endpoint - just pong
 * @access  Public
 */
router.get('/', (req, res) => {
    console.log('Health check called:', new Date().toISOString());
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes/CapRover
 * @access  Public
 */
router.get('/ready', async (req, res) => {
    try {
        // Kontrola připojení k databázi
        await database.query('SELECT 1');
        
        res.json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Readiness probe failed', {
            error: error.message
        });
        
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            message: 'Service not ready'
        });
    }
});

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes/CapRover
 * @access  Public
 */
router.get('/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
