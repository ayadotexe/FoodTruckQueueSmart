import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    // Load initial cart from localStorage so it survives page refreshes
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('userCart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Auto-save to localStorage whenever the cart changes
    useEffect(() => {
        localStorage.setItem('userCart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item) => {
        setCart(prevCart => [...prevCart, item]);
    };

    const removeFromCart = (indexToRemove) => {
        setCart(prevCart => prevCart.filter((_, index) => index !== indexToRemove));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('userCart');
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);