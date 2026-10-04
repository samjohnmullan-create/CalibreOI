document.querySelectorAll("nav.mainnav").forEach(function(nav){
  var here = location.pathname.split("/").pop() || "index.html";
  var items = [
    ["index.html", "Start"],
    ["workbench.html", "Bench"],
    ["timegrapher.html", "Time"],
    ["summary.html", "Sheet"],
    ["inventory.html", "Stock"],
    ["suppliers.html", "Parts"]
  ];
  nav.innerHTML = items.map(function(item){
    var on = here === item[0] ? " active" : "";
    return "<a class='navbtn"+on+"' href='"+item[0]+"'>"+item[1]+"</a>";
  }).join("");
});
