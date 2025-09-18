document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('store-container');
    const cartCountEl = document.getElementById('cart-count');

    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
    const saveCart = (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
        if(cartCountEl) cartCountEl.textContent = cart.length;
    };

    const addToCart = (itemId) => {
        const cart = getCart();
        cart.push(itemId);
        saveCart(cart);
    };

    fetch('data/store.json')
        .then(response => response.json())
        .then(data => {
            container.innerHTML = data.items.map(item => `
                <div class="store-item-card">
                    <img src="${item.image_url}" alt="${item.title}">
                    <h4>${item.title}</h4>
                    <p class="price">$${item.price.toFixed(2)}</p>
                    <button class="btn add-to-cart-btn" data-item-id="${item.id}">Add to Cart</button>
                </div>
            `).join('');
        })
        .catch(error => {
            container.innerHTML = '<p>Could not load store items.</p>';
            console.error(error);
        });

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const itemId = e.target.dataset.itemId;
            addToCart(itemId);
            e.target.textContent = 'Added!';
            setTimeout(() => { e.target.textContent = 'Add to Cart'; }, 1000);
        }
    });
});