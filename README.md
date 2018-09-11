# WhatsArt Backend
The separate backend to the [WhatsArt](https://github.com/huangka97/whatsart) mobile application and is running on Heroku to receive requests from the application on the client-side. 
* Uses Express.js as the framework to start the server and listens on a port for connections to the different routes
* Uses Wikipedia/Wikimedia API to parse for artwork information
* Uses Google Maps Geocoding API to get the latitude and longitude of artwork's museums
* Uses Passport.js for regular login credentials via LocalStrategy, Facebook OAuth2 user login, and Twitter OAuth2 user login
