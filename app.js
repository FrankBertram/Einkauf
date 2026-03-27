(function () {
    "use strict";

    // --- State ---
    var STORAGE_KEY = "einkauf_items";
    var items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    // --- DOM refs ---
    var totalEl = document.getElementById("total");
    var countEl = document.getElementById("item-count");
    var grid = document.getElementById("price-buttons");
    var entriesList = document.getElementById("entries");
    var btnUndo = document.getElementById("btn-undo");
    var btnReset = document.getElementById("btn-reset");
    var btnCustom = document.getElementById("btn-custom");

    // --- Price list ---
    function buildPrices() {
        var prices = [];
        for (var c = 29; c <= 199; c += 10) prices.push(c);
        for (var c2 = 219; c2 <= 399; c2 += 20) prices.push(c2);
        [100, 111, 200, 222, 249, 269, 499].forEach(function (s) {
            if (prices.indexOf(s) === -1) prices.push(s);
        });
        prices.sort(function (a, b) { return a - b; });
        return prices;
    }

    var specialPrices = new Set([100, 111, 200, 222]);

    // --- Helpers ---
    function centsToStr(cents) {
        return (cents / 100).toFixed(2).replace(".", ",") + " \u20AC";
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function renderList() {
        entriesList.innerHTML = "";
        if (items.length === 0) {
            var empty = document.createElement("li");
            empty.className = "entries-empty";
            empty.textContent = "Noch keine Einträge";
            entriesList.appendChild(empty);
            return;
        }
        // Newest first
        for (var i = items.length - 1; i >= 0; i--) {
            var li = document.createElement("li");
            if (i === items.length - 1) li.className = "entry-new";
            li.setAttribute("data-item-index", i);
            li.style.cursor = "pointer";
            var idx = document.createElement("span");
            idx.className = "entry-index";
            idx.textContent = (i + 1) + ".";
            var price = document.createElement("span");
            price.className = "entry-price";
            price.textContent = centsToStr(items[i]);
            li.appendChild(idx);
            li.appendChild(price);
            entriesList.appendChild(li);
        }
    }

    entriesList.addEventListener("click", function (e) {
        var li = e.target.closest("li[data-item-index]");
        if (!li) return;
        var index = parseInt(li.getAttribute("data-item-index"), 10);
        items.splice(index, 1);
        save();
        updateDisplay();
    });

    function updateDisplay() {
        var sum = items.reduce(function (a, b) { return a + b; }, 0);
        totalEl.textContent = centsToStr(sum);
        countEl.textContent = "(" + items.length + " Artikel)";
        renderList();

        totalEl.classList.remove("pulse");
        void totalEl.offsetWidth;
        totalEl.classList.add("pulse");
    }

    function addItem(cents) {
        items.push(cents);
        save();
        updateDisplay();
    }

    // --- Button creation ---
    function createButtons() {
        var prices = buildPrices();
        var frag = document.createDocumentFragment();
        prices.forEach(function (cents) {
            var btn = document.createElement("button");
            btn.className = "price-btn" + (specialPrices.has(cents) ? " special" : "");
            btn.textContent = centsToStr(cents);
            btn.setAttribute("data-cents", cents);
            btn.setAttribute("aria-label", centsToStr(cents) + " hinzufügen");
            frag.appendChild(btn);
        });
        grid.appendChild(frag);
    }

    // --- Event handlers ---
    grid.addEventListener("click", function (e) {
        var btn = e.target.closest(".price-btn");
        if (!btn) return;
        var cents = parseInt(btn.getAttribute("data-cents"), 10);
        addItem(cents);
        btn.classList.remove("flash");
        void btn.offsetWidth;
        btn.classList.add("flash");
    });

    btnCustom.addEventListener("click", function () {
        var input = prompt("Betrag in Euro eingeben (z.B. 4,59):");
        if (input === null || input.trim() === "") return;
        // Accept both comma and dot as decimal separator
        var cleaned = input.trim().replace(",", ".");
        var value = parseFloat(cleaned);
        if (isNaN(value) || value <= 0) {
            alert("Bitte einen gültigen Betrag eingeben.");
            return;
        }
        var cents = Math.round(value * 100);
        addItem(cents);
    });

    btnUndo.addEventListener("click", function () {
        if (items.length === 0) return;
        items.pop();
        save();
        updateDisplay();
    });

    btnReset.addEventListener("click", function () {
        if (items.length === 0) return;
        if (!confirm("Warenkorb wirklich zurücksetzen?")) return;
        items = [];
        save();
        updateDisplay();
    });

    // --- Init ---
    createButtons();
    updateDisplay();

    // --- Service Worker ---
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("service-worker.js").catch(function (err) {
            console.warn("SW registration failed:", err);
        });
    }
})();
