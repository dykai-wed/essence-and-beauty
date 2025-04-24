import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const functionsInstance = getFunctions();

const sendOrderEmail = httpsCallable(functionsInstance, 'sendOrderEmail');

// Cart functionality
let cart = [];
let currentUser = null;

// Update cart badge
function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cartItems) {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="cart-item-details">
                    <h6>${item.name}</h6>
                    <p class="cart-item-price">$${item.price} x ${item.quantity}</p>
                </div>
                <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.closest('.remove-item').dataset.id;
                removeFromCart(id);
            });
        });
    }

    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2);
    }
    
    updateCartBadge();
}

// Add to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartDisplay();
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

// Initialize all event listeners and functionality
function initializeApp() {
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert('Please login to checkout');
                return;
            }

            try {
                // Get user address
                const address = await getUserAddress(currentUser.uid);
                if (!address) {
                    alert('Please add your delivery address before ordering.');
                    return;
                }

                const order = {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    items: cart,
                    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    status: 'pending',
                    createdAt: new Date()
                };

                const orderRef = await addDoc(collection(db, 'orders'), order);
                order.orderId = orderRef.id;

                alert('Order placed successfully!');
                cart = [];
                updateCartDisplay();

                // Send to WhatsApp
                sendOrderToWhatsApp(order, address);
            } catch (error) {
                console.error('Error placing order:', error);
                alert('Error placing order. Please try again.');
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('Login successful:', userCredential.user.email);
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                if (loginModal) {
                    loginModal.hide();
                }
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Login failed: ';
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage += 'Invalid email address.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage += 'This account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage += 'No account found with this email.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage += 'Incorrect password.';
                        break;
                    default:
                        errorMessage += error.message;
                }
                alert(errorMessage);
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('Registration successful:', userCredential.user.email);
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                if (registerModal) {
                    registerModal.hide();
                }
            } catch (error) {
                console.error('Registration error:', error);
                let errorMessage = 'Registration failed: ';
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage += 'An account with this email already exists.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage += 'Invalid email address.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage += 'Email/password accounts are not enabled. Please contact support.';
                        break;
                    case 'auth/weak-password':
                        errorMessage += 'Password should be at least 6 characters.';
                        break;
                    default:
                        errorMessage += error.message;
                }
                alert(errorMessage);
            }
        });
    }

    // Modal switching
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
            if (loginModal) {
                loginModal.hide();
            }
            registerModal.show();
        });
    }

    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            if (registerModal) {
                registerModal.hide();
            }
            loginModal.show();
        });
    }

    // Contact form
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            try {
                await addDoc(collection(db, "messages"), {
                    email: email,
                    message: message,
                    timestamp: new Date()
                });
                alert('Message sent successfully!');
                contactForm.reset();
            } catch (error) {
                console.error("Error sending message:", error);
                alert('Error sending message. Please try again.');
            }
        });
    }
}

// Helper: Get user address from Firestore
async function getUserAddress(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data().address || '';
        }
        return '';
    } catch {
        return '';
    }
}

// Helper: Check if user has address
async function userHasAddress(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc.exists() && userDoc.data().address;
    } catch {
        return false;
    }
}

// Helper: Save address
async function saveUserAddress(uid, address) {
    await setDoc(doc(db, 'users', uid), { address }, { merge: true });
}

// Address modal logic
function showAddressModal(onSubmit) {
    const modalEl = document.getElementById('addressModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    const form = document.getElementById('addressForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const address = document.getElementById('deliveryAddress').value.trim();
        if (address) {
            await onSubmit(address);
            modal.hide();
        }
    };
}

// Function to create product cards
function createProductCard(product) {
    return `
        <div class="col-md-4 col-lg-3">
            <div class="card product-card h-100" data-id="${product.id}" style="cursor:pointer;">
                <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description}</p>
                    <p class="card-text"><strong>$${product.price}</strong></p>
                    <button class="btn btn-primary w-100 add-to-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

// Function to show product modal
function showProductModal(product) {
    let modal = document.getElementById('productModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'productModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="productModalLabel"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div class="row g-0">
                            <div class="col-md-6 d-flex align-items-center justify-content-center bg-light">
                                <img id="productModalImage" class="img-fluid w-100" style="object-fit:contain;max-height:400px;" />
                            </div>
                            <div class="col-md-6 p-4 d-flex align-items-center">
                                <div>
                                    <h4 id="productModalLabelInner"></h4>
                                    <p id="productModalDescription" class="mb-0"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    document.getElementById('productModalLabel').textContent = product.name;
    document.getElementById('productModalLabelInner').textContent = product.name;
    document.getElementById('productModalImage').src = product.imageUrl;
    document.getElementById('productModalImage').alt = product.name;
    document.getElementById('productModalDescription').textContent = product.description;
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// --- Category list for display ---
const PRODUCT_CATEGORIES = [
    "Perfumes",
    "Body Sprays&Deodorants",
    "Humidifiers",
    "Air-Fresheners",
    "Diffusers",
    "Roll-on",
    "Gift-Sets"
];

// --- Update loadProducts to group and display by category ---
async function loadProducts() {
    try {
        const categoriesContainer = document.getElementById('product-categories');
        const allProductsRow = document.getElementById('all-products-row');
        if (!categoriesContainer || !allProductsRow) return;

        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // Group products by category
        const grouped = {};
        PRODUCT_CATEGORIES.forEach(cat => grouped[cat] = []);
        products.forEach(prod => {
            if (grouped[prod.category]) grouped[prod.category].push(prod);
        });

        // Render categories and products
        categoriesContainer.innerHTML = '';
        PRODUCT_CATEGORIES.forEach(cat => {
            if (grouped[cat].length > 0) {
                const section = document.createElement('section');
                section.className = 'mb-5';
                section.innerHTML = `
                    <h3 class="mb-4">${cat.replace(/&/g, ' & ')}</h3>
                    <div class="row g-4">
                        ${grouped[cat].map(product => createProductCard(product)).join('')}
                    </div>
                `;
                categoriesContainer.appendChild(section);
            }
        });
        // Hide the old all-products row
        allProductsRow.classList.add('d-none');

        // Add event listeners for modal and add-to-cart
        PRODUCT_CATEGORIES.forEach(cat => {
            grouped[cat].forEach(product => {
                // Add to Cart button
                const btn = document.querySelector(`.add-to-cart[data-id="${product.id}"]`);
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        addToCart(product);
                    });
                }
                // Product card modal
                const card = document.querySelector(`.product-card[data-id="${product.id}"]`);
                if (card) {
                    card.addEventListener('click', (e) => {
                        if (e.target.classList.contains('add-to-cart')) return;
                        showProductModal(product);
                    });
                }
            });
        });
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// Helper: Format WhatsApp message
function formatWhatsAppOrderMessage(order, address) {
    let msg = `*New Order Placed!*%0A`;
    msg += `*User:* ${order.userEmail || order.userId}%0A`;
    msg += `*Address:* ${address}%0A`;
    msg += `*Items:*%0A`;
    order.items.forEach(item => {
        msg += `- ${item.name} (Qty: ${item.quantity})%0A`;
    });
    msg += `*Total:* $${order.total.toFixed(2)}%0A`;
    msg += `%0A*Order ID:* ${order.orderId || ''}`;
    return msg;
}

// Helper: Open WhatsApp link
function sendOrderToWhatsApp(order, address) {
    const adminNumber = '2348127470741'; // Remove leading zero for international format
    const message = formatWhatsAppOrderMessage(order, address);
    const url = `https://wa.me/${adminNumber}?text=${message}`;
    window.open(url, '_blank');
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadProducts();
    
    // Set up auth state listener
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        updateCartDisplay();
        const loginBtn = document.querySelector('[data-bs-target="#loginModal"]');
        const adminLink = document.querySelector('.admin-link');
        
        if (loginBtn) {
            if (user) {
                loginBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i>';
                loginBtn.setAttribute('data-bs-target', '');
                loginBtn.addEventListener('click', () => signOut(auth));
                
                // Show admin link if user is admin
                if (user.email === 'admin@example.com' && adminLink) {
                    adminLink.classList.remove('d-none');
                }

                // Require address on first login
                if (!(await userHasAddress(user.uid))) {
                    showAddressModal(async (address) => {
                        await saveUserAddress(user.uid, address);
                    });
                }
            } else {
                loginBtn.innerHTML = '<i class="bi bi-person"></i>';
                loginBtn.setAttribute('data-bs-target', '#loginModal');
                loginBtn.removeEventListener('click', () => signOut(auth));
                
                // Hide admin link
                if (adminLink) {
                    adminLink.classList.add('d-none');
                }
            }
        }
    });
});
