import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, ForeignKey
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
    """The Customer / Admin Account"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=True) # Optional since we simulate user
    credit_balance = Column(Float, default=0.0)
    is_admin = Column(Boolean, default=False)

class Product(Base):
    """The Store Catalog Item"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    
    keys = relationship("ProductKey", back_populates="product", cascade="all, delete-orphan")

class ProductKey(Base):
    """The actual string key/code that is sold to the user"""
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

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
