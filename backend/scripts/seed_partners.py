"""
Seed script for partners data
"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.partners import Partner, Contact, PartnerTypeEnum
import uuid
import traceback


def seed_partners():
    """Seed the database with sample partners and contacts"""
    db = SessionLocal()
    
    try:
        # Create 5 sample partners
        partners_data = [
            {
                "code": "SUP001",
                "name": "Global Auto Parts Ltd",
                "street_number": "123",
                "city": "Dubai",
                "country": "United Arab Emirates",
                "type": PartnerTypeEnum.SUPPLIER,
                "contacts": [
                    {
                        "full_name": "Ahmed Hassan",
                        "job_title": "Sales Manager",
                        "email": "ahmed.hassan@globalauto.ae",
                        "phone1": "+971-4-1234567",
                        "phone2": "+971-50-1234567"
                    },
                    {
                        "full_name": "Sarah Williams",
                        "job_title": "Account Executive",
                        "email": "sarah.williams@globalauto.ae",
                        "phone1": "+971-4-1234568",
                        "phone2": ""
                    }
                ]
            },
            {
                "code": "CUST001",
                "name": "Premium Motors Inc",
                "street_number": "456",
                "city": "New York",
                "country": "United States",
                "type": PartnerTypeEnum.CUSTOMER,
                "contacts": [
                    {
                        "full_name": "John Smith",
                        "job_title": "Procurement Director",
                        "email": "john.smith@premiummotors.com",
                        "phone1": "+1-212-5551234",
                        "phone2": "+1-917-5551234"
                    }
                ]
            },
            {
                "code": "FWD001",
                "name": "Express Logistics Co",
                "street_number": "789",
                "city": "Rotterdam",
                "country": "Netherlands",
                "type": PartnerTypeEnum.FORWARDER,
                "contacts": [
                    {
                        "full_name": "Hans Mueller",
                        "job_title": "Operations Manager",
                        "email": "hans.mueller@expresslog.nl",
                        "phone1": "+31-10-1234567",
                        "phone2": ""
                    }
                ]
            },
            {
                "code": "AR001",
                "name": "SafeStore Warehousing",
                "street_number": "321",
                "city": "Hamburg",
                "country": "Germany",
                "type": PartnerTypeEnum.AR_STORAGE,
                "contacts": [
                    {
                        "full_name": "Klaus Schmidt",
                        "job_title": "Warehouse Supervisor",
                        "email": "klaus.schmidt@safestore.de",
                        "phone1": "+49-40-1234567",
                        "phone2": "+49-175-1234567"
                    }
                ]
            },
            {
                "code": "SUP002",
                "name": "Asia Pacific Parts Trading",
                "street_number": "555",
                "city": "Shanghai",
                "country": "China",
                "type": PartnerTypeEnum.SUPPLIER,
                "contacts": [
                    {
                        "full_name": "Li Wei",
                        "job_title": "Export Manager",
                        "email": "li.wei@apparts.cn",
                        "phone1": "+86-21-12345678",
                        "phone2": "+86-138-12345678"
                    },
                    {
                        "full_name": "Wang Mei",
                        "job_title": "Customer Service",
                        "email": "wang.mei@apparts.cn",
                        "phone1": "+86-21-12345679",
                        "phone2": ""
                    }
                ]
            }
        ]
        
        print("Seeding partners...")
        for partner_info in partners_data:
            # Check if partner exists
            existing = db.query(Partner).filter(Partner.code == partner_info["code"]).first()
            if existing:
                print(f"Partner {partner_info['code']} already exists. Skipping.")
                continue

            # Extract contacts data
            contacts_data = partner_info.pop("contacts", [])
            
            # Create partner
            partner = Partner(**partner_info)
            db.add(partner)
            db.flush()  # Flush to get the partner ID
            
            # Create contacts for this partner
            for contact_info in contacts_data:
                contact = Contact(
                    partner_id=partner.id,
                    **contact_info
                )
                db.add(contact)
            
            print(f"Created partner: {partner.name} ({partner.code})")
        
        db.commit()
        print(f"\nSuccessfully seeded {len(partners_data)} partners with their contacts!")
        
    except Exception as e:
        print(f"Error seeding partners: {e}")
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_partners()
