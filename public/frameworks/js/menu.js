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
});
