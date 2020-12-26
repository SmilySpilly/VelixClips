$(document).ready(function () {
  // Recommended Videos
  $.ajax({
    url: "/getVideos",
    method: "GET",
    success: function (data) {
      if (data.length < 1) {
        document.getElementById("recommended-videos").innerHTML =
          "<p style='text-align:center'> There is no videos to display </p>";
      } else {
        data.forEach((element) => {
          var Videodate = new Date(element.published);
          const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(
            Videodate
          );
          const mo = new Intl.DateTimeFormat("en", { month: "numeric" }).format(
            Videodate
          );
          const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(
            Videodate
          );

          document.getElementById(
            "recommended-videos"
          ).innerHTML += `<div class="col-12 col-sm-6 col-lg-3">
                        <a href="/watch?viewKey=${
                          element._id
                        }" class="col row"> <i class="fa fa-play" aria-hidden="true"></i> </a>
                        <div class="video-title row col-12">
                            <a class="col" href="/watch?viewKey=${
                              element._id
                            }"> ${element.title}</a>
                        </div>
                        <div class="video-description row col-12">
                            <div class="col">by ${element.owner}</div>
                            <div class="col">${ye + "-" + mo + "-" + da}</div>
                        </div>
                    </div>`;
        });
      }
    },
  });

  // Recent Videos
  $.ajax({
    url: "/getVideos?method=recent",
    method: "GET",
    success: function (data) {
      if (data.length < 1) {
        document.getElementById("recent-videos").innerHTML =
          "<p style='text-align:center'> There is no videos to display </p>";
      } else {
        data.forEach((element) => {
          var Videodate = new Date(element.published);
          const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(
            Videodate
          );
          const mo = new Intl.DateTimeFormat("en", { month: "numeric" }).format(
            Videodate
          );
          const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(
            Videodate
          );

          document.getElementById(
            "recent-videos"
          ).innerHTML += `<div class="col-12 col-sm-6 col-lg-3">
                        <a href="/watch?viewKey=${
                          element._id
                        }" class="col row" style="background-image: url('/data/${
            element.thumbnail
          }')> <i class="fa fa-play" aria-hidden="true"></i> </a>
                        <div class="video-title row col-12">
                            <a class="col" href="/watch?viewKey=${
                              element._id
                            }"> ${element.title}</a>
                        </div>
                        <div class="video-description row col-12">
                            <div class="col">by ${element.owner}</div>
                            <div class="col">${ye + "-" + mo + "-" + da}</div>
                        </div>
                    </div>`;
        });
      }
    },
  });
});
