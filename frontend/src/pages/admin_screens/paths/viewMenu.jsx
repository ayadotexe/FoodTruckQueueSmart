import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./viewMenu.css";

function ViewMenu() {
    const navigate = useNavigate();

    const [menu, setMenu] = useState([]);
    
    // popup check
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    
    const [newItem, setNewItem] = useState({
        name: "", description: "", price: "", image: "", category: "food", expectedDuration: ""
    });

    useEffect(() => {
        fetch('http://localhost:3000/api/menu')
            .then(res => res.json())
            .then(data => setMenu(data))
            .catch(err => console.error("Failed to fetch menu:", err));
    }, []);

    // --- DELETE ---
    const confirmRemove = () => {
        if (!itemToDelete) return;
        fetch(`http://localhost:3000/api/menu/${itemToDelete.id}`, { method: 'DELETE' })
            .then(() => {
                setMenu(menu.filter(item => item.id !== itemToDelete.id));
                setItemToDelete(null);
            })
            .catch(err => console.error("Failed to delete item:", err));
    };

    // --- ADD ---
    const handleAddItem = (e) => {
        e.preventDefault();
        const waitTime = newItem.category === "drink" ? 3 : (parseInt(newItem.expectedDuration) || 5);

        const itemToSubmit = {
            ...newItem,
            price: parseFloat(newItem.price) || 0,
            expectedDuration: waitTime,
            priorityLevel: "Normal",
            addons: []
        };

        fetch('http://localhost:3000/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemToSubmit)
        })
            .then(res => res.json())
            .then(addedItem => {
                setMenu([...menu, addedItem]); 
                setIsAddModalOpen(false);
                setNewItem({ name: "", description: "", price: "", image: "", category: "food", expectedDuration: "" });
            })
            .catch(err => console.error("Failed to add item:", err));
    };

    // --- Edit Logic ---
    const handleEditSubmit = (e) => {
        e.preventDefault();
        
        setEditingItem(null); 

        const waitTime = editingItem.category === "drink" ? 3 : (parseInt(editingItem.expectedDuration) || 5);

        const itemToSubmit = {
            ...editingItem,
            price: parseFloat(editingItem.price) || 0,
            expectedDuration: waitTime
        };

        fetch(`http://localhost:3000/api/menu/${editingItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemToSubmit)
        })
            .then(res => res.json())
            .then(updatedItem => {
                setMenu(menu.map(item => item.id === editingItem.id ? updatedItem : item));
            })
            .catch(err => console.error("Failed to update item:", err));
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
                    </div>

                    <div className="menu-actions">
                        <span 
                            className="action-link"
                            onClick={() => setEditingItem(item)}>
                            edit item
                        </span>
                        <span 
                            className="action-link remove" 
                            onClick={() => setItemToDelete(item)}>
                            remove
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="dashboard view-menu-page">
            <header className="menu-header">
                <button className="add-header-btn" onClick={() => setIsAddModalOpen(true)}>+</button>
                <button className="back-button" onClick={() => navigate(-1)}>&#x2190; back</button>
            </header>

            <h1>MENU</h1>

            <h2 className="category-title">Food</h2>
            {renderItems(foods)}

            <h2 className="category-title">Drinks</h2>
            {renderItems(drinks)}

            {/* --- ADD ITEM  --- */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add New Menu Item</h3>
                        <form className="add-item-form" onSubmit={handleAddItem}>
                            <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                <option value="food">Food</option>
                                <option value="drink">Drink</option>
                            </select>
                            <input type="text" placeholder="Item Name" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                            <textarea placeholder="Description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                            <input type="number" step="0.01" placeholder="Price (e.g. 5.99)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                            <input type="text" placeholder="Image URL" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                            
                            {newItem.category === "food" && (
                                <input type="number" placeholder="Wait Time (minutes)" value={newItem.expectedDuration} onChange={e => setNewItem({...newItem, expectedDuration: e.target.value})} />
                            )}
                            
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="done-btn">Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT ITEM --- */}
            {editingItem && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Menu Item</h3>
                        <form className="add-item-form" onSubmit={handleEditSubmit}>
                            <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                                <option value="food">Food</option>
                                <option value="drink">Drink</option>
                            </select>
                            <input type="text" placeholder="Item Name" required value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                            <textarea placeholder="Description" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                            <input type="number" step="0.01" placeholder="Price (e.g. 5.99)" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} />
                            <input type="text" placeholder="Image URL" value={editingItem.image} onChange={e => setEditingItem({...editingItem, image: e.target.value})} />
                            
                            {editingItem.category === "food" && (
                                <input type="number" placeholder="Wait Time (minutes)" value={editingItem.expectedDuration} onChange={e => setEditingItem({...editingItem, expectedDuration: e.target.value})} />
                            )}
                            
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setEditingItem(null)}>Cancel</button>
                                <button type="submit" className="done-btn">Update Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION --- */}
            {itemToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Are you sure?</h3>
                        <p>Do you really want to remove <strong>{itemToDelete.name}</strong> from the menu?</p>
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button type="button" className="cancel-btn" onClick={() => setItemToDelete(null)}>No, Cancel</button>
                            <button type="button" className="done-btn" style={{ backgroundColor: '#f44336' }} onClick={confirmRemove}>Yes, Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewMenu;