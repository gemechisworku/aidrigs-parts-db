import sys
import logging

logging.basicConfig(level=logging.INFO)

try:
    print("Importing Base...")
    from app.models.base import BaseModel
    
    print("Importing User...")
    from app.models.user import User
    
    print("Importing RBAC...")
    from app.models.rbac import Role, UserRole, Permission, RolePermission
    
    print("Importing Part...")
    from app.models.part import Part
    
    print("Importing Category...")
    from app.models.classification import Category
    
    print("Importing Manufacturer...")
    from app.models.manufacturer import Manufacturer
    
    print("All imports successful.")
    
    print("Configuring mappers...")
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    print("Mappers configured successfully.")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
