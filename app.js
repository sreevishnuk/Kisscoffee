// app.js
import { getAdminSettings, saveAdminSettings, auth, db, onAuthStateChanged, signOut } from './firebase.js';

let currentCategory = 'Hot Drinks';
let menuData = {}; // Global store for current menu state

// DOM Elements
const customMessageEl = document.getElementById('custom-message');
const menuCategoriesEl = document.getElementById('menu-categories');
const servicesDisplayEl = document.getElementById('services-display');
const openingHoursEl = document.getElementById('opening-hours');
const adminLink = document.getElementById('admin-link');

const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');
const adminDashboard = document.getElementById('admin-dashboard');
const logoutBtn = document.getElementById('logout-btn');

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
const categoryTabs = document.querySelectorAll('.category-tab');

// Load settings with error handling
async function loadSettings() {
    console.log('🔄 Loading admin settings...');
    try {
        const settings = await getAdminSettings();
        menuData = settings.menu;

        // Homepage
        if (customMessageEl) {
            customMessageEl.innerHTML = settings.customMessage?.replace(/\n/g, '<br>') || 'Welcome to Kiss Coffee!';
        }
        if (openingHoursEl) {
            openingHoursEl.innerHTML = `
                <p><strong>Monday–Friday:</strong> ${settings.openingHours.mondayToFriday}</p>
                <p><strong>Saturday:</strong> ${settings.openingHours.saturday}</p>
                <p><strong>Sunday:</strong> ${settings.openingHours.sunday}</p>
            `;
        }
        if (servicesDisplayEl) {
            servicesDisplayEl.textContent = settings.services.join(', ');
        }
        if (menuCategoriesEl) {
            renderMenuPreview(settings.menu);
        }

        // Admin panel
        if (document.body.classList.contains('admin-body')) {
            populateAdminForms(settings);
        }

    } catch (error) {
        console.error('❌ Failed to load settings:', error);
        alert('Failed to load website data. Check console.');
        if (customMessageEl) {
            customMessageEl.textContent = 'Sorry, we can’t load the menu right now.';
        }
    }
}

function renderMenuPreview(menu) {
    menuCategoriesEl.innerHTML = '';
    Object.keys(menu).forEach(category => {
        const div = document.createElement('div');
        div.className = 'menu-category';
        const h4 = document.createElement('h4');
        h4.textContent = category;
        div.appendChild(h4);

        menu[category].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.innerHTML = `<span>${item.name}</span><span>${item.price}</span>`;
            div.appendChild(itemDiv);
        });

        menuCategoriesEl.appendChild(div);
    });
}

function populateAdminForms(settings) {
    customMessageEditor.value = settings.customMessage || '';
    monFriHours.value = settings.openingHours.mondayToFriday || '';
    satHours.value = settings.openingHours.saturday || '';
    sunHours.value = settings.openingHours.sunday || '';
    serviceDinein.checked = settings.services.includes('Dine-in');
    serviceTakeaway.checked = settings.services.includes('Takeaway');

    // Render initial category
    renderMenuItems(settings.menu);
}

function renderMenuItems(menu) {
    menuItemContainer.innerHTML = '';
    currentCategory = 'Hot Drinks'; // fallback

    // Activate first tab
    categoryTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === 'Hot Drinks') {
            tab.classList.add('active');
            currentCategory = 'Hot Drinks';
        }
        tab.removeEventListener('click', handleCategoryClick);
        tab.addEventListener('click', handleCategoryClick);
    });

    renderCategoryItems(menu[currentCategory] || []);
}

function handleCategoryClick(e) {
    currentCategory = e.target.dataset.category;
    categoryTabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    renderCategoryItems(menuData[currentCategory] || []);
}

function renderCategoryItems(items) {
    menuItemContainer.innerHTML = '';
    if (!items || items.length === 0) {
        menuItemContainer.innerHTML = '<p class="menu-item-placeholder">No items in this category yet. Add some below!</p>';
        return;
    }

    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item-edit';
        itemDiv.setAttribute('data-index', index);
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
        deleteBtn.style.backgroundColor = '#d32f2f';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.padding = '6px 10px';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.cursor = 'pointer';

        deleteBtn.addEventListener('click', () => {
            menuData[currentCategory] = (menuData[currentCategory] || []).filter((_, i) => i !== index);
            renderCategoryItems(menuData[currentCategory] || []);
        });

        itemDiv.appendChild(nameInput);
        itemDiv.appendChild(priceInput);
        itemDiv.appendChild(deleteBtn);
        menuItemContainer.appendChild(itemDiv);
    });
}

function getCurrentMenuState() {
    const result = {};
    const categories = ['Hot Drinks', 'Cold Drinks', 'Sweet Treats', 'Savoury Treats'];
    categories.forEach(cat => {
        result[cat] = [];
        const items = document.querySelectorAll(`.menu-item-edit[data-category="${cat}"]`);
        items.forEach(el => {
            const nameInput = el.querySelector('input[name="name"]');
            const priceInput = el.querySelector('input[name="price"]');
            if (nameInput && priceInput && nameInput.value.trim() && priceInput.value.trim()) {
                result[cat].push({
                    name: nameInput.value.trim(),
                    price: priceInput.value.trim()
                });
            }
        });
    });
    return result;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();

    // Admin link
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/admin.html';
        });
    }

    // Admin login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.textContent = '';
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.classList.add('hidden');
                adminDashboard.classList.remove('hidden');
                console.log('✅ Logged in as admin');
                loadSettings(); // Reload after login
            } catch (err) {
                loginError.textContent = 'Invalid email or password.';
                console.error('Login failed:', err);
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            adminDashboard.classList.add('hidden');
            loginForm.classList.remove('hidden');
            console.log('✅ Logged out');
        });
    }

    // Save custom message
    if (saveMessageBtn) {
        saveMessageBtn.addEventListener('click', async () => {
            const msg = customMessageEditor.value.trim();
            if (!msg) return alert('Please enter a message');
            try {
                await saveAdminSettings({ customMessage: msg });
                alert('✅ Message saved!');
            } catch (err) {
                alert('❌ Failed to save message.');
            }
        });
    }

    // Save hours
    if (saveHoursBtn) {
        saveHoursBtn.addEventListener('click', async () => {
            const hours = {
                mondayToFriday: monFriHours.value.trim(),
                saturday: satHours.value.trim(),
                sunday: sunHours.value.trim()
            };
            try {
                await saveAdminSettings({ openingHours: hours });
                alert('✅ Hours saved!');
            } catch (err) {
                alert('❌ Failed to save hours.');
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
                alert('✅ Services updated!');
            } catch (err) {
                alert('❌ Failed to update services.');
            }
        });
    }

    // Add item
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const cat = addNewItemCategory.value;
            const name = addNewItemName.value.trim();
            const price = addNewItemPrice.value.trim();

            if (!cat || !name || !price) {
                return alert('Please fill all fields');
            }

            if (!menuData[cat]) menuData[cat] = [];
            menuData[cat].push({ name, price });

            try {
                await saveAdminSettings({ menu: menuData });
                alert('✅ Item added!');
                addNewItemName.value = '';
                addNewItemPrice.value = '';
                addNewItemCategory.value = '';
                renderMenuItems(menuData);
            } catch (err) {
                alert('❌ Failed to add item.');
            }
        });
    }

    // Save all changes
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', async () => {
            const newMenu = getCurrentMenuState();
            const message = customMessageEditor.value.trim();
            const hours = {
                mondayToFriday: monFriHours.value.trim(),
                saturday: satHours.value.trim(),
                sunday: sunHours.value.trim()
            };
            const services = [];
            if (serviceDinein.checked) services.push('Dine-in');
            if (serviceTakeaway.checked) services.push('Takeaway');

            try {
                await saveAdminSettings({
                    customMessage: message,
                    openingHours: hours,
                    services,
                    menu: newMenu
                });
                alert('✅ ALL CHANGES SAVED!');
                menuData = newMenu; // Update global state
                renderMenuPreview(newMenu); // Update homepage preview if visible
            } catch (err) {
                alert('❌ FAILED TO SAVE ALL CHANGES. CHECK CONSOLE.');
                console.error(err);
            }
        });
    }

    // Initialize category tabs
    if (categoryTabs.length > 0) {
        categoryTabs[0].classList.add('active');
        currentCategory = categoryTabs[0].dataset.category;
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', handleCategoryClick);
        });
    }
});

// Listen to auth state
onAuthStateChanged(auth, (user) => {
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
