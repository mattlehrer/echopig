const { createPost } = require('../controllers/postsController');
const { findUserByUsername } = require('../data/usersData');
const logger = require('./logger')(__filename);

const oldPosts = [
  {
    postTime: '1507921789379',
    username: 'matt',
    shareURL: 'https://overcast.fm/+BihmMNO4A'
  },
  {
    postTime: '1507924732107',
    username: 'matt',
    shareURL: 'https://overcast.fm/+GpUOcm-ms'
  },
  {
    postTime: '1489970491576',
    username: 'matt',
    shareURL:
      'https://itunes.apple.com/us/podcast/1-wheres-richard/id1203092300?i=1000381249332&mt=2'
  },
  {
    postTime: '1490041609533',
    username: 'matt',
    shareURL: 'https://overcast.fm/+J8vFCo'
  },
  {
    postTime: '1490041622609',
    username: 'matt',
    shareURL: 'https://overcast.fm/+DAul9IM'
  },
  {
    postTime: '1490041770930',
    username: 'matt',
    shareURL: 'https://overcast.fm/+nddEuM'
  },
  {
    postTime: '1490041789393',
    username: 'matt',
    shareURL: 'https://overcast.fm/+BYAb_GstI'
  },
  {
    postTime: '1491929604452',
    username: 'matt',
    shareURL:
      'https://itunes.apple.com/us/podcast/chapter-i/id1212558767?i=1000383222447&mt=2'
  },
  {
    postTime: '1497472221627',
    username: 'matt',
    shareURL: 'https://overcast.fm/+Gsa3Z0Bgw'
  },
  {
    postTime: '1498208178717',
    username: 'matt',
    shareURL: 'https://overcast.fm/+hTZRA0'
  },
  {
    postTime: '1498757647510',
    username: 'matt',
    shareURL: 'https://overcast.fm/+Gsa3wQhZw'
  },
  {
    postTime: '1499286594620',
    username: 'matt',
    shareURL: 'https://overcast.fm/+DCqUOgk'
  },
  {
    postTime: '1499453550783',
    username: 'matt',
    shareURL: 'https://overcast.fm/+BfsIQAloc'
  },
  {
    postTime: '1499899461474',
    username: 'matt',
    shareURL: 'https://overcast.fm/+D9OldM-iw'
  },
  {
    postTime: '1500600765539',
    username: 'matt',
    shareURL: 'https://overcast.fm/+gBtN1E'
  },
  {
    postTime: '1501167232204',
    username: 'matt',
    shareURL: 'https://overcast.fm/+DzGWOUDYo'
  },
  {
    postTime: '1501203993786',
    username: 'matt',
    shareURL: 'https://overcast.fm/+BEBPwavBA'
  },
  {
    postTime: '1501208990612',
    username: 'matt',
    shareURL: 'https://overcast.fm/+8EZqqAJQ'
  },
  {
    postTime: '1501519391439',
    username: 'matt',
    shareURL: 'https://overcast.fm/+HOFh8C03M'
  },
  {
    postTime: '1501868380766',
    username: 'matt',
    shareURL: 'https://overcast.fm/+Gsa1WWcH8'
  },
  {
    postTime: '1501868598108',
    username: 'matt',
    shareURL: 'https://overcast.fm/+DzGWu9N7c'
  },
  {
    postTime: '1504732032246',
    username: 'matt',
    shareURL: 'https://overcast.fm/+n2hrws/36:47'
  },
  {
    postTime: '1506622728503',
    username: 'matt',
    shareURL: 'https://overcast.fm/+BP5_de0xQ'
  },
  {
    postTime: '1507158304055',
    username: 'matt',
    shareURL: 'https://overcast.fm/+DAzuRx0'
  },
  {
    postTime: '1507160984133',
    username: 'matt',
    shareURL: 'https://overcast.fm/+GpUNn4OP4'
  },
  {
    postTime: '1507165503193',
    username: 'matt',
    shareURL: 'https://overcast.fm/+GpUPbOpnM'
  },
  {
    postTime: '1507787261220',
    username: 'karibi',
    shareURL: 'https://overcast.fm/+-EE7Qo_M'
  }
];

module.exports = () => {
  findUserByUsername('matt', (err, matt) => {
    if (err) {
      logger.debug(err);
      return;
    }
    oldPosts.forEach(p => {
      const oldPost = {
        byUser: matt,
        shareURL: p.shareURL
      };
      // eslint-disable-next-line no-shadow
      createPost(oldPost, err => {
        if (err) {
          logger.debug(err);
        } else {
          // logger.debug(post.episode.title);
        }
      });
    });
  });
};
