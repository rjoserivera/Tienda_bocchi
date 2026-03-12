// Shopping Cart State
        let cart = [];
        let formatVal = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

        // Fetch products directly from Python SQLite database
        async function loadProducts() {
            const grid = document.getElementById('productsGrid');
            try {
                const res = await fetch('http://localhost:5000/api/productos');
                const products = await res.json();
                
                grid.innerHTML = ''; // Clear loader
                
                if (products.length === 0) {
                    grid.innerHTML = '<div class="loader" style="color:#a1a1aa">No hay datos existentes.</div>';
                    return;
                }

                products.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.innerHTML = `
                        <span class="product-icon">${p.icono}</span>
                        <h3>${p.nombre}</h3>
                        <div class="product-price">${formatVal.format(p.precio)}</div>
                        <p class="product-desc">${p.descripcion}</p>
                        <hr style="border:none; border-top:1px dashed var(--glass-border); margin-bottom: 1rem;">
                        <p style="font-size: 0.8rem; color:#888; text-align:left; margin-bottom: 1.5rem;"><b>Detalles:</b> ${p.detalles}</p>
                        <button class="btn-buy" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Añadir al Carrito</button>
                    `;
                    grid.appendChild(card);
                });
            } catch(e) {
                console.error(e);
                grid.innerHTML = '<div class="loader" style="color:#a1a1aa">No hay datos existentes.</div>';
            }
        }

        // Cart Logic
        function addToCart(product) {
            cart.push(product);
            updateCartUI();
            
            // Pop out sidebar briefly then close it to show feedback
            const sidebar = document.getElementById('cartSidebar');
            if (!sidebar.classList.contains('active')) {
                sidebar.classList.add('active');
                setTimeout(() => sidebar.classList.remove('active'), 1500);
            }
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCartUI();
        }

        function updateCartUI() {
            document.getElementById('cartCount').innerText = cart.length;
            
            const container = document.getElementById('cartItemsContainer');
            container.innerHTML = '';
            
            let total = 0;
            
            if (cart.length === 0) {
                container.innerHTML = '<p style="color:#666; text-align:center; margin-top: 2rem;">El carrito está vacío :(</p>';
            } else {
                cart.forEach((item, i) => {
                    total += item.precio;
                    container.innerHTML += `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <div class="cart-item-title">${item.icono} ${item.nombre}</div>
                                <div class="cart-item-price">${formatVal.format(item.precio)}</div>
                            </div>
                            <div class="cart-item-remove" onclick="removeFromCart(${i})">🗑️</div>
                        </div>
                    `;
                });
            }

            document.getElementById('cartTotalValue').innerText = formatVal.format(total);
        }

        function toggleCart() {
            document.getElementById('cartSidebar').classList.toggle('active');
        }

        // Checkout Modal Logic
        const modal = document.getElementById('purchaseModal');
        const form = document.getElementById('purchaseForm');

        function proceedToCheckout() {
            if (cart.length === 0) {
                alert("!Tu carrito está vacío!");
                return;
            }
            // Close cart, open modal
            document.getElementById('cartSidebar').classList.remove('active');
            
            // Update modal labels
            document.getElementById('selectedItemName').innerText = cart.length;
            const total = cart.reduce((acc, curr) => acc + curr.precio, 0);
            document.getElementById('checkoutTotalValue').innerText = formatVal.format(total);
            
            modal.classList.add('active');
        }

        function closeModal() {
            modal.classList.remove('active');
            form.reset();
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Submit to python backend
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const total = cart.reduce((acc, curr) => acc + curr.precio, 0);
            
            const data = {
                cart: cart,
                total: total,
                nombre: document.getElementById('nombre').value,
                email: document.getElementById('email').value,
                direccion: document.getElementById('direccion').value
            };

            try {
                const response = await fetch('http://localhost:5000/api/comprar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert('¡Compra registrada en compras.db! Muchas gracias.');
                    cart = [];
                    updateCartUI();
                    closeModal();
                } else {
                    alert('Error en el servidor Python.');
                }
            } catch(err) {
                console.error(err);
                alert('No se pudo conectar con la BD local.');
            }
        });

        // Init page
        loadProducts();
        updateCartUI();