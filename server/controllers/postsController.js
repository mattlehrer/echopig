/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
const validator = require('validator');
const { validationResult } = require('express-validator/check');
const uuid = require('uuid/v4');

const logger = require('../utilities/logger')(__filename);
const postsData = require('../data/postsData');
const savesData = require('../data/savesData');
const usersController = require('./usersController');
const episodesController = require('./episodesController');
const mail = require('../utilities/email');
const { cleanTimeframeQuery } = require('../utilities/queryUtils');

function createPost(postData, cb) {
  const newPost = postData;
  episodesController.findOrCreateEpisodeWithShareURL(
    newPost.shareURL,
    (err, episode) => {
      if (err) {
        logger.error(JSON.stringify(err));
        cb(err);
        return;
      }
      if (!episode) {
        const err = new Error(
          'We encountered an error on this episode. We have logged the error and will try to do better.'
        );
        logger.error('failed to return an episode on createPost');
        cb(err);
        return;
      }
      // check if user has already posted this episode
      // Apple Podcasts ignores multiple items with same enclosure URL
      // so don't let people post the same episode / mp3 twice
      // See: https://help.apple.com/itc/podcasts_connect/#/itc1723472cb
      let alreadyPosted = false;
      for (let i = 0; i < newPost.byUser.posts.length; i += 1) {
        // eslint-disable-next-line security/detect-object-injection
        const post = newPost.byUser.posts[i];
        if (!alreadyPosted && post.episode && episode.id === post.episode.id) {
          alreadyPosted = true;
          if (post.updatedAt >= Date.now() - 24 * 60 * 60 * 1000) {
            // if in the last day, do nothing
            const error = new Error(
              'You have already posted that episode within the last 24 hours'
            );
            error.status = 409;
            cb(error, null);
            return;
          }
          // update post time to now
          logger.debug(`updating post ${JSON.stringify(post)}`);
          postsData.updatePost(
            post,
            { $currentDate: { updatedAt: true } },
            (err, post) => {
              if (err) {
                cb(err, null);
                return;
              }
              cb(null, post);
            }
          );
        }
      }
      if (!alreadyPosted) {
        newPost.episode = episode;
        postsData.addNewPost(newPost, (err, post) => {
          if (err) {
            cb(err, null);
            return;
          }
          logger.info(
            `New post: ${post.id} of ${post.episode.title} by ${
              post.byUser.username
            }`
          );
          // add post reference to User
          usersController.addPostByUser(post, newPost.byUser, (err, user) => {
            if (err) {
              logger.alert(
                `failed to add post ${JSON.stringify(
                  post
                )} to user ${JSON.stringify(user)}'s posts array`
              );
            }
          });
          // add post reference to Episode
          episodesController.addPostOfEpisode(post, episode, err => {
            if (err) {
              logger.alert(
                `failed to add post ${JSON.stringify(
                  post
                )} to episode ${JSON.stringify(episode)}'s posts array`
              );
            }
          });
          cb(null, post);
        });
      }
    }
  );
}

function createSave(saveData, cb) {
  const newSave = saveData;
  episodesController.findOrCreateEpisodeWithShareURL(
    newSave.shareURL,
    (err, episode) => {
      if (err) {
        logger.error(JSON.stringify(err));
        cb(err, null);
        return;
      }
      if (!episode) {
        const err = new Error(
          'We encountered an error on this episode. We have logged the error and will try to do better.'
        );
        logger.error('failed to return an episode on createPost');
        cb(err, null);
        return;
      }
      newSave.episode = episode;
      savesData.addNewSave(newSave, (err, save) => {
        if (err) {
          cb(err, null);
          return;
        }
        logger.info(
          `New save: ${save.id} of ${save.episode.title} by ${
            save.byUser.username
          }`
        );
        // add save reference to User
        usersController.addSaveByUser(save, newSave.byUser, (err, user) => {
          if (err) {
            logger.alert(
              `failed to add save ${JSON.stringify(
                save
              )} to user ${JSON.stringify(user)}'s saves array`
            );
          }
        });
        // add save reference to Episode
        episodesController.addSaveOfEpisode(save, episode, err => {
          if (err) {
            logger.alert(
              `failed to add post ${JSON.stringify(
                save
              )} to episode ${JSON.stringify(episode)}'s saves array`
            );
          }
        });
        cb(null, save);
      });
    }
  );
}

module.exports = {
  createPost,
  getNewPost(req, res, next) {
    if (!req.user) {
      // We should never get here because of ensureAuthenticated middleware
      req.flash(
        'errors',
        'Please log in or register for an account to submit posts.'
      );
      res.redirect('/login');
      return;
    }
    if (req.query.url && validator.isURL(req.query.url)) {
      // lookup shareURL and parse for episode details
      episodesController.findOrCreateEpisodeWithShareURL(
        req.query.url,
        (err, episode) => {
          if (err) {
            logger.error(JSON.stringify(err));
            req.flash(
              'errors',
              `We aren't sure what to do with this page. Do you have an episode share URL?`
            );
            res.render('posts/post', {
              currentUser: req.user,
              csrfToken: req.csrfToken()
            });
            return;
          }
          if (!episode) {
            logger.error('failed to return an episode on createPost');
            req.flash(
              'errors',
              `We aren't sure what to do with this page. Do you have an episode share URL?`
            );
            res.render('posts/post', {
              currentUser: req.user,
              csrfToken: req.csrfToken()
            });
            return;
          }
          res.render('posts/postParsed', {
            currentUser: req.user,
            csrfToken: req.csrfToken(),
            submitURL: req.query.url,
            episode
          });
        }
      );
      return;
    }
    res.render('posts/post', {
      currentUser: req.user,
      csrfToken: req.csrfToken()
    });
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
    postData.publicShare = postData.publicShare === 'recommend';
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
          } with error: ${JSON.stringify(err)}`
        );
        next(err);
        return;
      }
      if (postData.publicShare) {
        createPost(newPostData, (err, post) => {
          if (err) {
            logger.error(
              `Error creating post via web for user: ${
                req.user.username
              } with error: ${JSON.stringify(err)}`
            );
            if (err.status === 409) {
              req.flash('errors', err.message);
              res.status(409).redirect(`/u/${req.user.username}`);
              return;
            }
            if (err.status === 400) {
              req.flash(
                'errors',
                "We don't know what to do with that link. Please try again by linking to an individual episode."
              );
              res.status(400).redirect(`/post`);
              return;
            }
            if (err.status === 404) {
              req.flash('errors', err.message);
              res.status(400).redirect(`/post`);
              return;
            }
            if (err.status === 501) {
              req.flash(
                'errors',
                "We don't know how to find episodes on that site yet. We have logged the error and will try to do better."
              );
              res.status(400).redirect(`/post`);
              return;
            }
            next(err);
            return;
          }
          req.flash('info', `${post.episode.title} posted`);
          res.redirect(`/u/${req.user.username}`);
        });
      } else {
        createSave(newPostData, (err, post) => {
          if (err) {
            logger.error(
              `Error creating post via web for user: ${
                req.user.username
              } with error: ${JSON.stringify(err)}`
            );
            if (err.status === 409) {
              req.flash('errors', err.message);
              res.status(409).redirect(`/u/${req.user.username}`);
              return;
            }
            if (err.status === 400) {
              req.flash(
                'errors',
                "We don't know what to do with that link. Please try again by linking to an individual episode."
              );
              res.status(400).redirect(`/post`);
              return;
            }
            if (err.status === 404) {
              req.flash('errors', err.message);
              res.status(400).redirect(`/post`);
              return;
            }
            if (err.status === 501) {
              req.flash(
                'errors',
                "We don't know how to find episodes on that site yet. We have logged the error and will try to do better."
              );
              res.status(400).redirect(`/post`);
              return;
            }
            next(err);
            return;
          }
          req.flash('info', `${post.episode.title} saved`);
          res.redirect(`/saved`);
        });
      }
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
      res.status(406).send('Unauthorized access');
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
        res.status(406).send('No share URL');
        return;
      }
    } catch (error) {
      logger.notice(
        `received post from mailgun, but without a share URL: ${strippedText}`
      );
      res.status(406).send('No share URL');
      return;
    }

    // lookup user by tag
    const tag = postJson.To.split('@')[0]
      .split('+')[1]
      .toLowerCase();
    usersController.findUserByTag(tag, (err, postingUser) => {
      if (err) {
        logger.error(
          `findUserByTag error while adding post via mail for tag: ${tag} with error: ${JSON.stringify(
            err
          )}`
        );
        next(err);
        return;
      }
      if (!postingUser) {
        res.status(406).send('No such user');
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
            } with error: ${JSON.stringify(err)}`
          );
          // next(err);
          res.status(406).send('Something went wrong');
          return;
        }
        mail.sendWithTemplate(
          'postConfirmation',
          'Echopig <post@echopig.com>',
          postingUser,
          { user: postingUser, post },
          // eslint-disable-next-line no-shadow
          err => {
            if (err) logger.error(JSON.stringify(err));
          }
        );
        res.status(200).send();
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
          } with error: ${JSON.stringify(err)}`
        );
        next(err);
        return;
      }
      res.redirect(`/u/${req.user.username}`);
      // pull from episode posts array
      episodesController.removePostOfEpisode(postId, (err, episode) => {
        if (err) {
          logger.error(
            `failed to delete post ${postId} from episode ${JSON.stringify(
              episode
            )}'s posts array`
          );
        }
      });
      // pull from user's posts array
      usersController.removePostByUser(postId, req.user, (err, user) => {
        if (err) {
          logger.error(
            `failed to delete post ${postId} from user ${JSON.stringify(
              user
            )}'s posts array`
          );
        }
      });
    });
  },
  deleteSave(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    const saveId = req.query.s;
    savesData.deleteSave({ _id: saveId, byUser: req.user.id }, err => {
      if (err) {
        // this is almost definitely a user error, changing the saveId in the URL
        logger.error(
          `Error deleting save for user: ${
            req.user.username
          } with error: ${JSON.stringify(err)}`
        );
        next(err);
        return;
      }
      res.redirect(`/saved`);
      // pull from episode posts array
      episodesController.removeSaveOfEpisode(saveId, (err, episode) => {
        if (err) {
          logger.error(
            `failed to delete save ${saveId} from episode ${JSON.stringify(
              episode
            )}'s saves array`
          );
        }
      });
      // pull from user's posts array
      usersController.removeSaveByUser(saveId, req.user, (err, user) => {
        if (err) {
          logger.error(
            `failed to delete post ${saveId} from user ${JSON.stringify(
              user
            )}'s posts array`
          );
        }
      });
    });
  },
  getTopEpisodes(req, res, next) {
    const hours = cleanTimeframeQuery(req.query.t || 100 * 24);
    const timeframe = hours * 60 * 60 * 1000;
    const since = new Date(Date.now() - timeframe);
    const maxEpisodes = 50;
    postsData.findMostPostedEpisodesInTimeframe(
      since,
      maxEpisodes,
      (err, episodes) => {
        if (err) {
          logger.error(JSON.stringify(err));
          next(err);
          return;
        }
        res.render('episodes/topEpisodes', {
          currentUser: req.user,
          episodes
        });
      }
    );
  },
  mostPostedEpisodesInTimeframe(since, maxEpisodes, callback) {
    postsData.findMostPostedEpisodesInTimeframe(
      since,
      maxEpisodes,
      (err, episodes) => {
        if (err) {
          logger.error(JSON.stringify(err));
          callback(err);
          return;
        }
        callback(null, episodes);
      }
    );
  },
  mostPostedPodcastsInTimeframe(since, maxPodcasts, callback) {
    postsData.findMostPostedPodcastsInTimeframe(
      since,
      maxPodcasts,
      (err, podcasts) => {
        if (err) {
          logger.error(JSON.stringify(err));
          callback(err);
          return;
        }
        callback(null, podcasts);
      }
    );
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
    const maxEpisodes = 50;
    postsData.findMostPostedEpisodesInGenreInTimeframe(
      genre,
      since,
      maxEpisodes,
      (err, episodes) => {
        if (err) {
          logger.error(JSON.stringify(err));
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
