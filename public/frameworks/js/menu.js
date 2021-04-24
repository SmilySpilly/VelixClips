$(document).ready(function () {
  // menu toggler
  $("#menu-bars").click(function () {
    $(".menu").toggleClass("open-menu");
  });
  // Warning box
  setTimeout(() => {
    $(".warning-box").fadeOut(600);
  }, 5000);

  // Search Bar
  $("#search-button").click(function () {
    let query = document.getElementById("search").value;
    location.href = "/search?q=" + query;
  });

  // UPLOAD 
  $(".uploadbtn").click(function(){
    var username = document.getElementById("ID").value;
    $(".status-text").fadeIn();

    setInterval(() => {
        $.post("/checkVideo", {user: username}, (data) => {
          if(data.success === false) {
            $(".status-text").html(data.msg)
          } else {
            $(".status-text").html(data.msg)
            $(".status-text").css({"color": "#11C26D"})
          }
        })
    }, 6000);
  })
});
