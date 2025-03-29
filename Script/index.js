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
    setDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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
                const orderRef = await addDoc(collection(db, 'orders'), {
                    userId: currentUser.uid,
                    items: cart,
                    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    status: 'pending',
                    createdAt: new Date()
                });
                
                alert('Order placed successfully!');
                cart = [];
                updateCartDisplay();
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
                await signInWithEmailAndPassword(auth, email, password);
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                if (loginModal) {
                    loginModal.hide();
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
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
                await createUserWithEmailAndPassword(auth, email, password);
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                if (registerModal) {
                    registerModal.hide();
                }
            } catch (error) {
                alert('Registration failed: ' + error.message);
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

// Function to create product cards
function createProductCard(product) {
    return `
        <div class="col-md-4 col-lg-3">
            <div class="card product-card h-100">
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

// Function to load products from Firebase
async function loadProducts() {
    try {
        const productsContainer = document.querySelector('#products .row');
        if (!productsContainer) return;

        const querySnapshot = await getDocs(collection(db, "products"));
        productsContainer.innerHTML = ''; // Clear existing content
        
        querySnapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            productsContainer.innerHTML += createProductCard(product);
        });

        // Add event listeners to Add to Cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart').dataset.id;
                const product = querySnapshot.docs.find(doc => doc.id === productId).data();
                addToCart({ id: productId, ...product });
            });
        });
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadProducts();
    
    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateCartDisplay();
    });
});

