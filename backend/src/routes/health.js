const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * @route   GET /health
 * @desc    Health check endpoint for CapRover and monitoring
 * @access  Public
 */
router.get('/', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Základní health check
        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0'
        };
        
        // Kontrola databáze
        let dbStatus = 'disconnected';
        let dbResponseTime = 0;
        
        try {
            const dbStartTime = Date.now();
            await database.query('SELECT 1');
            dbResponseTime = Date.now() - dbStartTime;
            dbStatus = 'connected';
        } catch (dbError) {
            logger.error('Database health check failed', {
                error: dbError.message,
                stack: dbError.stack
            });
            dbStatus = 'error';
        }
        
        // Přidání databázových informací
        healthStatus.database = {
            status: dbStatus,
            responseTime: `${dbResponseTime}ms`
        };
        
        // Kontrola paměti
        const memoryUsage = process.memoryUsage();
        healthStatus.memory = {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        };
        
        // Celková doba odezvy
        const totalResponseTime = Date.now() - startTime;
        healthStatus.responseTime = `${totalResponseTime}ms`;
        
        // Logování health check
        logger.metrics.health(dbStatus === 'connected' ? 'healthy' : 'unhealthy', {
            dbStatus,
            responseTime: totalResponseTime,
            memoryUsage: memoryUsage.heapUsed
        });
        
        // Pokud je databáze nedostupná, vrať 503
        if (dbStatus === 'error') {
            return res.status(503).json({
                ...healthStatus,
                status: 'error',
                message: 'Database connection failed'
            });
        }
        
        res.json(healthStatus);
        
    } catch (error) {
        logger.error('Health check failed', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Health check failed',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
        });
    }
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
