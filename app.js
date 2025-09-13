// app.js
import { getAdminSettings, saveAdminSettings, auth, db, onAuthStateChanged, signOut } from './firebase.js';

// DOM Elements
const customMessageEl = document.getElementById('custom-message');
const menuCategoriesEl = document.getElementById('menu-categories');
const servicesDisplayEl = document.getElementById('services-display');
const openingHoursEl = document.getElementById('opening-hours');
const adminLink = document.getElementById('admin-link');

// Admin panel elements
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');
const adminDashboard = document.getElementById('admin-dashboard');
const logoutBtn = document.getElementById('logout-btn');

// Admin dashboard UI elements
const customMessageEditor = document.getElementById('custom-message-editor');
const saveMessageBtn = document.getElementById('save-message-btn');
const monFriHours = document.getElementById('mon-fri-hours');
const satHours = document.getElementById('sat-hours');
const sunHours = document.getElementById('sun-hours');
const saveHoursBtn = document.getElementById('save-hours-btn');
const serviceDinein = document.getElementById('service-dinein');
const serviceTakeaway = document.getElementById('service-takeaway');
const saveServicesBtn = document.getElementById('save-services-btn');
const menuItemContainer = document.getElementById('menu-items-container');
const addNewItemCategory = document.getElementById('new-item-category');
const addNewItemName = document.getElementById('new-item-name');
const addNewItemPrice = document.getElementById('new-item-price');
const addBtn = document.getElementById('add-item-btn');
const saveAllBtn = document.getElementById('save-all-changes-btn');

// Category tabs
const categoryTabs = document.querySelectorAll('.category-tab');
let currentCategory = 'Hot Drinks';

// Load settings on page load
async function loadSettings() {
    try {
        const settings = await getAdminSettings();
        
        // Update homepage content
        if (settings.customMessage) {
            customMessageEl.innerHTML = settings.customMessage.replace(/\n/g, '<br>');
        }
        
        // Update opening hours
        openingHoursEl.innerHTML = `
            <p><strong>Monday–Friday:</strong> ${settings.openingHours.mondayToFriday}</p>
            <p><strong>Saturday:</strong> ${settings.openingHours.saturday}</p>
            <p><strong>Sunday:</strong> ${settings.openingHours.sunday}</p>
        `;
        
        // Update services
        servicesDisplayEl.textContent = settings.services.join(', ');
        
        // Render menu preview
        renderMenuPreview(settings.menu);
        
        // If on admin page, populate forms
        if (document.body.classList.contains('admin-body')) {
            populateAdminForms(settings);
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
        if (customMessageEl) {
            customMessageEl.textContent = 'Sorry, we\'re experiencing technical difficulties. Please check back soon!';
        }
    }
}

// Render menu preview on homepage
function renderMenuPreview(menu) {
    menuCategoriesEl.innerHTML = '';
    
    Object.keys(menu).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';
        
        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);
        
        menu[category].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;
            
            const priceSpan = document.createElement('span');
            priceSpan.textContent = item.price;
            priceSpan.style.fontWeight = 'bold';
            
            itemDiv.appendChild(nameSpan);
            itemDiv.appendChild(priceSpan);
            categoryDiv.appendChild(itemDiv);
        });
        
        menuCategoriesEl.appendChild(categoryDiv);
    });
}

// Populate admin forms with saved data
function populateAdminForms(settings) {
    // Custom message
    customMessageEditor.value = settings.customMessage || '';
    
    // Opening hours
    monFriHours.value = settings.openingHours.mondayToFriday || '';
    satHours.value = settings.openingHours.saturday || '';
    sunHours.value = settings.openingHours.sunday || '';
    
    // Services
    serviceDinein.checked = settings.services.includes('Dine-in');
    serviceTakeaway.checked = settings.services.includes('Takeaway');
    
    // Menu items - render initial category
    renderMenuItems(settings.menu);
}

// Render menu items for admin editing
function renderMenuItems(menu) {
    // Clear container
    menuItemContainer.innerHTML = '';
    
    // Reset active tab
    categoryTabs.forEach(tab => tab.classList.remove('active'));
    
    // Set first tab as default if no active one
    if (categoryTabs.length > 0 && !currentCategory) {
        currentCategory = categoryTabs[0].dataset.category;
        categoryTabs[0].classList.add('active');
    }
    
    // Add event listeners to tabs if not already present
    categoryTabs.forEach(tab => {
        tab.removeEventListener('click', handleCategoryClick);
        tab.addEventListener('click', handleCategoryClick);
    });
    
    // Activate current category tab
    const activeTab = Array.from(categoryTabs).find(tab => tab.dataset.category === currentCategory);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Render items for current category
    const items = menu[currentCategory] || [];
    renderCategoryItems(items);
}

// Handle category tab click
function handleCategoryClick(e) {
    currentCategory = e.target.dataset.category;
    renderMenuItems(getCurrentMenuState()); // Use current state from UI or Firestore
}

// Get current menu state (from UI if editing, else from settings)
function getCurrentMenuState() {
    // We'll rebuild menu state from UI inputs if in admin mode
    const categories = ['Hot Drinks', 'Cold Drinks', 'Sweet Treats', 'Savoury Treats'];
    const menu = {};
    
    categories.forEach(cat => {
        menu[cat] = [];
        const itemElements = document.querySelectorAll(`.menu-item-edit[data-category="${cat}"]`);
        itemElements.forEach(el => {
            const nameInput = el.querySelector('input[name="name"]');
            const priceInput = el.querySelector('input[name="price"]');
            if (nameInput && priceInput && nameInput.value.trim() && priceInput.value.trim()) {
                menu[cat].push({
                    name: nameInput.value.trim(),
                    price: priceInput.value.trim()
                });
            }
        });
    });
    
    return menu;
}

// Render items for a specific category
function renderCategoryItems(items) {
    menuItemContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        menuItemContainer.innerHTML = '<p class="menu-item-placeholder">No items in this category yet. Add some below!</p>';
        return;
    }
    
    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item-edit';
        itemDiv.setAttribute('data-category', currentCategory);
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.name = 'name';
        nameInput.value = item.name || '';
        nameInput.placeholder = 'Item name';
        nameInput.style.flex = '2';
        nameInput.style.marginRight = '10px';
        
        const priceInput = document.createElement('input');
        priceInput.type = 'text';
        priceInput.name = 'price';
        priceInput.value = item.price || '';
        priceInput.placeholder = 'Price (e.g., £3.50)';
        priceInput.style.flex = '1';
        priceInput.style.marginRight = '10px';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.flex = 'none';
        deleteBtn.addEventListener('click', () => {
            const currentMenu = getCurrentMenuState();
            currentMenu[currentCategory] = currentMenu[currentCategory]?.filter((_, i) => i !== index);
            renderCategoryItems(currentMenu[currentCategory] || []);
        });
        
        itemDiv.appendChild(nameInput);
        itemDiv.appendChild(priceInput);
        itemDiv.appendChild(deleteBtn);
        menuItemContainer.appendChild(itemDiv);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Load settings
    await loadSettings();
    
    // Handle admin link click
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/admin.html';
        });
    }
    
    // Admin login form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.textContent = '';
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                
                // Show admin dashboard
                loginForm.classList.add('hidden');
                adminDashboard.classList.remove('hidden');
                
                // Load settings after successful login
                const settings = await getAdminSettings();
                populateAdminForms(settings);
                
            } catch (error) {
                loginError.textContent = 'Invalid email or password. Please try again.';
                console.error('Login error:', error);
            }
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                adminDashboard.classList.add('hidden');
                loginForm.classList.remove('hidden');
                loginError.textContent = '';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
    
    // Save custom message
    if (saveMessageBtn) {
        saveMessageBtn.addEventListener('click', async () => {
            const message = customMessageEditor.value.trim();
            try {
                await saveAdminSettings({ customMessage: message });
                alert('Custom message saved successfully!');
            } catch (error) {
                console.error('Error saving message:', error);
                alert('Failed to save message. Please try again.');
            }
        });
    }
    
    // Save opening hours
    if (saveHoursBtn) {
        saveHoursBtn.addEventListener('click', async () => {
            const hours = {
                mondayToFriday: monFriHours.value.trim(),
                saturday: satHours.value.trim(),
                sunday: sunHours.value.trim()
            };
            
            try {
                await saveAdminSettings({ openingHours: hours });
                alert('Opening hours saved successfully!');
                // Also update homepage display
                openingHoursEl.innerHTML = `
                    <p><strong>Monday–Friday:</strong> ${hours.mondayToFriday}</p>
                    <p><strong>Saturday:</strong> ${hours.saturday}</p>
                    <p><strong>Sunday:</strong> ${hours.sunday}</p>
                `;
            } catch (error) {
                console.error('Error saving hours:', error);
                alert('Failed to save hours. Please try again.');
            }
        });
    }
    
    // Save services
    if (saveServicesBtn) {
        saveServicesBtn.addEventListener('click', async () => {
            const services = [];
            if (serviceDinein.checked) services.push('Dine-in');
            if (serviceTakeaway.checked) services.push('Takeaway');
            
            try {
                await saveAdminSettings({ services });
                alert('Services updated successfully!');
                servicesDisplayEl.textContent = services.join(', ');
            } catch (error) {
                console.error('Error saving services:', error);
                alert('Failed to update services. Please try again.');
            }
        });
    }
    
    // Add new menu item
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const category = addNewItemCategory.value;
            const name = addNewItemName.value.trim();
            const price = addNewItemPrice.value.trim();
            
            if (!category || !name || !price) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                const settings = await getAdminSettings();
                const updatedMenu = { ...settings.menu };
                
                if (!updatedMenu[category]) {
                    updatedMenu[category] = [];
                }
                
                updatedMenu[category].push({ name, price });
                
                await saveAdminSettings({ menu: updatedMenu });
                
                // Clear form
                addNewItemName.value = '';
                addNewItemPrice.value = '';
                addNewItemCategory.value = '';
                
                alert('Item added successfully!');
                
                // Re-render menu for current category
                renderMenuItems(updatedMenu);
                
            } catch (error) {
                console.error('Error adding item:', error);
                alert('Failed to add item. Please try again.');
            }
        });
    }
    
    // Save all changes
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', async () => {
            // Collect all values
            const message = customMessageEditor.value.trim();
            const hours = {
                mondayToFriday: monFriHours.value.trim(),
                saturday: satHours.value.trim(),
                sunday: sunHours.value.trim()
            };
            const services = [];
            if (serviceDinein.checked) services.push('Dine-in');
            if (serviceTakeaway.checked) services.push('Takeaway');
            
            // Build menu object from UI inputs
            const menu = getCurrentMenuState();
            
            // Validate at least one item per category isn't empty
            const hasValidItems = Object.values(menu).some(catItems => catItems.length > 0);
            if (!hasValidItems) {
                alert('At least one menu item must be defined.');
                return;
            }
            
            try {
                await saveAdminSettings({
                    customMessage: message,
                    openingHours: hours,
                    services: services,
                    menu: menu
                });
                
                // Update live preview on admin page
                renderMenuPreview(menu);
                
                alert('All changes saved successfully!');
            } catch (error) {
                console.error('Error saving all changes:', error);
                alert('Failed to save all changes. Please try again.');
            }
        });
    }
    
    // Initialize category tab behavior
    if (categoryTabs.length > 0) {
        categoryTabs[0].classList.add('active');
        currentCategory = categoryTabs[0].dataset.category;
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', handleCategoryClick);
        });
    }
});

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    // If user is logged in and on admin page, show dashboard
    if (document.body.classList.contains('admin-body')) {
        if (user) {
            loginForm.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
        } else {
            loginForm.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
        }
    }
});
