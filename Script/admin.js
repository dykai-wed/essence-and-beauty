import { auth, db, storage } from './firebase-config.js';
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
    deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Check if user is admin
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Check if user is admin (you can implement your own admin check logic)
    if (user.email !== 'admin@example.com') {
        alert('Access denied. Admin only.');
        window.location.href = 'index.html';
        return;
    }
    
    loadProducts();
});

// Image preview
const productImage = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');

productImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }
});

// Product form submission
const productForm = document.getElementById('productForm');
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const imageFile = productImage.files[0];
    
    try {
        // Show loading state
        const submitButton = productForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';
        submitButton.disabled = true;

        // Create a unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        // Get the storage reference
        const storageRef = ref(storage, `products/${filename}`);
        
        // Upload image to Firebase Storage
        console.log('Starting upload to:', storageRef.fullPath);
        const snapshot = await uploadBytes(storageRef, imageFile);
        console.log('Upload successful:', snapshot);
        
        // Get the download URL
        const imageUrl = await getDownloadURL(snapshot.ref);
        console.log('Download URL:', imageUrl);
        
        // Add product to Firestore
        const productData = {
            name,
            description,
            price,
            imageUrl,
            createdAt: new Date()
        };
        
        console.log('Adding product to Firestore:', productData);
        await addDoc(collection(db, 'products'), productData);
        
        // Reset form
        productForm.reset();
        imagePreview.classList.add('d-none');
        loadProducts();
        
        alert('Product added successfully!');
    } catch (error) {
        console.error('Error adding product:', error);
        let errorMessage = 'Error adding product: ';
        if (error.code === 'storage/unauthorized') {
            errorMessage += 'Please log in to upload images.';
        } else if (error.code === 'storage/canceled') {
            errorMessage += 'Upload was canceled.';
        } else if (error.code === 'storage/unknown') {
            errorMessage += 'An unknown error occurred.';
        } else {
            errorMessage += error.message;
        }
        alert(errorMessage);
    } finally {
        // Reset button state
        const submitButton = productForm.querySelector('button[type="submit"]');
        submitButton.innerHTML = 'Add Product';
        submitButton.disabled = false;
    }
});

// Load products
async function loadProducts() {
    const productList = document.getElementById('productList');
    productList.innerHTML = '<div class="text-center">Loading...</div>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        productList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productElement = document.createElement('div');
            productElement.className = 'card mb-3';
            productElement.innerHTML = `
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <img src="${product.imageUrl}" class="img-fluid rounded" alt="${product.name}">
                        </div>
                        <div class="col-md-8">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text"><strong>$${product.price.toFixed(2)}</strong></p>
                            <button class="btn btn-danger btn-sm delete-product" data-id="${doc.id}">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productList.appendChild(productElement);
        });
        
        // Add delete event listeners
        document.querySelectorAll('.delete-product').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this product?')) {
                    const productId = e.target.closest('.delete-product').dataset.id;
                    try {
                        // Delete from Firestore
                        await deleteDoc(doc(db, 'products', productId));
                        loadProducts();
                    } catch (error) {
                        console.error('Error deleting product:', error);
                        alert('Error deleting product. Please try again.');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
        productList.innerHTML = '<div class="alert alert-danger">Error loading products</div>';
    }
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}); 