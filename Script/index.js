import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDxXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq",
  authDomain: "your-auth-domain.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Cart functionality
let cart = [];
let currentUser = null;

// Update cart badge
function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    badge.textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
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

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
    updateCartBadge();

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.closest('.remove-item').dataset.id;
            removeFromCart(id);
        });
    });
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

// Checkout
document.getElementById('checkoutBtn').addEventListener('click', async () => {
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

// Authentication
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const loginBtn = document.querySelector('[data-bs-target="#loginModal"]');
    if (user) {
        loginBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i>';
        loginBtn.setAttribute('data-bs-target', '');
        loginBtn.addEventListener('click', () => signOut(auth));
    } else {
        loginBtn.innerHTML = '<i class="bi bi-person"></i>';
        loginBtn.setAttribute('data-bs-target', '#loginModal');
        loginBtn.removeEventListener('click', () => signOut(auth));
    }
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// Register form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
});

// Modal switching
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    new bootstrap.Modal(document.getElementById('registerModal')).show();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
    new bootstrap.Modal(document.getElementById('loginModal')).show();
});

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
        const querySnapshot = await getDocs(collection(db, "products"));
        
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

// Load products when the page loads
document.addEventListener('DOMContentLoaded', loadProducts);

// Handle contact form submission
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

