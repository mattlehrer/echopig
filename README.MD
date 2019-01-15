# echopig
personalized podcast rss feed web app

First run a mongo db with:
`docker run --name echopig-mongo -p 27017:27017 -d mongo`
(TODO: setup docker compose)

To run locally:
`npm start`

To run in docker:
`docker build -t mattlehrer/echopigweb .`
`docker run -d -p 9001:9001 --rm --link echopig-mongo:echopig-mongo --name echopigweb mattlehrer/echopigweb`