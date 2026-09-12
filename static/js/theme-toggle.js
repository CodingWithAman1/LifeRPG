// Life RPG — theme toggle
// Applies the saved theme immediately (before paint) to avoid a
// flash of the wrong theme, then wires up any .theme-toggle buttons
// once the DOM is ready. Independent of the app's other JS modules.

(function () {
    var STORAGE_KEY = "lifeRpgTheme";
    var saved = localStorage.getItem(STORAGE_KEY) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
})();

document.addEventListener("DOMContentLoaded", function () {
    var STORAGE_KEY = "lifeRpgTheme";

    function currentTheme() {
        return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    }

    function updateButtons(theme) {
        var buttons = document.querySelectorAll(".theme-toggle");
        buttons.forEach(function (btn) {
            btn.textContent = theme === "light" ? "🌙 Dark Mode" : "☀ Light Mode";
            btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
        });
    }

    updateButtons(currentTheme());

    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var next = currentTheme() === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem(STORAGE_KEY, next);
            updateButtons(next);
        });
    });
});