const express = require('express');
const app = express();

// Serve static files
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API endpoint
app.get('/api', (req, res) => {
    res.json({ message: 'Unroll API is working!' });
});

// Start server
const PORT = process.env.PORT || 80;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health: http://${HOST}:${PORT}/health`);
    console.log(`🌐 API: http://${HOST}:${PORT}/api`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
