const paypal = require("paypal-rest-sdk");
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const db = require("./database/database");
const mongoose = require("mongoose");
const app = express();
const UserModel = require("./database/models/user");
const VideoModel = require("./database/models/videos");
const CommentsModel = require("./database/models/comments");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const timestampToDate = require("timestamp-to-date");
const validator = require("email-validator");
const md5 = require("md5");
const formidable = require("formidable");
const { isUndefined } = require("util");
const videos = require("./database/models/videos");
const multer = require("multer");
const user = require("./database/models/user");
const { update } = require("./database/models/user");
const ADMIN = require("./database/models/admin")
const Applications = require("./database/models/applications")
const e = require("express");
const { connect } = require("pm2");
const { exit } = require("process");

db.then(() => console.log("Connected to MongoDB.")).catch((err) =>
  console.log(err)
);
const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/VelixClips",
  collection: "Sessions",
});
store.on("error", function (error) {
  console.log(error);
});
app.use(
  require("express-session")({
    secret: "fgeawnioeagneagnengeagmromrntdrs",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: store,
    resave: true,
    saveUninitialized: true,
  })
);

// Setting  Uploading Directory

app.set("view engine", "ejs");
app.set("views", require("path").join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ======================================
// Requests Starts
// ======================================

// Register Request
app.get("/register", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    const alert = req.query.alert;
    res.render("register/index", { alert });
  }
});

// Insert New Data
app.post("/register", (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = md5(req.body.password);

  UserModel.find({ username }, (request, result) => {
    if (!result.username === false) {
      res.redirect("/?alert=This username is not available!");
    } else {
      const newUser = new UserModel({
        username: username,
        email: email,
        password: password,
      });

      newUser.save().then(() => {
        UserModel.find({ username }, (cookieReq, cookieRes) => {
          req.session.user = cookieRes._id;
        }).then( 
          ADMIN.updateOne({}, {$inc: {totalMembers: 1}, $inc: {membersToday: 1}}, (req, resUpdate) => {}) 
        );
      });

      // Redirecting to main page
      res.redirect("/");
    }
  });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = md5(req.body.password);
  const isValidate = validator.validate(email);

  if (isValidate === false) {
    res.redirect("/?alert=Email is not validated!");
  } else {
    UserModel.find({ email }, (request, result) => {
      if (result.length > 0) {
          if (password == result[0].password) {
            req.session.user = result[0]._id;
            res.redirect("/");
          } else {
            res.redirect("/?alert=Incorrect password!");
          }
      } else {
        res.redirect("/?alert=User doesn't exist!");
      }
    });
  }
});

// Logout Request
app.get("/logout", (req, res) => {
  if (req.session.user) {
    req.session.destroy();
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});

// Home Page
app.get("/", (req, res) => {
  if (req.session.user) {
    const alert = req.query.alert;

    UserModel.findById(req.session.user, (request, result) => {
      res.render("index", {
        status: "logged",
        username: result.username,
        avatar: result.avatar,
        alert,
      });
    });
  } else {
    const alert = req.query.alert;
    res.render("index", { status: "out", alert });
  }
});

// Channel Page
app.get("/channel", (req, res) => {
  const channelOwner = req.query.name;
  if (req.session.user) {
    UserModel.findById(req.session.user, (request, result) => {
      if (!channelOwner) {
        VideoModel.find(
          { owner: result.username},
          (videoReq, videoInfo) => {
            res.render("channel/index", {
              status: "logged",
              username: result.username,
              channel: result,
              channelAvatar: result.avatar,
              channelBanner: result.banner,
              channelName: result.username,
              channelID: result._id,
              channelSubs: result.subscribers,
              channelVideos: videoInfo,
              avatar: result.avatar,
              user: result,
            });
          }
        );
      } else {
        UserModel.find({ username: channelOwner }, (request, Channelresult) => {
          if (!Channelresult[0]) {
            res.redirect("/?alert=Channel Doesn't exist");
          } else {
            VideoModel.find({ owner: channelOwner }, (videoReq, videoInfo) => {
              res.render("channel/index", {
                status: "logged",
                username: result.username,
                avatar: result.avatar,
                channel: Channelresult[0],
                channelAvatar: Channelresult[0].avatar,
                channelBanner: result.banner,
                channelName: Channelresult[0].username,
                channelSubs: Channelresult[0].subscribers,
                channelVideos: videoInfo,
                channelID: Channelresult[0]._id,
                user: result,
              });
            });
          }
        });
      }
    });
  } else {
    const alert = req.query.alert;

    if (!channelOwner) {
      res.redirect("/?alert=You Must be logged in to view your channel!");
    } else {
      UserModel.find({ username: channelOwner }, (request, result) => {
        if (result.length < 1) {
          res.redirect("/?alert=Channel Doesn't exist");
        } else {
          VideoModel.find({ owner: channelOwner }, (videoReq, videoInfo) => {
            res.render("channel/index", {
              status: "out",
              username: "User",
              channelAvatar: result[0].avatar,
              channelBanner: result.banner,
              channelName: result[0].username,
              channelSubs: result[0].subscribers,
              channelVideos: videoInfo,
              channelID: result[0]._id,
            });
          });
        }
      });
    }
  }
});

// Channel Settings
app.get("/channel/settings", (req, res) => {
  if (req.session.user) {
    UserModel.findById(req.session.user, (request, result) => {
      res.render("channel/settings/index", {
        status: "logged",
        username: result.username,
        avatar: result.avatar,
        user: result,
      });
    });
  } else {
    const alert = req.query.alert;

    res.redirect(
      "/?alert=You Must be logged in to view your channel settings!"
    );
  }
});

// Apply new settings
app.post("/channel/settings", (req, res) => {
  var alert;
  if (req.session.user !== undefined) {
    UserModel.findById(req.session.user, (request, result) => {
      // Changing Username
      console.log(req.body);
      if (req.body.username) {
        const username = req.body.username;
        if (result.username !== username) {
          UserModel.find({ username }, (request, viewResult) => {
            if (viewResult.length < 1 && viewResult.username != username) {
              if (username != result.username) {
                UserModel.updateOne(
                  { _id: result._id },
                  { username },
                  (req, res) => {
                    VideoModel.updateMany(
                      { owner: result.username },
                      { owner: username },
                      (req, res) => {}
                    );
                  }
                );
              }
            } else {
              res.redirect(
                "/?alert=Username Already Exists, please choose another name!"
              );
              alert = "hey";
            }
          });
        }
      }

      // Changing Password
      if (req.body.newPass) {
        const newPass = md5(req.body.newPass);

        if (req.body.oldPass) {
          const oldPass = md5(req.body.oldPass);
          if (oldPass != result.password) {
            res.redirect("/?alert=You current password isn't corrent!");
            alert = "hey";
          } else {
            UserModel.updateOne(
              { _id: result._id },
              { password: newPass },
              (req, res) => {}
            );
          }
        } else {
          res.redirect("/?alert=Please Enter your current password!");
          alert = "hey";
        }
      }

      if (req.body.paypal) {
        const paypal = req.body.paypal;
        if (paypal != result.paypal) {
          UserModel.find({}, (request, paypalRes) => {
            if (paypalRes.length > 0 && paypalRes._id != req.session.user) {
              UserModel.updateOne(
                { _id: result._id },
                { paypal },
                (req, changes) => {
                  console.log(changes);
                }
              );
            } else {
              res.redirect(
                "/?alert=There is already an account with this paypal email!"
              );
              alert = "hey";
            }
          });
        }
      }

      // Redirect
      if (alert == "hey") {
        res.redirect("/channel/settings");
      }
    });
  }
});

// Channel pictures change
app.post("/channel/settings/upload-imgs", (req, res) => {
  if (req.session.user) {
    UserModel.findById(req.session.user, (request, result) => {
      // Changing Channel Picture
      const storage = multer.diskStorage({
        destination: "./public/imgs/avatar/",
        filename: function (req, file, callback) {
          callback(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
          );
        },
      });

      const upload = multer({
        storage: storage,
      }).single("channelPicture");

      upload(req, res, (err) => {
        if (err) {
          throw err;
        } else {
          if (req.file) {
            UserModel.updateOne(
              { _id: result._id },
              { avatar: req.file.filename },
              (req, updateRes) => {
                res.redirect("/channel/settings");
              }
            );
          }
        }
      });
    });
  }
});

// Upload a new Banner
app.post("/channel/settings/upload-banner", (req, res) => {
  UserModel.findById(req.session.user, (request, result) => {
    const Storage = multer.diskStorage({
      destination: "./public/imgs/avatar/",
      filename: function (req, file, callback) {
        callback(
          null,
          file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
      },
    });
    const UploadBanner = multer({
      storage: Storage,
    }).single("channelBanner");
    UploadBanner(req, res, (err) => {
      if (err) {
        throw err;
      } else {
        if (req.file) {
          UserModel.updateOne(
            { _id: result._id },
            { banner: req.file.filename },
            (req, updateRes) => {
              res.redirect("/channel/settings");
            }
          );
        }
      }
    });
  });
});

// Video View
app.get("/trending", (req, res) => {
  if (req.session.user) {
    UserModel.findById(req.session.user, (request, result) => {
      res.render("trending/index", {
        status: "logged",
        username: result.username,
        avatar: result.avatar,
      });
    });
  } else {
    const alert = req.query.alert;

    res.render("trending/index", { status: "out", alert });
  }
});

// Admin panel
app.get("/admin", (req,res) => { 
    if(req.session.user) {
      UserModel.findById(req.session.user, (request, result) => { 
        if(result.admin === true){
          ADMIN.find({}, (req,adminRes) => {
            UserModel.find({active: false}, (req, res1) => {
              VideoModel.find({status: false}, (req, res2) => {
                res.render("admin/index", {
                  status: "logged",
                  user: result,
                  result: adminRes[0],
                  pendingUsers: res1.length ,
                  pendingVideos: res2.length,                 
                })
              })
            })
          })
        } else {
          res.redirect("/",  {alert: ""})
        }
      })
    } else {
      res.redirect("/", {alert: ""})
    }
})

app.get("/admin/applications", (req,res) => { 
  if(req.session.user) {
    UserModel.findById(req.session.user, (request, result) => { 
      if(result.admin === true){
        ADMIN.find({}, (req,adminRes) => {
          Applications.find({}, (req, res1) => {
              res.render("admin/applications/index", {
                status: "logged",
                user: result,
                result: adminRes[0],
                apps: res1 ,            
            })
          })
        })
      } else {
        res.redirect("/",  {alert: ""})
      }
    })
  } else {
    res.redirect("/", {alert: ""})
  }
})

app.get("/admin/videos", (req,res) => { 
  if(req.session.user) {
    UserModel.findById(req.session.user, (request, result) => { 
      if(result.admin === true){
        ADMIN.find({}, (req,adminRes) => {
            VideoModel.find({status: false}, (req, res2) => {
              res.render("admin/videos/index", {
                status: "logged",
                user: result,
                result: adminRes[0],
                videos: res2,                 
            })
          })
        })
      } else {
        res.redirect("/",  {alert: ""})
      }
    })
  } else {
    res.redirect("/", {alert: ""})
  }
})

app.post("/CCFProgramSubmit", (req,res) =>{
  UserModel.findById(req.session.user, (request,result) => {
    if(result.CCFProgram === true) {
      res.send({success: true, msg:"Program is active."})
    } else {
      Applications.find({userID: result._id}, (request,appRes) => {
        if (appRes.length > 0){ 
          res.send({success: false, msg:"You have an application submited."})
        } else { 
          var newapplication = new Applications({
            userID: result._id,
            name: req.body.name,
            email: result.email,
            birthday: req.body.birthday,
            country: req.body.country,
            paypal: req.body.paypal,
          }) 

          newapplication.save()

          ADMIN.updateOne({}, {$inc: {totalApplications: 1, applicationsToday: 1}}, (req,UpdateRes) => {})
          res.send({success: true, msg:"Success!"})
        }
      })
    }
  })
})

app.get("/approveUser/:id",(req,res) => {
  var id = req.params.id;
  if(req.session.user){
    UserModel.findById(req.session.user, (req,result) => {
      if(result.admin === true) {
        Applications.find({_id: id}, (req,appRes) => {
          UserModel.updateOne({_id: appRes[0].userID}, {CCFProgram: true}, (req,updateRES) => {})
          Applications.deleteOne({_id: id}, (req,updateRES) => { console.log(updateRES)})
                  
          res.redirect("/admin/applications")
        })
      } else {
        res.redirect("/", {alert: "Wrong URL"})
      }
    })
  } else {
    res.redirect("/", {alert: "Wrong URL"})
  }
})

app.get("/declineUser/:id",(req,res) => {
  var id = req.params.id;
  if(req.session.user){
    UserModel.findById(req.session.user, (req,result) => {
      if(result.admin === true) {
        Applications.deleteOne({_id: id}, (req,updateRES) => {})

        res.redirect("/admin/applications")
      } else {
        res.redirect("/", {alert: "Wrong URL"})
      }
    })
  } else {
    res.redirect("/", {alert: "Wrong URL"})
  }
})

app.get("/approveVideo/:id",(req,res) => {
  var id = req.params.id;
  if(req.session.user){
    UserModel.findById(req.session.user, (req,result) => {
      if(result.admin === true) {

        VideoModel.updateOne({_id: id}, {status: true}, (req,updateRES) => {})
        res.redirect("/admin/videos")
      } else {
        res.redirect("/", {alert: "Wrong URL"})
      }
    })
  } else {
    res.redirect("/", {alert: "Wrong URL"})
  }
})

app.get("/declineVideo/:id",(req,res) => {
  var id = req.params.id;
  if(req.session.user){
    UserModel.findById(req.session.user, (req,result) => {
      if(result.admin === true) {

        VideoModel.deleteOne({_id: id}, (req,updateRES) => {}).then(
          ADMIN.updateOne({}, {$inc : {totalVideos: -1}}, (req, resUpdate) => {}) 
        )
        
        res.redirect("/")
      } else {
        res.redirect("/", {alert: "Wrong URL"})
      }
    })
  } else {
    res.redirect("/", {alert: "Wrong URL"})
  }
})

// Profile Editor
app.get("/watch", (req, res) => {
  const viewKey = req.query.viewKey;
  const sessionCheck = req.session.user || 0;

  if (!viewKey) {
    res.redirect("/");
  } else {
    VideoModel.findById(viewKey, (req, videoRes) => {
      if (!videoRes === false) {
        UserModel.findById(videoRes.channelID, (req, channel) => {
          if (sessionCheck != 0) {
            UserModel.findById(sessionCheck, (request, result) => {
              var owner = channel.owner == result.username ? true : false
              res.render("watch/index", {
                status: "logged",
                user: result,
                admin: result.admin,
                owner,
                userID: sessionCheck,
                videoID: viewKey,
                username: result.username,
                avatar: result.avatar,
			        	ChannelAvatar: channel.avatar,
                videoTitle: videoRes.title,
                videoUUID: videoRes.uuid,
                videoOwner: videoRes.owner,
                videoLikes: videoRes.likes,
                videoDislikes: videoRes.dislikes,
                videoPublished: videoRes.published,
                videoTags: videoRes.tags,
                videoViews: videoRes.views,
                videoDescription: videoRes.description,
                videoSubscribers: channel.subscribers,
                channelID: videoRes.channelID,
              });

              if (!result.history.includes(viewKey)) {
                UserModel.updateMany(
                  { _id: result._id },
                  { $push: { history: viewKey } },
                  (req, res) => {}
                );
                // Updating Video Views
                VideoModel.updateOne(
                  { _id: viewKey },
                  { $inc: { views: +1 } },
                  (req, res) => {}
                );
                ADMIN.updateOne(
                  { },
                  { $inc: { TodayViews:  +1 },  },
                  (req, result) => {}
                );

                // if (result.history.length > 150) {
                //   UserModel.updateOne(
                //     { _id: result._id },
                //     { $pop: { history: -1 } },
                //     (req, res) => {}
                //   );
                // }
              }
            });
          } else {
            UserModel.find({ username: videoRes.owner }, (req, result) => {
              res.render("watch/index", {
                status: "out",
                admin: false,
                userID: null,
                videoID: viewKey,
                videoTitle: videoRes.title,
                videoUUID: videoRes.uuid,
                videoOwner: videoRes.owner,
                videoLikes: videoRes.likes,
                videoDislikes: videoRes.dislikes,
                videoPublished: videoRes.published,
                videoTags: videoRes.tags,
                videoComments: videoRes.comments,
                videoViews: videoRes.views,
                videoDescription: videoRes.description,
                videoSubscribers: channel.subscribers,
                avatar: result[0].avatar,
                user: undefined,
                channelID: videoRes.channelID,
                owner: false
              });
            });
          }
        });
      } else {
        res.redirect("/?alert=Video doesn't exist!");
      }
    });
  }
});

// History Page
app.get("/history", (req, res) => {
  if (req.session.user) {
    UserModel.findById(req.session.user, (request, result) => {
      res.render("history/index", {
        status: "logged",
        username: result.username,
        avatar: result.avatar,
        user: result,
      });
    });
  } else {
    res.redirect("/?alert=You must be logged in to view your history!");
  }
});

// Catagories
app.get("/catagory", (req, res) => {
  const query = req.query.q;

  if (!query) {
    app.redirect("/");
  } else {
    let status;

    function checkUser() {
      if (req.session.user) {
        return "logged";
      } else {
        return "out";
      }
    }

      if (req.session.user) {
        UserModel.findById(req.session.user, (req, result) => {

          if (query == "gaming") {
            VideoModel.find({ tags: "Gaming" })
              .sort({ published: -1 })
              .exec((req, result) => {
                res.render("catagory/index", {
                  title: "Gaming",
                  result,
                  status: checkUser(),
                  avatar: result.avatar,
                  username: result.username
                });
              });
          } else if (query == "comedy") {
            VideoModel.find({ tags: "Comedy" })
              .sort({ published: -1 })
              .exec((req, result) => {
                res.render("catagory/index", {
                  title: "Comedy",
                  result,
                  status: checkUser(),
                  avatar: result.avatar,
                  username: result.username
                });
              });
          } else if (query == "vlogs") {
            VideoModel.find({ tags: "Vlogs" })
              .sort({ published: -1 })
              .exec((req, result) => {
                res.render("catagory/index", {
                  title: "Vlogs",
                  result,
                  status: checkUser(),
                  avatar: result.avatar,
                  username: result.username
                });
              });
          } else if (query == "academy") {
            VideoModel.find({ tags: "Academy" })
              .sort({ published: -1 })
              .exec((req, result) => {
                res.render("catagory/index", {
                  title: "Academy",
                  result,
                  status: checkUser(),
                  avatar: result.avatar,
                  username: result.username
                });
              });
          }

        });
      } else {
        if (query == "gaming") {
          VideoModel.find({ tags: "Gaming" })
            .sort({ published: -1 })
            .exec((req, result) => {
              res.render("catagory/index", {
                title: "Gaming",
                result,
                status: checkUser(),
                avatar: ""
              });
            });
        } else if (query == "comedy") {
          VideoModel.find({ tags: "Comedy" })
            .sort({ published: -1 })
            .exec((req, result) => {
              res.render("catagory/index", {
                title: "Comedy",
                result,
                status: checkUser(),
                avatar: "",
              });
            });
        } else if (query == "vlogs") {
          VideoModel.find({ tags: "Vlogs" })
            .sort({ published: -1 })
            .exec((req, result) => {
              res.render("catagory/index", {
                title: "Vlogs",
                result,
                status: checkUser(),
                avatar: "",
              });
            });
        } else if (query == "academy") {
          VideoModel.find({ tags: "Academy" })
            .sort({ published: -1 })
            .exec((req, result) => {
              res.render("catagory/index", {
                title: "Academy",
                result,
                status: checkUser(),
                avatar: "",
              });
            });
        }

      }

    }
});

// New Reaction
app.post("/newReaction", (req, res) => {
  const user = req.body.user;
  const videoID = req.body.id;
  const reaction = req.body.reaction;
  if (user !== null) {
    if (reaction == "like") {
      UserModel.findById(user, (req, result) => {
        if (result.likedVideos.includes(videoID)) {
          // If Yes
          UserModel.updateOne(
            { _id: user },
            { $pull: { likedVideos: videoID } },
            (req, result) => {}
          );
          VideoModel.updateOne(
            { _id: videoID },
            { $inc: { likes: -1 } },
            (req, result) => {}
          );
          ADMIN.updateOne(
            { },
            { $inc: { Todaylikes:  -1 } },
            (req, result) => {}
          );
        } else {
          // if No
          UserModel.updateOne(
            { _id: user },
            { $push: { likedVideos: videoID } },
            (req, result) => {}
          );
          ADMIN.updateOne(
            { },
            { $inc: { Todaylikes:  1 } },
            (req, result) => {}
          );
          VideoModel.updateOne(
            { _id: videoID },
            { $inc: { likes: 1 } },
            (req, result) => {}
          );
        }

        if (result.dislikedVideos.includes(videoID)) {
          UserModel.updateOne(
            { _id: user },
            { $pull: { dislikedVideos: videoID } },
            (req, result) => {}
          );
          VideoModel.updateOne(
            { _id: videoID },
            { $inc: { dislikes: -1 } },
            (req, result) => {}
          );
        }
      });
    } else {
      UserModel.findById(user, (req, result) => {
        if (result.dislikedVideos.includes(videoID)) {
          // If Yes
          UserModel.updateOne(
            { _id: user },
            { $pull: { dislikedVideos: videoID } },
            (req, result) => {}
          );
          VideoModel.updateOne(
            { _id: videoID },
            { $inc: { dislikes: -1 } },
            (req, result) => {}
          );
        } else {
          // if No
          UserModel.updateOne(
            { _id: user },
            { $push: { dislikedVideos: videoID } },
            (req, result) => {}
          );

          VideoModel.updateOne(
            { _id: videoID },
            { $inc: { dislikes: 1 } },
            (req, result) => {}
          );
        }

        if (result.likedVideos.includes(videoID)) {
          UserModel.updateOne(
            { _id: user },
            { $pull: { likedVideos: videoID } },
            (req, result) => {}
          );

          VideoModel.updateOne(
            { _id: videoID },
            { $inc: { likes: -1 } },
            (req, result) => {}
          );
        }
      });
    }
  }
});

// COMMENTS SECTION
// New Comment
app.post("/newComment", (req, res) => {
  const user = req.body.user;
  const videoID = req.body.id;
  const content = req.body.content;

  if (user !== null) {
    const newComment = new CommentsModel({
      id: videoID, // Video ID
      owner: user, // Comment Owner
      content,
    });
    newComment.save();
  }
});

// New Subscribe Request
app.post("/channel/subscribe", (req, res) => {
  const backURL = req.header("Referer") || "/";
  const channelID = req.body.channel;

  if (req.session.user) {
    UserModel.findById(req.session.user, (req, result) => {
      if (!result.subscribed.includes(channelID)) {
        if (channelID != result._id) {
          // Updating User
          UserModel.updateOne(
            { _id: result._id },
            { $push: { subscribed: channelID } },
            (req, changes) => {
              console.log(changes);
            }
          );
          ADMIN.updateOne(
            { },
            { $inc: { TodaySubs:  +1 } },
            (req, result) => {}
          );

          // Updating the Channel
          UserModel.updateOne(
            { _id: channelID },
            { $inc: { subscribers: +1 } },
            (req, changes) => {
              console.log(changes);

              res.redirect(backURL);
            }
          );
        } else {
          res.redirect("/?alert=You subscribe to yourself!");
        }
      } else {
        if (channelID != result._id) {
          // Updating User
          UserModel.updateOne(
            { _id: result._id },
            { $pull: { subscribed: channelID } },
            (req, changes) => {
              console.log(changes);
            }
          );

          ADMIN.updateOne(
            { },
            { $inc: { TodaySubs:  -1 } },
            (req, result) => {}
          );
          // Updating the Channel
          UserModel.updateOne(
            { _id: channelID },
            { $inc: { subscribers: -1 } },
            (req, changes) => {
              console.log(changes);

              res.redirect(backURL);
            }
          );
        } else {
          res.redirect("/?alert=You subscribe to yourself!");
        }
      }
    });
  } else {
    res.redirect("/?alert=You log into an account to subscribe!");
  }
});

// New Video [Upload]
app.post("/upload", (req, res) => {
  if (req.session.user) {
    UserModel.findById(req.session.user, (request, result) => {

      const storage = multer.diskStorage({
        destination: "./public/data/",
        filename: function (req, file, callback) {
          callback(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
          );
        },
      });

      const Upload = multer({
        storage: storage,
      }).fields([{ name: "video" }, { name: "thumbnail" }]);

      Upload(req, res, (err) => {
        if (err) {
          throw err;
        } else {
          let video = req.files.video[0].filename;

          let thumbnail = "";
          if (req.files.thumbnail) {
            thumbnail = req.files.thumbnail[0].filename;
          }

          let tags = req.body.tags;
          let title = req.body.title;
          let description = req.body.description;

          // Securing
          tags = tags.replace(/[^a-zA-Z ]/g, "");
          tags = tags.split(" ");
          title = title.replace(/[^a-zA-Z ]/g, "");
          description = description.replace(/[^a-zA-Z ]/g, "");

          const newVideo = new VideoModel({
            uuid: video,
            owner: result.username,
            channelID: result._id,
            title,
            tags,
            thumbnail,
            description,
          });

          newVideo.save().then(
             ADMIN.updateOne({}, {$inc: {totalVideos: 1}, $inc: {videosToday: 1}}, (req, resUpdate) => {}).then(
              UserModel.updateOne({_id: result._id}, {notifications: true}, (req, resUpdate) => {}) 
             )
          );
          res.redirect("/");
        }
      })
    });
  } else {
    res.redirect("/?alert=Please login to upload!");
  }
});

// CHECK IF VIDEO HAS BEEN UPLOADED
app.post("/checkVideo", (req,res) => {
    var user = req.body.user  
    console.log(user)

    UserModel.find({username: user}, (req,result) => {
      if(result[0].notifications === true) {
        res.send({success: true, msg: "Successfully Uploaded!"})

        UserModel.updateOne({_id: result[0]._id}, {notifications: false}, (req, resUpdate) => {})
      } else {
        res.send({success: false, msg: "Uploading..."})
      }
    })
})

// ==================
// Search Engine
// ==================
app.get("/search", (req, res) => {
  const query = req.query.q || "";

  if (query) {
    // Searching Engine
    VideoModel.find(
      { title: { $regex: `.*${query}.*`, $options: "i" } },
      (request, videos) => {
        if (req.session.user) {
          UserModel.findById(req.session.user, (req, result) => {
            res.render("search/index", {
              status: "logged",
              avatar: result.avatar,
              username: result.username,
              query,
              videos,
            });
          });
        } else {
          res.render("search/index", {
            status: "out",
            query,
            videos,
          });
        }
      }
    );
  } else {
    res.send("No query detected!");
  }
});

// API
// GET Comments
app.get("/getComments", (req, res) => {
  const viewKey = req.query.viewKey;

  if (!viewKey) {
    res.send("Please Enter the View key!");
  } else {
    CommentsModel.find({ id: viewKey }, (req, result) => {
      res.send(result);
    });
  }
});
// GET user
app.get("/getUser", (req, res) => {
  const userID = req.query.userID;

  if (!userID) {
    res.send("Please Enter the UserID!");
  } else {
    UserModel.findById(userID, (req, result) => {
      res.send(result);
    });
  }
});
// GET Comments
app.get("/getVideos", (req, res) => {
  const method = req.query.method;
  if (!method) {
    VideoModel.find({status:true})
      .limit(8)
      .sort({ published: -1 })
      .exec(function (err, videos) {
        res.send(videos);
      });
  } else if (method == "trending") {
    VideoModel.find({status:true})
      .limit(12)
      .sort({ views: -1 })
      .exec(function (err, posts) {
        res.send(posts);
      });
  } else if (method == "upnext") {
    const viewKey = req.query.viewKey;

    VideoModel.findById(viewKey)
      .limit(3)
      .sort({ views: -1 })
      .exec(function (err, posts) {
        VideoModel.find({status:true})
          .limit(18)
          .exec(function (err, result) {
            res.send([posts, result]);
          });
      });
  } else if (method == "catagory") {
    if (!req.query.mode || !req.query.section) {
      res.send("given 1 Parameter while expected 2!");
    } else {
      if (req.query.mode == "recent") {
        VideoModel.find({ tags: req.query.section })
          .limit(12)
          .sort({ published: -1 })
          .exec(function (err, posts) {
            res.send(posts);
          });
      } else if (req.query.mode == "top") {
        VideoModel.find({ tags: req.query.section })
          .limit(8)
          .sort({ views: -1 })
          .exec(function (err, posts) {
            res.send(posts);
          });
      } else {
        res.send("Unknown Mode!");
      }
    }
  } else {
    VideoModel.find({status:true})
      .limit(16)
      .sort({ published: 1 })
      .exec(function (err, videos) {
        res.send(videos);
      });
  }
});

// GET Content Creators
app.get("/getContentCreators", (req, res) => {
  UserModel.find({})
    .limit(12)
    .sort({ subscribers: -1 })
    .exec(function (err, creators) {
      res.send(creators);
    });
});

//===============================
// PAYMENT SYSTEM SET UP
//===============================
paypal.configure({
  mode: "live",
  client_id:
    "AfKuek29_y55dM8B2terztL0Neov90ebEOKel8vXJ01CCf3M6bcSV1uk445bK8YetguGBJ54o8RwxtMp",
  client_secret:
    "EFA8lpt19jGqARYW78R5Gux8VvKLacvWEa_-CnhrmF3rkDss9l1Ywx8lMCnoGszz5to_F9SiHGGckRjY",
});

app.post("/payment/pay", (req, res) => {
  // Get Package Name
  const channel = req.body.channel;
  const amount = req.body.amount;
  const theMessage = req.body.message;
  const senderEmail = req.body.email;

  console.log(channel);
  console.log(amount);
  console.log(theMessage);
  console.log(senderEmail);

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url:
        "http://localhost/payment/success?amount=" +
        amount +
        "&channel=" +
        channel,
      cancel_url: "http://localhost/payment/cancel",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: senderEmail,
              sku: "001",
              price: amount + ".00",
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: amount + ".00",
        },
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.post("/updateAdminPanel", (req,res) => {
  ADMIN.find({}, (req,result) => {
    ADMIN.updateOne({}, {
      "WeeklyVideos.a": result.WeeklyVideos.a ,
      "WeeklyVideos.b": result.WeeklyVideos.b ,
      "WeeklyVideos.c": result.WeeklyVideos.c ,
      "WeeklyVideos.d": result.WeeklyVideos.d ,
      "WeeklyVideos.e": result.WeeklyVideos.e ,
      "WeeklyVideos.f": result.WeeklyVideos.f ,
      "WeeklyVideos.g": result.WeeklyVideos.g ,
     
      "WeeklyMembers.a": result.WeeklyMembers.a ,
      "WeeklyMembers.b": result.WeeklyMembers.b ,
      "WeeklyMembers.c": result.WeeklyMembers.c ,
      "WeeklyMembers.d": result.WeeklyMembers.d ,
      "WeeklyMembers.e": result.WeeklyMembers.e ,
      "WeeklyMembers.f": result.WeeklyMembers.f ,
      "WeeklyMembers.g": result.WeeklyMembers.g ,
      
      Todaylikes: 0,
      TodayViews: 0,
      TodaySubs: 0,
      videosToday: 0,
      applicationsToday: 0,
      
    }, (req,resUPDATE) => {})
  })

})

// If Success
app.get("/payment/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const channel = req.query.channel;
  const amount = req.query.amount;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: amount + ".00",
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));
      }
    }
  );

  UserModel.updateOne(
    { username: channel },
    { wallet: amount },
    (request, result) => {
      // Return user
      res.redirect("/");
    }
  );
});

// Successful message
app.get("/successful", (req, res) => {
  console.log("DonE!!!!");
  res.send(
    "<h2 style='text-align:center;margin:20px auto'>You have successfuly bought the item</h2>"
  );
});
app.get("/payment/cancel", (req, res) => res.redirect("/"));

// Testing Page
app.get("/test", (req, res) => {
//  var newADMIN = new ADMIN({
//   applicationsToday: 0,
//   videosToday: 0,
//   WeeklyVideos: {a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0},
//   WeeklyMembers: {a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0},
//  })

//  newADMIN.save()
});

// 404 Pages
app.use((req, res) => {
  res.status(404).end("Page Not Found 404");
});

app.listen(80);
