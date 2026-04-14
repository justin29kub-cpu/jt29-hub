import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "jt29_database.db")

engine = create_engine(
    f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=True)
    credit_balance = Column(Float, default=0.0)
    is_admin = Column(Boolean, default=False)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    image_url = Column(String, nullable=True)  # รูปสินค้า
    keys = relationship("ProductKey", back_populates="product", cascade="all, delete-orphan")


class ProductKey(Base):
    __tablename__ = "product_keys"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    key_value = Column(String)
    is_sold = Column(Boolean, default=False)
    product = relationship("Product", back_populates="keys")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    key_id = Column(Integer, ForeignKey("product_keys.id"))
    customer_id = Column(Integer, ForeignKey("users.id"))
    payment_status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)  # เวลาซื้อ


class TopupLog(Base):
    __tablename__ = "topup_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    voucher_hash = Column(String)
    status = Column(String, default="success")
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_default_admin():
    """สร้าง admin account อัตโนมัติถ้ายังไม่มี"""
    from auth import get_password_hash
    db = SessionLocal()
    try:
        if db.query(User).filter(User.is_admin == True).count() == 0:
            admin_username = os.environ.get("ADMIN_USERNAME", "adminjustin")
            admin_password = os.environ.get("ADMIN_PASSWORD", "changeme123")
            admin = User(
                username=admin_username,
                password_hash=get_password_hash(admin_password),
                credit_balance=0.0,
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print(f"[SETUP] Created default admin: {admin_username}")
    except Exception as e:
        print(f"[SETUP] Error creating admin: {e}")
    finally:
        db.close()


create_default_admin()
