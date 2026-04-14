import os
import requests
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import timedelta, datetime

from database import engine, get_db, Product, ProductKey, Order, User, TopupLog
from auth import verify_password, get_password_hash, create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI(title="JT29 HUB API")

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TRUEMONEY_PHONE = os.environ.get("TRUEMONEY_PHONE", "0621466134")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


# --- Pydantic Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str

class ProductSchema(BaseModel):
    id: int
    name: str
    category: str
    description: str
    price: float
    stock_count: int
    image_url: Optional[str] = None

class BuyProductRequest(BaseModel):
    product_id: int

class TopupRequest(BaseModel):
    voucher_url: str

class AddCreditRequest(BaseModel):
    user_id: int
    amount: float

class ChangePasswordRequest(BaseModel):
    user_id: int
    new_password: str

class AddProductRequest(BaseModel):
    name: str
    category: str
    description: str
    price: float
    image_url: Optional[str] = None

class AddKeysRequest(BaseModel):
    product_id: int
    keys: List[str]


# --- AUTH API ---
@app.post("/api/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User created successfully"}

@app.post("/api/login", response_model=Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.is_admin}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- STOREFRONT API ---
@app.get("/api/me")
def get_my_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "credit_balance": current_user.credit_balance,
        "is_admin": current_user.is_admin,
    }

@app.post("/api/topup/truemoney")
def topup_truemoney(req: TopupRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    voucher_hash = req.voucher_url
    if "?v=" in req.voucher_url:
        voucher_hash = req.voucher_url.split("?v=")[-1]

    if voucher_hash.upper().startswith("TEST-"):
        try:
            amount = float(voucher_hash.split("-")[-1])
        except ValueError:
            amount = 0
        current_user.credit_balance += amount
        log = TopupLog(user_id=current_user.id, amount=amount, voucher_hash=voucher_hash, status="success")
        db.add(log)
        db.commit()
        return {"status": "success", "amount": amount, "message": f"MOCK: Topped up {amount} ฿"}

    try:
        url = f"https://gift.truemoney.com/campaign/vouchers/{voucher_hash}/redeem"
        res = requests.post(url, json={"mobile": TRUEMONEY_PHONE, "voucher_hash": voucher_hash}, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": "https://gift.truemoney.com",
            "Referer": f"https://gift.truemoney.com/campaign/?v={voucher_hash}",
        }, timeout=10)

        if res.status_code != 200:
            if "cloudflare" in res.text.lower() or "<html" in res.text.lower():
                raise HTTPException(status_code=400, detail="TrueMoney system is blocking automated requests.")
            try:
                error_msg = res.json().get("status", {}).get("message", "Invalid voucher or network error")
                raise HTTPException(status_code=400, detail=error_msg)
            except Exception:
                raise HTTPException(status_code=400, detail=f"TrueMoney API error (HTTP {res.status_code})")

        data = res.json()
        if data.get("status", {}).get("code") == "SUCCESS":
            amount = float(data["data"]["my_ticket"]["amount_baht"])
            current_user.credit_balance += amount
            log = TopupLog(user_id=current_user.id, amount=amount, voucher_hash=voucher_hash, status="success")
            db.add(log)
            db.commit()
            return {"status": "success", "amount": amount, "message": f"Successfully topped up {amount} ฿"}
        else:
            msg = data.get("status", {}).get("message", "Invalid or already redeemed voucher")
            log = TopupLog(user_id=current_user.id, amount=0, voucher_hash=voucher_hash, status="failed")
            db.add(log)
            db.commit()
            raise HTTPException(status_code=400, detail=msg)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"System Error: {str(e)}")

@app.get("/api/products", response_model=List[ProductSchema])
def get_store_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    results = []
    for p in products:
        stock = db.query(ProductKey).filter(ProductKey.product_id == p.id, ProductKey.is_sold == False).count()
        results.append({
            "id": p.id, "name": p.name, "category": p.category,
            "description": p.description, "price": p.price,
            "stock_count": stock, "image_url": p.image_url,
        })
    return results

@app.post("/api/buy")
def buy_product(req: BuyProductRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if current_user.credit_balance < product.price:
        raise HTTPException(status_code=400, detail="Insufficient credits.")
    available_key = db.query(ProductKey).filter(
        ProductKey.product_id == req.product_id, ProductKey.is_sold == False
    ).first()
    if not available_key:
        raise HTTPException(status_code=400, detail="Out of stock!")
    current_user.credit_balance -= product.price
    available_key.is_sold = True
    new_order = Order(product_id=product.id, key_id=available_key.id, customer_id=current_user.id)
    db.add(new_order)
    db.commit()
    return {"status": "success", "key_value": available_key.key_value, "new_balance": current_user.credit_balance}


# --- ADMIN API ---
@app.get("/api/admin/users")
def get_all_users(admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(User).all()

@app.post("/api/admin/users/credit")
def adjust_user_credit(req: AddCreditRequest, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.credit_balance += req.amount
    db.commit()
    return {"message": "Credit updated", "new_balance": user.credit_balance}

@app.post("/api/admin/users/password")
def change_user_password(req: ChangePasswordRequest, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@app.post("/api/admin/products")
def add_product(req: AddProductRequest, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    p = Product(name=req.name, category=req.category, description=req.description, price=req.price, image_url=req.image_url)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@app.delete("/api/admin/products/{product_id}")
def delete_product(product_id: int, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.query(ProductKey).filter(ProductKey.product_id == p.id).delete()
    db.delete(p)
    db.commit()
    return {"message": "Product deleted"}

@app.post("/api/admin/keys")
def add_keys(req: AddKeysRequest, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == req.product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    new_keys = [ProductKey(product_id=req.product_id, key_value=k.strip()) for k in req.keys]
    db.add_all(new_keys)
    db.commit()
    return {"message": f"Added {len(new_keys)} keys"}

@app.get("/api/admin/dashboard")
def admin_dashboard(admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_sales = db.query(Order).count()
    revenue = db.query(func.sum(Product.price)).join(Order, Product.id == Order.product_id).scalar() or 0.0
    products_count = db.query(Product).count()
    keys_in_stock = db.query(ProductKey).filter(ProductKey.is_sold == False).count()
    return {"total_sales": total_sales, "revenue": revenue, "products_count": products_count, "keys_in_stock": keys_in_stock}

# --- USER ORDER HISTORY ---
@app.get("/api/my-orders")
def get_my_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.customer_id == current_user.id).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        product = db.query(Product).filter(Product.id == o.product_id).first()
        key = db.query(ProductKey).filter(ProductKey.id == o.key_id).first()
        result.append({
            "id": o.id,
            "product_name": product.name if product else "Deleted",
            "key_value": key.key_value if key else "N/A",
            "amount": product.price if product else 0,
            "status": o.payment_status,
            "created_at": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "N/A",
        })
    return result

# --- HISTORY API ---
@app.get("/api/admin/orders")
def get_all_orders(admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(200).all()
    result = []
    for o in orders:
        user = db.query(User).filter(User.id == o.customer_id).first()
        product = db.query(Product).filter(Product.id == o.product_id).first()
        key = db.query(ProductKey).filter(ProductKey.id == o.key_id).first()
        result.append({
            "id": o.id,
            "username": user.username if user else "Unknown",
            "product_name": product.name if product else "Deleted",
            "key_value": key.key_value if key else "N/A",
            "amount": product.price if product else 0,
            "status": o.payment_status,
            "created_at": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "N/A",
        })
    return result

@app.get("/api/admin/topup-history")
def get_topup_history(admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    logs = db.query(TopupLog).order_by(TopupLog.created_at.desc()).limit(200).all()
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "username": user.username if user else "Unknown",
            "amount": log.amount,
            "voucher_hash": log.voucher_hash[:20] + "..." if log.voucher_hash and len(log.voucher_hash) > 20 else log.voucher_hash,
            "status": log.status,
            "created_at": log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else "N/A",
        })
    return result

@app.get("/api/admin/seed")
def seed_data(admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    if db.query(Product).count() == 0:
        p1 = Product(name="Level 2550 ACC MAX", category="ไก่ตัน", description="Roblox Level 2550 + CDK", price=50.0)
        p2 = Product(name="Roblox Script Executor", category="โปรแกรมช่วยเล่น", description="Premium Executor Access", price=150.0)
        db.add_all([p1, p2])
        db.commit()
        db.add_all([
            ProductKey(product_id=p1.id, key_value="ACC-A1B2"),
            ProductKey(product_id=p1.id, key_value="ACC-X9Y8"),
            ProductKey(product_id=p2.id, key_value="PREM-V5P2"),
        ])
        db.commit()
    return {"status": "seeded"}
