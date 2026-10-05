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
markStyle.textContent = ".brandmark{padding:0;overflow:hidden;background:#111}.brandmark img{width:42px;height:42px;object-fit:cover;display:block}.seal{display:block;width:min(168px,42vw);height:auto;margin:4px auto 12px}.seal.dark{border-radius:50%}.wordmark{display:block;width:min(440px,100%);height:auto;margin:0 auto 14px}";
document.head.appendChild(markStyle);
document.querySelectorAll(".brandmark").forEach(function(el){
  el.innerHTML = "<img src=\"assets/mark.png?v=2\" alt=\"\">";
});
if (!document.querySelector("link[rel=icon]")){
  var icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = "assets/mark.png?v=2";
  document.head.appendChild(icon);
}
