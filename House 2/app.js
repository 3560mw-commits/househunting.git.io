const store = {
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    currentUser: () => JSON.parse(sessionStorage.getItem('user')),
    tempImages: []
};

// INITIALIZATION REMOVED: No more sample Westlands data.

const ui = {
    updateNav: (user) => {
        const links = document.getElementById('nav-links');
        if (!links) return;
        links.innerHTML = user 
            ? `<button class="btn btn-outline" onclick="router.navigate('dashboard')">Dashboard</button>
               <button class="btn btn-primary" onclick="auth.logout()" style="margin-left:10px">Logout</button>`
            : `<button class="btn btn-outline" onclick="router.navigate('login')">Login</button>
               <button class="btn btn-primary" onclick="router.navigate('signup')" style="margin-left:10px">Sign up</button>`;
    },

    homeHTML: () => `
        <header class="container" style="padding: 80px 0; text-align:center;">
            <h1 style="font-size: 3.5rem; margin:0;">Find your space in <span style="color:var(--primary)">Kenya.</span></h1>
            <p style="color:var(--gray); font-size:1.25rem;">Modern homes, verified owners, no middlemen.</p>
            <div style="max-width:600px; margin: 40px auto 0;">
                <input type="text" placeholder="Where do you want to live?" onkeyup="ui.renderProperties(this.value)" style="box-shadow: 0 10px 30px rgba(0,0,0,0.05); border:none; height:60px;">
            </div>
        </header>
        <div class="container"><div id="propertyGrid" class="property-grid"></div></div>`,

    loginHTML: () => `
        <div class="split-container">
            <div class="split-side-image"><h1>Welcome Back</h1><p>Login to manage your listings.</p></div>
            <div class="split-side-form"><div class="auth-box">
                <h2>Sign In</h2>
                <input type="email" id="email" placeholder="Email Address">
                <input type="password" id="pass" placeholder="Password">
                <button class="btn btn-primary" style="width:100%; height:55px; margin-top:20px" onclick="auth.process('login')">Login</button>
                <p style="text-align:center; margin-top:25px">New? <a href="#" onclick="router.navigate('signup')">Register</a></p>
            </div></div>
        </div>`,

    signupHTML: () => `
        <div class="split-container">
            <div class="split-side-image"><h1>Join StaySpace</h1><p>Connect with verified properties in Kenya.</p></div>
            <div class="split-side-form"><div class="auth-box">
                <h2>Create Account</h2>
                <input type="text" id="name" placeholder="Full Name">
                <input type="email" id="email" placeholder="Email Address">
                <input type="password" id="pass" placeholder="Password">
                <select id="role"><option value="seeker">I am looking for a home</option><option value="owner">I am an Owner</option></select>
                <button class="btn btn-primary" style="width:100%; height:55px; margin-top:20px" onclick="auth.process('signup')">Register</button>
                <p style="text-align:center; margin-top:25px">Have an account? <a href="#" onclick="router.navigate('login')">Login</a></p>
            </div></div>
        </div>`,

    dashboardHTML: () => {
        const user = store.currentUser();
        if(!user) { router.navigate('login'); return ''; }
        const all = store.get('properties');
        const myProps = user.role === 'owner' ? all.filter(p => p.owner === user.email) : all;
        return `
            <div class="container" style="padding: 50px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px">
                    <h2>Dashboard</h2>
                    ${user.role === 'owner' ? `<button class="btn btn-primary" onclick="ui.showAddProp()">+ Post Property</button>` : ''}
                </div>
                <div id="propertyGrid" class="property-grid">${ui.renderCards(myProps, user.role==='owner')}</div>
            </div>`;
    },

    renderCards: (props, isOwner) => {
        if(props.length === 0) return `<div style="grid-column:1/-1; text-align:center; padding:100px 0; color:var(--gray)"><h3>No listings yet.</h3></div>`;
        return props.map(p => {
            const flowImages = [...p.images, ...p.images, ...p.images];
            return `
            <div class="card">
                <div class="image-flow-container" onclick="app.viewGallery(${p.id})">
                    <div class="image-marquee" style="animation-duration: ${p.images.length * 4}s">
                        ${flowImages.map(img => `<img src="${img}">`).join('')}
                    </div>
                </div>
                <div style="padding:24px">
                    <h3 style="margin:0">${p.title}</h3>
                    <p style="color:var(--gray); font-size:14px; margin:8px 0;">📍 ${p.location}</p>
                    <p style="font-weight:800; color:var(--primary); font-size:1.3rem">Kes ${Number(p.price).toLocaleString()}</p>
                    <div style="margin-top:20px">
                        ${isOwner ? `
                            <button class="btn btn-outline" style="width:78%" onclick="app.toggle(${p.id})">Status</button>
                            <button class="btn" style="color:var(--danger); background:#fff1f1" onclick="app.delete(${p.id})"><i class="fa fa-trash"></i></button>
                        ` : `
                            <button class="btn btn-primary" style="width:100%" onclick="app.inquire('${p.contact}', '${p.title}')"><i class="fab fa-whatsapp"></i> Inquire Now</button>
                        `}
                    </div>
                </div>
            </div>`
        }).join('');
    },

    renderProperties: (q = '') => {
        const grid = document.getElementById('propertyGrid');
        if(!grid) return;
        const list = store.get('properties').filter(p => p.status === 'available' && (p.location.toLowerCase().includes(q.toLowerCase()) || p.title.toLowerCase().includes(q.toLowerCase())));
        grid.innerHTML = ui.renderCards(list, false);
    },

    showAddProp: () => {
        store.tempImages = [];
        document.getElementById('modal').style.display = 'flex';
        document.getElementById('modal-body').innerHTML = `
            <h2>List Property</h2>
            <input type="text" id="p-title" placeholder="Title">
            <input type="text" id="p-loc" placeholder="Location">
            <input type="number" id="p-price" placeholder="Price">
            <input type="tel" id="p-contact" placeholder="WhatsApp Number">
            <label style="border:2px dashed #ddd; padding:20px; display:block; text-align:center; cursor:pointer; margin:10px 0; border-radius:10px;">
                <p>Upload Photos</p><input type="file" hidden multiple accept="image/*" onchange="app.handleFiles(this)">
            </label>
            <div id="preview" style="display:grid; grid-template-columns:repeat(4,1fr); gap:5px"></div>
            <button class="btn btn-primary" style="width:100%; margin-top:20px; height:55px" onclick="app.add()">Publish</button>`;
    },

    closeModal: () => document.getElementById('modal').style.display = 'none'
};

const router = {
    navigate: (view) => {
        const appDiv = document.getElementById('app');
        ui.updateNav(store.currentUser());
        if (view === 'home') appDiv.innerHTML = ui.homeHTML();
        else if (view === 'login') appDiv.innerHTML = ui.loginHTML();
        else if (view === 'signup') appDiv.innerHTML = ui.signupHTML();
        else if (view === 'dashboard') appDiv.innerHTML = ui.dashboardHTML();
        if (view === 'home') ui.renderProperties();
        window.scrollTo(0,0);
    }
};

const auth = {
    process: (mode) => {
        const email = document.getElementById('email').value;
        if(!email) return;
        sessionStorage.setItem('user', JSON.stringify({ email, name: email.split('@')[0], role: document.getElementById('role')?.value || 'seeker' }));
        router.navigate('dashboard');
    },
    logout: () => { sessionStorage.clear(); router.navigate('home'); }
};

const app = {
    viewGallery: (id) => {
        const p = store.get('properties').find(x => x.id === id);
        document.getElementById('modal').style.display = 'flex';
        document.getElementById('modal-body').innerHTML = `
            <h2>${p.title}</h2>
            <div class="full-gallery-grid">${p.images.map(img => `<img src="${img}" style="width:100%; height:140px; object-fit:cover; border-radius:12px; cursor:pointer" onclick="window.open('${img}')">`).join('')}</div>
            <button class="btn btn-primary" style="width:100%; margin-top:30px; height:55px" onclick="app.inquire('${p.contact}', '${p.title}')">WhatsApp Owner</button>`;
    },
    handleFiles: (input) => {
        const prev = document.getElementById('preview');
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => { store.tempImages.push(e.target.result); prev.innerHTML += `<img src="${e.target.result}" style="width:100%; height:60px; object-fit:cover; border-radius:8px">`; };
            reader.readAsDataURL(file);
        });
    },
    add: () => {
        const p = store.get('properties');
        p.push({ id: Date.now(), owner: store.currentUser().email, title: document.getElementById('p-title').value, location: document.getElementById('p-loc').value, price: document.getElementById('p-price').value, contact: document.getElementById('p-contact').value, images: store.tempImages, status: 'available' });
        store.save('properties', p); ui.closeModal(); router.navigate('dashboard');
    },
    inquire: (phone, title) => window.open(`https://wa.me/${phone}?text=Hi, I am interested in ${title}`),
    toggle: (id) => { const p = store.get('properties'); const item = p.find(x => x.id === id); item.status = item.status === 'available' ? 'booked' : 'available'; store.save('properties', p); router.navigate('dashboard'); },
    delete: (id) => { if(confirm("Delete?")) { store.save('properties', store.get('properties').filter(x => x.id !== id)); router.navigate('dashboard'); } }
};

window.onload = () => router.navigate('home');