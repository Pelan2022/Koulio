# Fixing 502 Bad Gateway Error for unrollit.aici.cz

## Problem Analysis

The 502 Bad Gateway error indicates that the backend service is not running properly or there's a configuration issue.

## Root Causes Identified

1. **Port Configuration Mismatch**: Server was configured for port 80, but Docker exposes port 3000
2. **Database Connection Issues**: App might fail to start if database is unreachable
3. **Missing Environment Variables**: Production environment not properly configured

## Solutions Applied

### 1. Fixed Port Configuration
- Changed default port from 80 to 3000 in `server.js`
- Updated Dockerfile to use correct port
- Added startup script with proper environment handling

### 2. Improved Error Handling
- Added graceful database connection handling
- Server can start even if database is temporarily unavailable
- Added comprehensive logging for debugging

### 3. Created Diagnostic Tools
- `test_connection.js` - Tests database connectivity
- `test_server.js` - Tests server startup
- `start.sh` - Enhanced startup script with diagnostics

## Deployment Steps

### 1. Update Environment Variables in CapRover
Set these environment variables in your CapRover dashboard:

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=koulio_db
DB_USER=koulio_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_at_least_32_characters
ALLOWED_ORIGINS=https://unrollit.aici.cz,http://localhost:3000
```

### 2. Deploy Updated Code
```bash
# Commit and push your changes
git add .
git commit -m "Fix 502 error: Update port configuration and error handling"
git push origin main
```

### 3. Monitor Deployment
- Check CapRover logs for any startup errors
- Test the health endpoint: `https://unrollit.aici.cz/health`
- Verify database connectivity

## Testing Commands

### Local Testing
```bash
# Test database connection
cd backend
node test_connection.js

# Test server startup
node test_server.js

# Start server with diagnostics
sh start.sh
```

### Production Testing
```bash
# Health check
curl https://unrollit.aici.cz/health

# API documentation
curl https://unrollit.aici.cz/api

# Database status
curl https://unrollit.aici.cz/health/ready
```

## Troubleshooting

### If 502 Error Persists

1. **Check CapRover Logs**:
   - Go to CapRover dashboard
   - Check application logs for errors
   - Look for database connection failures

2. **Verify Environment Variables**:
   - Ensure all required environment variables are set
   - Check database credentials are correct
   - Verify CORS origins include your domain

3. **Test Database Connection**:
   - Use the MCP PostgreSQL tools to verify database is accessible
   - Check if database host/port are correct
   - Verify user permissions

4. **Check Port Configuration**:
   - Ensure CapRover is configured to use port 3000
   - Verify no port conflicts
   - Check if HTTPS is properly configured

### Common Issues

1. **Database Connection Timeout**:
   - Check if database host is accessible from CapRover
   - Verify firewall settings
   - Test with `test_connection.js`

2. **CORS Issues**:
   - Ensure `ALLOWED_ORIGINS` includes your domain
   - Check if HTTPS/HTTP mismatch

3. **Memory Issues**:
   - Monitor memory usage in CapRover
   - Check if application is being killed due to memory limits

## Success Indicators

✅ **Fixed when you see**:
- Health endpoint returns 200 status
- Database shows as "connected" in health response
- No errors in CapRover logs
- Application starts successfully

## Next Steps

After fixing the 502 error:
1. Test all API endpoints
2. Verify user authentication works
3. Check database operations
4. Monitor performance and logs
5. Set up proper monitoring and alerts

