/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
const validator = require('validator');
const uuid = require('uuid/v4');

const postsData = require('../data/postsData');
const usersController = require('./usersController');
const episodesController = require('./episodesController');
const mailgun = require('../utilities/mailgun');

function createPost(postData, cb) {
  const newPost = postData;
  episodesController.findOrCreateEpisodeWithShareURL(
    newPost.shareURL,
    (err, episode) => {
      if (err) cb(err, null);
      // check if user has already posted this episode
      let alreadyPosted = false;
      newPost.byUser.posts.forEach(post => {
        if (!alreadyPosted && episode.id === post.episode.id) {
          alreadyPosted = true;
          if (post.updatedAt >= Date.now() - 24 * 60 * 60 * 1000) {
            // if in the last day, do nothing
            // cb(null, post);
            const error = new Error(
              'You have already posted that episode within the last 24 hours'
            );
            error.status = 400;
            cb(error, null);
          } else {
            // update post time to now
            postsData.updatePost(
              { $currentDate: { updatedAt: true } },
              post,
              (err, post) => {
                if (err) cb(err, null);
              }
            );
          }
        }
      });
      if (!alreadyPosted) {
        newPost.episode = episode;
        postsData.addNewPost(newPost, (err, post) => {
          if (err) cb(err, null);
          // TODO log post
          // get back to the user quickly with cb first
          cb(null, post);
          // but also add post reference to User
          usersController.addPostByUser(post, newPost.byUser, (err, user) => {
            if (err) {
              console.log(
                `failed to add post ${post} to user ${user}'s posts array`
              );
            }
          });
          // and add post reference to Episode
          episodesController.addPostOfEpisode(post, episode, (err, ep) => {
            if (err) {
              console.log(
                `failed to add post ${post} to episode ${episode}'s posts array`
              );
            }
          });
        });
      }
    }
  );
}

module.exports = {
  getNewPost(req, res, next) {
    if (!req.user) {
      res.redirect('/');
    } else {
      res.render('posts/post', {
        currentUser: req.user,
        csrfToken: req.csrfToken()
      });
    }
  },
  addNewPostViaWeb(req, res, next) {
    // should send HTTP 201 on success
    // 401 for unauthorized
    // 500 on internal failure or 501 for podcast app not implemented
    const postData = req.body;

    if (!validator.isURL(postData.shareURL)) {
      return res.status(400).send('No share URL in post');
    }

    return usersController.findUserByIdWithPosts(
      req.user.id,
      (err, userWithPosts) => {
        const newPostData = {
          byUser: userWithPosts,
          shareURL: postData.shareURL,
          comment: postData.comment,
          guid: uuid()
        };
        return createPost(newPostData, (err, post) => {
          if (err) {
            if (err.status === 400) {
              req.session.error = err.message;
              return res.status(400).redirect(`/u/${req.user.username}`);
            }
            return next(err);
          }
          return res.status(201).redirect(`/u/${req.user.username}`);
        });
      }
    );
  },
  addNewPostViaMailgun(req, res, next) {
    // should send HTTP 201 on success
    // 401 for unauthorized
    // 500 on internal failure or 501 for podcast app not implemented
    const postJson = req.body;
    // ensure post from mailgun
    mailgun.confirmSignature(
      postJson.token,
      postJson.timestamp,
      postJson.signature,
      (err, confirmed) => {
        if (err) {
          return next(err);
        }
        if (!confirmed) {
          // Unauthorized
          return res.status(401).send('Unauthorized access');
        }

        // lookup user by tag
        const tag = postJson.recipient.split('@')[0].split('+')[1];
        return usersController.findUserByTag(tag, (err, postingUser) => {
          if (err) {
            return next(err);
          }
          if (postingUser === null) {
            const error = 'No such user';
            return next(error, null);
          }
          let inputURL;
          const strippedText = postJson['stripped-text'];
          try {
            inputURL = strippedText
              .slice(strippedText.indexOf('http'))
              .split(/\s/)[0]
              .trim();
            if (!validator.isURL(inputURL)) {
              return res.status(400).send('No share URL');
            }
          } catch (error) {
            return res.status(400).send('No share URL');
          }

          const newPostData = {
            byUser: postingUser,
            shareURL: inputURL,
            comment: strippedText.split(inputURL).join('\n'),
            guid: uuid(),
            email: {
              fromAddress: postJson.sender,
              subject: postJson.subject,
              bodyHTML: postJson['body-html'],
              bodyPlainText: postJson['body-plain']
            }
          };
          // eslint-disable-next-line no-shadow
          return createPost(newPostData, (err, post) => {
            if (err) next(err);
            res.status(201).send();
          });
        });
      }
    );
  },
  updatePost(req, res, next) {},
  deletePost(req, res, next) {
    // req.query.p === post.id
    const postId = req.query.p;
    if (typeof postId !== 'string' || !validator.isHexadecimal(postId)) {
      // invalid post ID
      res.redirect(req.get('Referrer') || '/');
    } else {
      postsData.deletePost({ _id: postId, byUser: req.user.id }, err => {
        if (err) next(err);
        res.status(200).redirect(`/u/${req.user.username}`);
        // pull from episode posts array
        episodesController.removePostOfEpisode(postId, (err, episode) => {
          if (err) {
            console.log(
              `failed to delete post ${postId} from episode ${episode}'s posts array`
            );
          }
        });
        // pull from user's posts array
        usersController.removePostByUser(postId, req.user, (err, user) => {
          if (err) {
            console.log(
              `failed to delete post ${postId} from user ${user}'s posts array`
            );
          }
        });
      });
    }
  }
};
