import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    
    // Grab the logged-in user's ID
    const userId = localStorage.getItem('userId'); 

    // 1. Fetch cart from database
    const fetchCart = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setCart(data);
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        }
    };

    // Run fetchCart automatically when the app loads or user changes
    useEffect(() => {
        fetchCart();
    }, [userId]);

    // 2. Add to cart
    const addToCart = async (item) => {
        if (!userId) return alert("Please log in to add items.");
        
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menu_item_id: item.menu_item_id, 
                    quantity: item.quantity || 1
                })
            });
            if (response.ok) {
                fetchCart(); // Refresh cart from DB
            }
        } catch (error) {
            console.error("Failed to add to cart:", error);
        }
    };

    // 3. Remove single item from cart
    const removeFromCart = async (cartItemId) => {
        if (!userId) return;
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${userId}/item/${cartItemId}`, { 
                method: 'DELETE' 
            });
            if (response.ok) {
                fetchCart();
            }
        } catch (error) {
            console.error("Failed to remove item:", error);
        }
    };

    // 4. Update specific item quantity
    const updateQuantity = async (cartItemId, newQuantity) => {
        if (!userId) return;
        if (newQuantity < 1) return; // Prevent going below 1 (use remove button instead)

        try {
            const response = await fetch(`http://localhost:3000/api/cart/${userId}/item/${cartItemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity })
            });
            
            if (response.ok) {
                fetchCart(); 
            }
        } catch (error) {
            console.error("Failed to update quantity:", error);
        }
    };

    // 5. Clear entire cart
    const clearCart = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${userId}`, { 
                method: 'DELETE' 
            });
            if (response.ok) {
                setCart([]); 
            }
        } catch (error) {
            console.error("Failed to clear cart:", error);
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);