// ---------------- Globalne promenljive ----------------
let products = [];
let categories = [];
let brands = [];
let korpa = [];

let currentPage = 1;
const itemsPerPage = 6;

// ---------------- Init ----------------
$(document).ready(function () {
    loadKorpaIzLS();
    loadProducts();
    loadCategories();
    loadBrands();
    setupEvents();

    $("#clearCart").on("click", function(){
        obrisiKorpu();
    });

    ispisKorpe();
});

// ---------------- LocalStorage ----------------
function sacuvajKorpuULS(){
    localStorage.setItem("korpa", JSON.stringify(korpa));
}

function loadKorpaIzLS(){
    const sacuvanaKorpa = localStorage.getItem("korpa");
    korpa = sacuvanaKorpa ? JSON.parse(sacuvanaKorpa) : [];
}

// ---------------- AJAX za products ----------------
function loadProducts() {
    $.ajax({
        url: "assets/json/products.json",
        method: "GET",
        dataType: "json",
        success: function (data) {
            products = data;
            renderProducts();
        },
        error: function (err) {
            console.log("Greška kod učitavanja proizvoda:", err);
        }
    });
}

// ---------------- AJAX za categories ----------------
function loadCategories(){
    $.ajax({
        url:"assets/json/categories.json",
        method:"GET",
        dataType:"json",
        success:function(data){
            categories = data;
            ispisKategorija();
            renderProducts();
        },
        error:function(err){
            console.log("Greška kod učitavanja kategorija:", err);
        }
    });
}

// ---------------- AJAX za brands ----------------
function loadBrands(){
    $.ajax({
        url:"assets/json/brands.json",
        method:"GET",
        dataType:"json",
        success:function(data){
            brands = data;
            ispisBrendova();
            renderProducts();
        },
        error:function(err){
            console.log("Greška kod učitavanja brendova:", err);
        }
    });
}

// ---------------- Ispis kategorija ----------------
function ispisKategorija(){
    let html = "";
    categories.forEach(c => {
        html += `<label><input type="checkbox" value="${c.id}"> ${c.name}</label><br>`;
    });
    $(".filters .categories").html(html);
}

// ---------------- Ispis brendova ----------------
function ispisBrendova(){
    let html = "";
    brands.forEach(b => {
        html += `<label><input type="checkbox" value="${b.id}"> ${b.name}</label><br>`;
    });
    $(".filters .brands").html(html);
}

// ---------------- Event ----------------
function setupEvents(){
    $(".search-input").on("input", renderProducts);
    $(".sortDropdown").on("change", renderProducts);
    $(".fav-checkbox input").on("change", renderProducts);

    $(".price-range").on("input", function(){
        $("#price-value").text($(this).val());
        renderProducts();
    });

    $(document).on("change", ".filters .categories input[type=checkbox]", renderProducts);
    $(document).on("change", ".filters .brands input[type=checkbox]", renderProducts);
}

// ---------------- Filter ----------------
function applyFilters(data){
    const searchTerm = $(".search-input").val()?.toLowerCase() || "";
    const maxPrice = parseInt($(".price-range").val()) || Infinity;
    const onlyFavorites = $(".fav-checkbox input").is(":checked");

    const selectedCategories = $(".filters .categories input:checked").map(function(){
        return parseInt($(this).val());
    }).get();

    const selectedBrands = $(".filters .brands input:checked").map(function(){
        return parseInt($(this).val());
    }).get();

    return data.filter(p =>
        p.title.toLowerCase().includes(searchTerm) &&
        p.price <= maxPrice &&
        (!onlyFavorites || p.favorite === true) &&
        (selectedCategories.length === 0 || selectedCategories.includes(p.categoryID)) &&
        (selectedBrands.length === 0 || selectedBrands.includes(p.brandID))
    );
}

// ---------------- Sortiranje ----------------
function getFinalPrice(price, discount){
    return discount ? price - (price * discount / 100) : price;
}

function sortProducts(data) {
    var selektovanaVrednost = $(".sortDropdown").val();
    var kopijaNiza = [...data];

    kopijaNiza.sort(function(a, b) {
        if(selektovanaVrednost === "default"){
            return a.id - b.id;
        }
        if(selektovanaVrednost === "price-asc"){
            return getFinalPrice(a.price, a.discount) - getFinalPrice(b.price, b.discount);
        }
        if(selektovanaVrednost === "price-desc"){
            return getFinalPrice(b.price, b.discount) - getFinalPrice(a.price, a.discount);
        }
        if(selektovanaVrednost === "name-asc"){
            return a.title.localeCompare(b.title);
        }
        if(selektovanaVrednost === "name-desc"){
            return b.title.localeCompare(a.title);
        }
        
    });

    return kopijaNiza;
}

// ---------------- Render proizvoda ----------------
function renderProducts(){
    let filtered = applyFilters(products);
    filtered = sortProducts(filtered);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    let html = "";
    paginated.forEach(p => {
        const cat = categories.find(c => c.id === p.categoryID);
        const br = brands.find(b => b.id === p.brandID);

        html += `
        <div class="product-card">
            <img src="${p.img}" alt="${p.title}">
            <h3>${p.title}</h3>
            <p>Cena: ${p.price} RSD</p>
            <p>Kategorija: ${cat ? cat.name : ""} | Brend: ${br ? br.name : ""}</p>
            <div class="product-actions">
                <button onclick="dodajUKorpu('${p.title}', ${p.price})">Dodaj u korpu</button>
            </div>
        </div>`;
    });
    $(".products").html(html);

    let paginationHtml = "";
    for(let i=1; i<=totalPages; i++){
        paginationHtml += `<button class="page-btn ${i===currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    $("#pagination").html(paginationHtml);

    $(".page-btn").on("click", function(){
        currentPage = parseInt($(this).data("page"));
        renderProducts();
    });
}

// ---------------- Korpa ----------------
function ispisKorpe() {
    const totalCount = korpa.reduce((sum, s) => sum + s.quantity, 0);
    $("#cartCount").text(totalCount);

    const itemsContainer = $("#cartItems").empty();

    if (korpa.length === 0) {
        itemsContainer.html('<p class="text-secondary">Korpa je prazna.</p>');
        return;
    }

    korpa.forEach((stavka, i) => {
        const ukupno = stavka.price * stavka.quantity;
        itemsContainer.append(`
            <div class="cart-item">
                <p><strong>${stavka.title}</strong></p>
                <p>Količina: ${stavka.quantity}</p>
                <p>Cena: ${stavka.price.toFixed(2)} RSD</p>
                <p>Ukupno: ${ukupno.toFixed(2)} RSD</p>
                <button onclick="ukloniIzKorpe(${i})">Ukloni jedan</button>
            </div>
        `);
    });

    const totalPrice = korpa.reduce((sum, s) => sum + s.price * s.quantity, 0);
    itemsContainer.append(`<div class="fw-bold">Ukupna cena: ${totalPrice.toFixed(2)} RSD</div>`);
}

function showMessage(text) {
    const poruka = document.getElementById("message");
    poruka.style.color = "red";
    poruka.textContent = text;
    setTimeout(() => poruka.textContent = "", 5000); // briše posle 5 sekundi
}

// Dodavanje u korpu
function dodajUKorpu(title, price) {
    price = Number(price);
    let stavkaUKorpi = korpa.find(stavka => stavka.title === title);

    if (!stavkaUKorpi) {
        stavkaUKorpi = {title, price, quantity: 0};
        korpa.push(stavkaUKorpi);
    }

    if (stavkaUKorpi.quantity >= 5) {
        showMessage("Maksimalno 5 komada jednog proizvoda!");
        return;
    }

    stavkaUKorpi.quantity++;
    sacuvajKorpuULS();
    ispisKorpe();
}

// Uklanjanje jednog komada
function ukloniIzKorpe(i) {
    const stavka = korpa[i];
    if (!stavka) return;

    stavka.quantity--;

    if (stavka.quantity <= 0) {
        korpa.splice(i, 1);
    }

    sacuvajKorpuULS();
    ispisKorpe();
}

// Brisanje cele korpe
function obrisiKorpu() {
    korpa = [];
    sacuvajKorpuULS();
    ispisKorpe();
}
