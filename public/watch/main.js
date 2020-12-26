$(document).ready(function () {
  let viewKey = document.getElementById("videoKey").value;
  let userID = document.getElementById("userInfo").value;
  displayComments();

  // Post a new Comment

  // FUNCTIONS  STARTS
  function displayComments() {
    $.ajax({
      url: "/getComments?viewKey=" + viewKey,
      method: "GET",
      success: function (data) {
        document.getElementById("comments").innerHTML = "";

        data.forEach((element) => {
          function calculateDuration(seconds) {
            var sec = Date.now() - new Date(seconds);
            sec = sec.toString();
            sec = sec.slice(0, -3);
            sec = parseInt(sec);

            var hours = Math.floor(sec / 3600);
            var minutes = Math.floor((sec - hours * 3600) / 60);
            var seconds = sec - hours * 3600 - minutes * 60;
            var days = Math.floor(hours / 24);
            var months = Math.floor(days / 30);
            var years = Math.floor(months / 12);

            if (years > 0) {
              if (years == 1) {
                return "1 year ago";
              } else {
                return years + " years ago";
              }
            } else if (months > 0) {
              if (months == 1) {
                return "1 month ago";
              } else {
                return years + " months ago";
              }
            } else if (days > 0) {
              if (days == 1) {
                return "1 day ago";
              } else {
                return days + " days ago";
              }
            } else if (hours > 0) {
              if (hours == 1) {
                return "1 hour ago";
              } else {
                return hours + " hours ago";
              }
            } else if (minutes > 0) {
              if (minutes == 1) {
                return "1 minute ago";
              } else {
                return minutes + " minutes ago";
              }
            } else if (seconds > 0) {
              return seconds + " seconds ago";
            }
          }

          $.ajax({
            url: "/getUser?userID=" + element.owner,
            method: "GET",
            success: function (userInfo) {
              document.getElementById("comments").innerHTML += `
                            <div class="col-12 row user-comment">
                            <div class="comment-date">
                            ${calculateDuration(element.published)}
                            </div> 
                            <div class="comment-user-pfp col-12 row">
                                <img src="/imgs/avatar/${
                                  userInfo.avatar
                                }" alt="">
                                <span class="comment-channel-name">
                                    ${userInfo.username}
                                </span>
                            </div>
                            <div class="comment-user-content col-12 row" style='padding-top:0px'>
                                ${element.content}
                            </div>
                        </div>
                    </div>
                    `;
            },
          });
        });
      },
    });
  }

  // Sending a Comment
  $("#send-button-comment").click(function () {
    newComment();
  });
  function newComment() {
    let content = document.getElementById("comment-content").value;
    $.post("/newComment", { content, user: userID, id: viewKey });

    document.getElementById("comment-content").value = "";
    displayComments();
  }

  if (document.getElementById("userInfo").value !== "") {
    // Reactions JS
    function updateReactions(reaction) {
      $.post("/newReaction", { user: userID, id: viewKey, reaction });
    }

    //Like
    document.getElementById("like-button").onclick = function () {
      updateReactions("like");

      if ($(".likes").hasClass("reaction-active") === true) {
        $(".likes").removeClass("reaction-active");
        document.getElementById("likes-counter").innerHTML =
          parseInt(document.getElementById("likes-counter").innerHTML) - 1;
      } else {
        $(".likes").addClass("reaction-active");
        document.getElementById("likes-counter").innerHTML =
          parseInt(document.getElementById("likes-counter").innerHTML) + 1;
      }

      if ($(".dislikes").hasClass("reaction-active") === true) {
        $(".dislikes").removeClass("reaction-active");
        document.getElementById("dislikes-counter").innerHTML =
          parseInt(document.getElementById("dislikes-counter").innerHTML) - 1;
      }
    };
    //Dislike
    $("#dislike-button").click(() => {
      updateReactions("dislike");

      if ($(".dislikes").hasClass("reaction-active") === true) {
        $(".dislikes").removeClass("reaction-active");
        document.getElementById("dislikes-counter").innerHTML =
          parseInt(document.getElementById("dislikes-counter").innerHTML) - 1;
      } else {
        $(".dislikes").addClass("reaction-active");
        document.getElementById("dislikes-counter").innerHTML =
          parseInt(document.getElementById("dislikes-counter").innerHTML) + 1;
      }

      if ($(".likes").hasClass("reaction-active") === true) {
        $(".likes").removeClass("reaction-active");
        document.getElementById("likes-counter").innerHTML =
          parseInt(document.getElementById("likes-counter").innerHTML) - 1;
      }
    });
  }

  // UpComing Videos
  $.ajax({
    url: "/getVideos",
    method: "GET",
    success: function (data) {
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
          "upnext-videos"
        ).innerHTML += `<div class="col-12 col-sm-6 col-lg-3">
                        <a href="/watch?viewKey=${
                          element._id
                        }" class="col row thumbnail-area" style="background-image: url('/data/${
          element.thumbnail
        }')"> <i class="fa fa-play" aria-hidden="true"></i> </a>
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
    },
  });
});
