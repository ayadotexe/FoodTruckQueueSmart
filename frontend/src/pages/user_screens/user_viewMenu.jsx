import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext"; 
import profileIcon from "../../assets/icon.png";
import cartIcon from "../../assets/cart.png";
import "./user_viewMenu.css";

function UserViewMenu() {
    const navigate = useNavigate();
    const { cart, addToCart } = useCart(); 

    const [menu, setMenu] = useState([]);
    const [quantities, setQuantities] = useState({});
    
    const [modalItem, setModalItem] = useState(null);
    const [descModalItem, setDescModalItem] = useState(null);
    const [customizations, setCustomizations] = useState({});
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3000/api/menu')
            .then(res => res.json())
            .then(data => setMenu(data))
            .catch(err => console.error("Failed to fetch menu:", err));
    }, []);

    const updateQuantity = (id, delta) => {
        setQuantities(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    };

    const handleToggleAddon = (itemId, addon) => {
        setCustomizations(prev => {
            const currentAddons = prev[itemId] || [];
            if (currentAddons.includes(addon)) {
                return { ...prev, [itemId]: currentAddons.filter(a => a !== addon) };
            } else {
                return { ...prev, [itemId]: [...currentAddons, addon] };
            }
        });
    };

    const handleAddToOrder = (item) => {
        const qty = quantities[item.id] || 0;
        if (qty === 0) {
            alert("Please select a quantity first.");
            return;
        }
        
        const orderItem = {
            ...item,
            cartItemId: Date.now() + Math.random(), 
            quantity: qty,
            selectedAddons: customizations[item.id] || []
        };
        
        addToCart(orderItem); 
        
        setQuantities(prev => ({ ...prev, [item.id]: 0 }));
        setCustomizations(prev => ({ ...prev, [item.id]: [] }));
        alert(`${qty}x ${item.name} added to cart!`);
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const foods = menu.filter(item => item.category === "food");
    const drinks = menu.filter(item => item.category === "drink");

    const renderItems = (items) => (
        <div className="menu-list">
            {items.map(item => (
                <div key={item.id} className="menu-item">
                    <div className="item-image-container">
                        {item.image ? (
                            <img src={item.image} alt={item.name} className="item-image" />
                        ) : (
                            <div className="item-image-placeholder"></div>
                        )}
                    </div>

                    <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        {item.price && <span className="item-price">${Number(item.price).toFixed(2)}</span>}
                        {customizations[item.id] && customizations[item.id].length > 0 && (
                            <div className="selected-addons">
                                {customizations[item.id].join(", ")}
                            </div>
                        )}
                    </div>

                    <div className="menu-actions">
                        {item.description && (
                            <span className="action-link desc-link" onClick={() => setDescModalItem(item)}>
                                description
                            </span>
                        )}

                        {item.addons && item.addons.length > 0 && (
                            <span className="action-link" onClick={() => setModalItem(item)}>
                                customize order
                            </span>
                        )}
                        
                        <div className="quantity-controls">
                            <button className="small-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                            <span className="qty-number">{quantities[item.id] || 0}</span>
                            <button className="small-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                        </div>
                        
                        <span 
                            className="action-link add-to-order-btn" 
                            onClick={() => handleAddToOrder(item)}
                        >
                            add to order
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="dashboard view-menu-page">
            <header className="menu-header">
                <div className="header-left-icons">
                    <div className="icon-container profile-menu">
                        <img 
                            src={profileIcon} 
                            alt="Profile" 
                            className="clickable-icon" 
                            onClick={() => setShowDropdown(!showDropdown)}
                        />
                        {showDropdown && (
                            <div className="profile-dropdown">
                                <div className="dropdown-role">User</div>
                                <hr />
                                <div className="dropdown-action" onClick={handleLogout}>Log out</div>
                            </div>
                        )}
                    </div>

                    <div className="icon-container" onClick={() => navigate('/cart')}>
                        <img src={cartIcon} alt="Cart" className="clickable-icon" />
                        {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                    </div>
                </div>

                <button className="back-button wide-back-button" onClick={() => navigate(-1)}>&#x2190; back</button>
            </header>

            <h1>MENU</h1>

            <h2 className="category-title">Food</h2>
            {renderItems(foods)}

            <h2 className="category-title">Drinks</h2>
            {renderItems(drinks)}

            {modalItem && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Customize {modalItem.name}</h3>
                        <div className="addon-list">
                            {modalItem.addons.map((addon, idx) => (
                                <label key={idx} className="addon-checkbox">
                                    <input 
                                        type="checkbox" 
                                        checked={(customizations[modalItem.id] || []).includes(addon)}
                                        onChange={() => handleToggleAddon(modalItem.id, addon)}
                                    />
                                    {addon}
                                </label>
                            ))}
                        </div>
                        <button className="done-btn" onClick={() => setModalItem(null)}>Done</button>
                    </div>
                </div>
            )}

            {descModalItem && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{descModalItem.name}</h3>
                        {descModalItem.image && (
                            <img 
                                src={descModalItem.image} 
                                alt={descModalItem.name} 
                                className="modal-large-image" 
                            />
                        )}
                        <p className="modal-description">{descModalItem.description}</p>
                        <button className="done-btn" onClick={() => setDescModalItem(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserViewMenu;