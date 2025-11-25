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
        
        # Log request
        logger.info(f"→ {request.method} {request.url.path}")
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            status_code = response.status_code
            log_level = logging.INFO if status_code < 400 else logging.ERROR
            logger.log(
                log_level,
                f"← {request.method} {request.url.path} - {status_code} ({duration:.2f}s)"
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"← {request.method} {request.url.path} - ERROR ({duration:.2f}s): {str(e)}",
                exc_info=True
            )
            raise
