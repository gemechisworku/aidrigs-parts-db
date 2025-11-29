"""
Logging middleware for HTTP requests
"""
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all HTTP requests and responses"""
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Build request details
        path = request.url.path
        query_params = str(request.url.query) if request.url.query else ""
        client_ip = request.client.host if request.client else "unknown"
        
        # Log request with details
        request_log = f"→ {request.method} {path}"
        if query_params:
            request_log += f"?{query_params}"
        request_log += f" [IP: {client_ip}]"
        logger.info(request_log)
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            status_code = response.status_code
            log_level = logging.INFO if status_code < 400 else logging.ERROR
            
            response_log = f"← {request.method} {path} - {status_code} ({duration:.3f}s)"
            logger.log(log_level, response_log)
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"← {request.method} {path} - ERROR ({duration:.3f}s): {str(e)}",
                exc_info=True
            )
            raise
