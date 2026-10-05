document.querySelectorAll("nav.mainnav").forEach(function(nav){
  var here = location.pathname.split("/").pop() || "index.html";
  if (!here || here.indexOf(".") === -1) here = "index.html";
  var items = [["index.html","Start"],["workbench.html","Bench"],["timegrapher.html","Time"],["passport.html","Identity"],["business.html","Cost"],["summary.html","Sheet"],["inventory.html","Stock"],["suppliers.html","Parts"]];
  nav.innerHTML = items.map(function(item){
    var on = here === item[0];
    return "<a class=\"navbtn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+">"+item[1]+"</a>";
  }).join("");
});
var markStyle = document.createElement("style");
markStyle.textContent = ".header-logo{display:block;height:48px;width:auto;max-width:min(280px,72vw)}.brandbar{min-height:60px}";
document.head.appendChild(markStyle);
document.querySelectorAll("a.brand").forEach(function(el){
  el.innerHTML = "<img class=\"header-logo\" src=\"assets/header.png?v=5\" alt=\"Calibre\">";
});
if (!document.querySelector("link[rel=icon]")){
  var icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = "assets/mark.png?v=3";
  document.head.appendChild(icon);
}
