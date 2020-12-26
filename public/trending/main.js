$(document).ready(function () {
  $.ajax({
    url: "/getVideos?method=trending",
    method: "GET",
    success: function (data) {
      var i = 1;

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

        document.getElementById("trending-videos").innerHTML += `
                <div class="col-12 col-sm-6 col-lg-3">
                    <a href="/watch?viewKey=${
                      element._id
                    }" class="col row" style="background-image: url('/data/${
          element.thumbnail
        }')> <i class="fa fa-play" aria-hidden="true"></i> </a>
                    <div class="video-title row col-12">
                        <a class="col" href="/watch?viewKey=${element._id}"> ${
          element.title
        }  #${i}</a>
                    </div>
                    <div class="video-description row col-12">
                        <div class="col">by ${element.owner}</div>
                        <div class="col">${ye + "-" + mo + "-" + da}</div>
                    </div>
                </div>
                `;
        // increasing
        i++;
      });
    },
  });

  // Fetching trending content creators from API
  $.ajax({
    url: "/getContentCreators",
    method: "GET",
    success: function (data) {
      var i = 1;

      data.forEach((element) => {
        document.getElementById("trending-creators").innerHTML += `
                <a href="/channel/?name=${element.username}" class="content-creators-trending-box row col-12 col-sm-6 col-lg-3">
                    <span class="col-6 row"> <img style="width:100%; min-height:100%;border-radius: 66px;" src="/imgs/avatar/${element.avatar}">  </img> </span>
                    <!--Channel Description-->
                    <div class="content-creator-description row col-6">
                        <div class="col">
                        ${element.username} <br>
                            <font style="font-size:13px">${element.subscribers} Subscribers</font>
                        </div>
                    </div>
                </a>
                `;
        // increasing
        i++;
      });
    },
  });
});
