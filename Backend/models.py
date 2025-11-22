from datetime import datetime
from configuration import db

class Menu(db.Model):
    __tablename__ = 'menu'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

    order_items = db.relationship('OrderItem', backref='menu', lazy=True)

    def to_dict(self):  # helper to convert to JSON
        return {"id": self.id, "name": self.name, "price": self.price, "image_url": self.image_url}


class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), default="Pending")

    order_items = db.relationship('OrderItem', backref='order', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
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
            "quantity": self.quantity
        }

class Customer(db.model):
    __tablename__ = "customer_table"