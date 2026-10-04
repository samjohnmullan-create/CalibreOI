document.querySelectorAll("nav.mainnav").forEach(function(nav){
  var here = location.pathname.split("/").pop() || "index.html";
  if (!here || here.indexOf(".") === -1) here = "index.html";
  var items = [["index.html","Start"],["workbench.html","Bench"],["timegrapher.html","Time"],["passport.html","Identity"],["business.html","Cost"],["summary.html","Sheet"],["inventory.html","Stock"],["suppliers.html","Parts"]];
  nav.innerHTML = items.map(function(item){
    var on = here === item[0];
    return "<a class=\"navbtn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+">"+item[1]+"</a>";
  }).join("");
});
