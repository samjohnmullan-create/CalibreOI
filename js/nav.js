var savedTheme = localStorage.getItem("calibre-theme");
if (savedTheme !== "light") document.documentElement.dataset.theme = "dark";
document.querySelectorAll(".brandbar").forEach(function(bar){
  if (bar.querySelector(".themebtn")) return;
  var b = document.createElement("button");
  b.className = "themebtn"; b.type = "button"; b.textContent = document.documentElement.dataset.theme === "dark" ? "Light" : "Dark";
  b.onclick = function(){
    var dark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "";
    localStorage.setItem("calibre-theme", dark ? "dark" : "light");
    b.textContent = dark ? "Light" : "Dark";
  };
  bar.appendChild(b);
});
document.querySelectorAll("nav.mainnav").forEach(function(nav){
  var here = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (!here || here.indexOf(".") === -1) here = "index.html";
  var items = [
    ["index.html","Home","M4 7h16v12H4zM8 7V5h8v2"],
    ["workbench.html?v=7","Bench","M4 18h16M6 18V8h4v10M14 18V5h4v13"],
    ["timegrapher.html?v=3","Rate","M12 7v6l4 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"],
    ["passport.html","Watch","M8 4h8v3a4 4 0 0 1-8 0zM8 20h8v-3a4 4 0 0 1-8 0z"],
    ["business.html","Cost","M6 6h12v12H6zM9 10h6M9 14h4"],
    ["finance.html","Funds","M5 7h14v11H5zM5 11h14M8 15h3"],
    ["summary.html","Sheet","M7 4h8l4 4 4v12H7zM15 4v4h4"],
    ["inventory.html","Stock","M5 8h14v11H5zM5 8l2-3h10l2 3"],
    ["suppliers.html","Parts","M12 4l2 4 4 .5-3 3 .8 4.5L12 14l-3.8 2 0.8-4.5-3-3L10 8z"]
  ];
  nav.innerHTML = items.map(function(item){
    var on = here === item[0].split("?")[0];
    return "<a class=\"navbtn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+"><svg viewBox=\"0 0 24 24\"><path d=\""+item[2]+"\"/></svg>"+item[1]+"</a>";
  }).join("");
  if (here === "workbench.html") {
    if (!document.querySelector('script[data-calibre-diagnostics]')) {
      var d = document.createElement("script");
      d.type = "module";
      d.src = "js/diagnostics-ui.js?v=3";
      d.dataset.calibreDiagnostics = "1";
      document.head.appendChild(d);
    }
    if (!document.querySelector('script[data-calibre-workbench-layout]')) {
      var w = document.createElement("script");
      w.type = "module";
      w.src = "js/workbench-layout.js?v=2";
      w.dataset.calibreWorkbenchLayout = "1";
      document.head.appendChild(w);
    }
  }
});
var markStyle = document.createElement("style");
markStyle.textContent = ".brandmark{padding:0;overflow:hidden;background:transparent}.brandmark img{width:42px;height:42px;object-fit:cover;display:block;border-radius:50%}";
document.head.appendChild(markStyle);
document.querySelectorAll(".brandmark").forEach(function(el){
  el.innerHTML = "<img src=\"assets/mark.png?v=5\" alt=\"\">";
});
if (!document.querySelector("link[rel=icon]")){
  var icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = "assets/mark.png?v=5";
  document.head.appendChild(icon);
}
