# Echopig
## Personalized podcast rss feed web app

Use docker-compose.debug.yml for dev and docker-compose.yml for production
Rebuild: 
  docker-compose up -d --no-deps --build web

**TODO**

* Bookmarklet
* Copy
  * About
  * Homepage
* Avatars


### How to Use Echopig
When you sign up, you'll get access to a few things:
* An RSS feed to share with your friends.
  * You'll be able to add your favorite episodes to this feed from your podcast app or from the website.
  * You can share the link on Facebook, Twitter, and other sites to let your friends know, and they can add the feed to their podcast app with two or three taps.
* Another RSS feed for episodes you want to listen to that you find on the web.
  * Add this feed to your podcast app for an easy way to listen later.
  * You can use the bookmarklet or the website to add episodes to this feed. Make sure to select "Save for later" when you're posting.
* A secret email address to use for posting episodes to Echopig.
  * We recommend keeping this address secret. If you want to collaborate on recommendations for a feed, you are welcome to share it though.
  * You'll use this address to send episodes to Echopig from your podcast app. When you want to add an episode to your recommendations, use the share sheet [share sheet icon] to send the email. 
  * If you're on iOS, you can use the Shortcuts app to make this even easier.
  


### Why Echopig Exists
Echopig brings the simplicity of retweeting to podcast episodes. 

Now: share from your podcast app, generate a web link. How can you friend listen to it? Who wants to listen to it on the web instead of in their podcast app? There are many steps for your friend to add that episode to their podcast app: 
* Go to add a podcast
* Search for the show
* Search for the episode (if their app even offers search for episodes!)
* Download the episode
* Then it might end up in a part of their feed that's hard to find

With Echopig, your friends can follow your recommendations by adding your Echopig RSS feed once and then your recommendations show up in their feed the same way their other show subscriptions do.
