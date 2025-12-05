from flask import request
from flask_restful import Api, Resource
import os
from uuid import uuid4
from werkzeug.utils import secure_filename
from flask import url_for

from configuration import app, db, socketio
from models import Menu, Order, OrderItem

api = Api(app)

UPLOAD_SUBDIR = "images"
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", UPLOAD_SUBDIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"}
MAX_FILE_BYTES = 5 * 1024 * 1024  

app.config.setdefault("UPLOAD_FOLDER", UPLOAD_DIR)
app.config.setdefault("MAX_CONTENT_LENGTH", MAX_FILE_BYTES)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def bad_request(msg):
    return {"error": msg}, 400

# Admin
class AdminMenu(Resource):
    def get(self):
        menus = Menu.query.all()
        return {"menus": [m.to_dict() for m in menus]}, 200

    def post(self):
        image_url = None
        if request.content_type and request.content_type.startswith("multipart/form-data"):
            name = request.form.get("name")
            price = request.form.get("price")
            file = request.files.get("image") or request.files.get("image_url")
            if file and getattr(file, "filename", None):
                if not allowed_file(file.filename):
                    return {"error": "invalid image type"}, 400
                filename = f"{uuid4().hex}_{secure_filename(file.filename)}"
                dest = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                file.save(dest)
                image_url = url_for("static", filename=f"{UPLOAD_SUBDIR}/{filename}", _external=True)
        else:
            data = request.get_json() or {}
            name = data.get("name")
            price = data.get("price")
            image_url = data.get("image_url")

        if not name or price is None:
            return bad_request("Missing required fields: name and price")

        try:
            price = float(price)
        except (ValueError, TypeError):
            return bad_request("Price must be a number")

        menu = Menu(name=name, price=price, image_url=image_url)
        try:
            db.session.add(menu)
            db.session.commit()
            socketio.emit("menu_created", menu.to_dict())
            return {"message": "Admin added new menu item", "menu": menu.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": "Database error", "details": str(e)}, 500

class AdminMenuItem(Resource):
    def put(self, id):
        menu = Menu.query.get(id)
        if not menu:
            return {"error": "Menu item not found"}, 404

        image_url = None
        if request.content_type and request.content_type.startswith("multipart/form-data"):
            name = request.form.get("name")
            price = request.form.get("price")
            file = request.files.get("image") or request.files.get("image_url")
            if file and getattr(file, "filename", None):
                if not allowed_file(file.filename):
                    return {"error": "invalid image type"}, 400
                filename = f"{uuid4().hex}_{secure_filename(file.filename)}"
                dest = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                file.save(dest)
                image_url = url_for("static", filename=f"{UPLOAD_SUBDIR}/{filename}", _external=True)
        else:
            data = request.get_json() or {}
            name = data.get("name")
            price = data.get("price")
            image_url = data.get("image_url")

        if name is not None:
            menu.name = name
        if price is not None:
            try:
                menu.price = float(price)
            except (ValueError, TypeError):
                return bad_request("Price must be a number")
        if image_url is not None:
            menu.image_url = image_url

        try:
            db.session.commit()
            socketio.emit("menu_updated", menu.to_dict())
            return {"message": f"Admin - Menu item {id} updated", "menu": menu.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": "Database error", "details": str(e)}, 500

    def delete(self, id):
        menu = Menu.query.get(id)
        if not menu:
            return {"error": "Menu item not found"}, 404

        if menu.order_items:
            return {"error": "Cannot delete menu item referenced by existing orders"}, 400

        try:
            db.session.delete(menu)
            db.session.commit()
            socketio.emit("menu_deleted", {"id": id})
            return {"message": f"Admin - Menu item {id} deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": "Database error", "details": str(e)}, 500

# Waiter
class WaiterMenu(Resource):
    def get(self):
        menus = Menu.query.all()
        return {"menus": [m.to_dict() for m in menus]}, 200

class WaiterOrder(Resource):
    def post(self):
        data = request.get_json() or {}
        items = data.get("items")
        seat_number = data.get("seat_number")  # Get seat number
        
        if not items or not isinstance(items, list):
            return bad_request("items is required and must be a list of {menu_id, quantity}")

        order = Order(status="Pending", seat_number=seat_number)
        try:
            db.session.add(order)
            for it in items:
                menu_id = it.get("menu_id")
                qty = it.get("quantity", 1)
                if not menu_id:
                    db.session.rollback()
                    return bad_request("Each item requires menu_id")
                menu = Menu.query.get(menu_id)
                if not menu:
                    db.session.rollback()
                    return {"error": f"Menu id {menu_id} not found"}, 404
                try:
                    qty = int(qty)
                except (ValueError, TypeError):
                    db.session.rollback()
                    return bad_request("quantity must be an integer")
                if qty <= 0:
                    db.session.rollback()
                    return bad_request("quantity must be > 0")
                order_item = OrderItem(order=order, menu=menu, quantity=qty)
                db.session.add(order_item)

            order.calculate_total()  # Calculate total
            db.session.commit()
            socketio.emit("order_created", order.to_dict())
            return {"message": "Order created", "order": order.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": "Database error", "details": str(e)}, 500

# Cook
class CookOrders(Resource):
    def get(self):
        orders = Order.query.filter(Order.status != "Paid").all()  # Don't show paid orders
        return {"orders": [o.to_dict() for o in orders]}, 200

class CookOrderItems(Resource):
    def patch(self, id):
        order = Order.query.get(id)
        if not order:
            return {"error": "Order not found"}, 404

        data = request.get_json() or {}
        status = data.get("status")
        if not status:
            return bad_request("status is required")

        allowed = {"Pending", "Preparing", "Ready", "Cancelled"}
        if status not in allowed:
            return bad_request(f"status must be one of {', '.join(allowed)}")

        order.status = status
        try:
            db.session.commit()
            socketio.emit("order_updated", order.to_dict())
            return {"message": f"order {id} status updated", "order": order.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": "Database error", "details": str(e)}, 500

# Cashier
class Cashier(Resource):
    def get(self):
        """Get all orders that are ready or already paid"""
        # Filter by status or seat_number if provided
        seat_number = request.args.get("seat_number")
        status = request.args.get("status")
        
        query = Order.query
        
        if seat_number:
            query = query.filter_by(seat_number=seat_number)
        if status:
            query = query.filter_by(status=status)
        else:
            # By default, show orders that are Ready or already Paid
            query = query.filter(Order.status.in_(["Ready", "Paid"]))
        
        orders = query.order_by(Order.created_at.desc()).all()
        return {"orders": [o.to_dict() for o in orders]}, 200

class CashierOrderItems(Resource):
    def patch(self, id):
        """Process payment for an order"""
        order = Order.query.get(id)
        if not order:
            return {"error": "Order not found"}, 404

        data = request.get_json() or {}
        action = data.get("action")
        
        if action == "pay":
            if order.is_paid:
                return {"error": "Order already paid"}, 400
            
            if order.status != "Ready":
                return {"error": "Order must be Ready before payment"}, 400
            
            # Process payment
            order.is_paid = True
            order.status = "Paid"
            
            try:
                db.session.commit()
                socketio.emit("order_paid", order.to_dict())
                return {
                    "message": f"Order {id} paid successfully",
                    "order": order.to_dict(),
                    "total_paid": order.total_amount
                }, 200
            except Exception as e:
                db.session.rollback()
                return {"error": "Database error", "details": str(e)}, 500
        
        else:
            return bad_request("action must be 'pay'")
    
    def get(self, id):
        """Get specific order details for cashier"""
        order = Order.query.get(id)
        if not order:
            return {"error": "Order not found"}, 404
        
        return {"order": order.to_dict()}, 200

# Customer
class Customer(Resource):
    def get(self):
        menus = Menu.query.all()
        return {"menus": [m.to_dict() for m in menus]}, 200

# Routes
api.add_resource(AdminMenu, "/admin/menu")
api.add_resource(AdminMenuItem, "/admin/menu/<int:id>")
api.add_resource(WaiterMenu, "/waiter/menu")
api.add_resource(WaiterOrder, "/waiter/orders")
api.add_resource(CookOrders, "/cook/orders")
api.add_resource(CookOrderItems, "/cook/orders/<int:id>")
api.add_resource(Cashier, "/cashier/orders")
api.add_resource(CashierOrderItems, "/cashier/orders/<int:id>")
api.add_resource(Customer, "/customer/menu")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)