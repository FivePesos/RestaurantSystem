from datetime import datetime
from configuration import db

class Menu(db.Model):
    __tablename__ = 'menu'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

    order_items = db.relationship('OrderItem', backref='menu', lazy=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "price": self.price, "image_url": self.image_url}


class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    seat_number = db.Column(db.String(20), nullable=True)  # Added seat number
    status = db.Column(db.String(50), default="Pending")
    is_paid = db.Column(db.Boolean, default=False)  # Added payment tracking
    total_amount = db.Column(db.Float, default=0.0)  # Added total amount
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # Added timestamp

    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

    def calculate_total(self):
        """Calculate total amount from order items"""
        total = sum(item.quantity * item.menu.price for item in self.order_items if item.menu)
        self.total_amount = total
        return total

    def to_dict(self):
        return {
            "id": self.id,
            "seat_number": self.seat_number,
            "status": self.status,
            "is_paid": self.is_paid,
            "total_amount": self.total_amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.order_items]
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    menu_id = db.Column(db.Integer, db.ForeignKey('menu.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "menu_id": self.menu_id,
            "menu_name": self.menu.name if self.menu else None,
            "menu_price": self.menu.price if self.menu else None,
            "menu_image_url": self.menu.image_url if self.menu else None,
            "quantity": self.quantity,
            "subtotal": (self.menu.price * self.quantity) if self.menu else 0
        }