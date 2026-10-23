import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./user_cart.css"; 

function UserCart() {
    const navigate = useNavigate();
    const { cart, removeFromCart, clearCart } = useCart();

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return alert("Cart is empty!");
        
        // This is where you will eventually send a POST request to your backend queue
        alert("Order submitted to the queue!");
        clearCart();
        navigate('/'); // Redirect back to dashboard
    };

    return (
        <div className="dashboard cart-page">
            <header className="menu-header">
                <button className="back-button" onClick={() => navigate(-1)}>&#x2190; back</button>
            </header>

            <h1>YOUR CART</h1>

            {cart.length === 0 ? (
                <div className="empty-cart">
                    <p>Your cart is empty.</p>
                    <button className="outline" onClick={() => navigate('/menu')}>Go to Menu</button>
                </div>
            ) : (
                <div className="cart-list">
                    {cart.map((item, index) => (
                        <div key={item.cartItemId || index} className="cart-item">
                            <div className="cart-item-details">
                                <span className="item-name">{item.quantity}x {item.name}</span>
                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                    <span className="cart-addons">+{item.selectedAddons.join(", ")}</span>
                                )}
                                <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <button className="remove-cart-btn" onClick={() => removeFromCart(index)}>
                                Remove
                            </button>
                        </div>
                    ))}
                    
                    <div className="cart-total-section">
                        <h2>Total: ${calculateTotal().toFixed(2)}</h2>
                        <button className="checkout-btn" onClick={handleCheckout}>
                            Checkout & Join Queue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserCart;