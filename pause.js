(function () {
    if (!window.GLOBALFRUIT_PAUSED) {
        return;
    }

    var pausedPath = "/pause.html";
    var currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

    if (currentPath !== "/pause.html") {
        window.location.replace(pausedPath);
        return;
    }

    document.documentElement.style.background = "#fff";
    document.documentElement.style.margin = "0";

    document.addEventListener("DOMContentLoaded", function () {
        document.title = "";
        document.body.innerHTML = "";
        document.body.style.margin = "0";
        document.body.style.background = "#fff";
    });
}());
