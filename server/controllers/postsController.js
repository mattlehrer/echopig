/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
const validator = require('validator');
const { validationResult } = require('express-validator/check');
const uuid = require('uuid/v4');
const shortid = require('shortid');

const logger = require('../utilities/logger')(__filename);
const postsData = require('../data/postsData');
const usersController = require('./usersController');
const episodesController = require('./episodesController');
const mail = require('../utilities/email');

function createPost(postData, cb) {
  const newPost = postData;
  episodesController.findOrCreateEpisodeWithShareURL(
    newPost.shareURL,
    (err, episode) => {
      if (err) {
        logger.error(err);
        cb(err, null);
        return;
      }
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
            logger.debug(`updating post ${post.id}`);
            postsData.updatePost(
              post,
              { $currentDate: { updatedAt: true } },
              (err, post) => {
                if (err) cb(err, null);
                else cb(null, post);
              }
            );
          }
        }
      });
      if (!alreadyPosted) {
        newPost.episode = episode;
        postsData.addNewPost(newPost, (err, post) => {
          if (err) cb(err, null);
          // logger.debug(`added post: ${post}`);
          // add post reference to User
          usersController.addPostByUser(post, newPost.byUser, (err, user) => {
            if (err) {
              logger.alert(
                `failed to add post ${post} to user ${user}'s posts array`
              );
            }
          });
          // add post reference to Episode
          episodesController.addPostOfEpisode(post, episode, (err, ep) => {
            if (err) {
              logger.alert(
                `failed to add post ${post} to episode ${episode}'s posts array`
              );
            }
          });
          cb(null, post);
        });
      }
    }
  );
}

function cleanTimeframeQuery(query = '') {
  if (validator.isInt(query, { min: 1 })) {
    return query;
  }
  return 24 * 7; // this week
}

module.exports = {
  cp: createPost,
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    const postData = req.body;

    usersController.findUserByIdWithPosts(req.user.id, (err, userWithPosts) => {
      const newPostData = {
        byUser: userWithPosts,
        shareURL: postData.shareURL,
        comment: postData.comment,
        guid: uuid()
      };
      if (err) {
        logger.error(
          `findUserByIdWithPosts error while adding post via web for user: ${
            req.user.username
          } with error: ${err}`
        );
        next(err);
        return;
      }
      createPost(newPostData, (err, post) => {
        if (err) {
          logger.error(
            `Error creating post via web for user: ${
              req.user.username
            } with error: ${err}`
          );
          if (err.status === 400) {
            req.flash('errors', err.message);
            res.status(400).redirect(`/u/${req.user.username}`);
            return;
          }
          next(err);
          return;
        }
        req.flash('info', `${post.episode.title} posted`);
        res.redirect(`/u/${req.user.username}`);
      });
    });
  },
  addNewPostViaMailgun(req, res, next) {
    // should send HTTP 201 on success
    // 401 for unauthorized
    // 500 on internal failure or 501 for podcast app not implemented
    const postJson = req.body;
    // ensure post from mailgun
    if (
      !mail.confirmSignature(
        postJson.token,
        postJson.timestamp,
        postJson.signature
      )
    ) {
      // Unauthorized
      logger.notice('Received request, but not from Mailgun');
      res.status(401).send('Unauthorized access');
      return;
    }

    // find the share URL in the email
    // 'stripped-text' is the email body parsed by Mailgun with signature removed
    let inputURL;
    const strippedText = postJson['stripped-text'];
    try {
      inputURL = strippedText
        .slice(strippedText.indexOf('http'))
        .split(/\s/)[0]
        .trim();
      if (!validator.isURL(inputURL)) {
        logger.notice(
          `received post from mailgun, but without a share URL: ${strippedText}`
        );
        res.status(400).send('No share URL');
        return;
      }
    } catch (error) {
      logger.notice(
        `received post from mailgun, but without a share URL: ${strippedText}`
      );
      res.status(400).send('No share URL');
      return;
    }

    // lookup user by tag
    const tag = postJson.recipient.split('@')[0].split('+')[1];
    if (!shortid.isValid(tag)) {
      logger.notice('received post from mailgun, but without a valid tag');
      res.status(400).send('No such user');
      return;
    }
    usersController.findUserByTag(tag, (err, postingUser) => {
      if (err) {
        logger.error(
          `findUserByTag error while adding post via mail for tag: ${tag} with error: ${err}`
        );
        next(err);
        return;
      }
      if (postingUser === null) {
        res.status(400).send('No such user');
        return;
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
      createPost(newPostData, (err, post) => {
        if (err) {
          logger.error(
            `Error creating post via mail for user: ${
              postingUser.username
            } with error: ${err}`
          );
          next(err);
          return;
        }
        mail.sendWithTemplate(
          'post',
          'Echopig <post@echopig.com>',
          postingUser,
          { user: postingUser, post }
        );
        res.status(201).send();
      });
    });
  },
  updatePost(req, res, next) {},
  deletePost(req, res, next) {
    // req.query.p === post.id
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    const postId = req.query.p;
    postsData.deletePost({ _id: postId, byUser: req.user.id }, err => {
      if (err) {
        // this is almost definitely a user error, changing the postId in the URL
        logger.error(
          `Error deleting post for user: ${
            req.user.username
          } with error: ${err}`
        );
        next(err);
        return;
      }
      res.status(200).redirect(`/u/${req.user.username}`);
      // pull from episode posts array
      episodesController.removePostOfEpisode(postId, (err, episode) => {
        if (err) {
          logger.error(
            `failed to delete post ${postId} from episode ${episode}'s posts array`
          );
        }
      });
      // pull from user's posts array
      usersController.removePostByUser(postId, req.user, (err, user) => {
        if (err) {
          logger.error(
            `failed to delete post ${postId} from user ${user}'s posts array`
          );
        }
      });
    });
  },
  mostPostedEpisodesInTimeframe(req, res, next) {
    const hours = cleanTimeframeQuery(req.query.t);
    const timeframe = hours * 60 * 60 * 1000;
    const since = new Date(Date.now() - timeframe);
    postsData.findMostPostedEpisodesInTimeframe(since, (err, episodes) => {
      if (err) {
        logger.error(err);
        next(err);
        return;
      }
      res.render('episodes/top', {
        currentUser: req.user,
        episodes
      });
    });
  },
  mostPostedEpisodesInGenreInTimeframe(req, res, next) {
    const { genre } = req.params;
    // itunes genres only contain letters, numbers, the space and &
    if (!genre.match(/^[a-z0-9 &]*$/i)) {
      // no such genre
      next();
      return;
    }
    const hours = cleanTimeframeQuery(req.query.t);
    const timeframe = hours * 60 * 60 * 1000;
    const since = new Date(Date.now() - timeframe);
    postsData.findMostPostedEpisodesInGenreInTimeframe(
      genre,
      since,
      (err, episodes) => {
        if (err) {
          logger.error(err);
          next(err);
          return;
        }
        res.render('episodes/topByGenre', {
          currentUser: req.user,
          episodes,
          genre
        });
      }
    );
  }
};
