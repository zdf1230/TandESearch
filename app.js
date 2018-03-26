const express = require("express");
const https = require("https");
const yelp = require("yelp-fusion");

var app = express();

app.use(function (req, res, next) {
    console.log(`${req.method} request for '${req.url}'`);
    next();
});

app.use(express.static("./public"));

const googleApiKey = "AIzaSyATY-GC2b0J-8GgFc7xK8mrOX5Tm7S4RXA";
const yelpApiKey = "vK5fdJLHak6-mTvA7KZYgU1vPQ-OhuTox5KNYmUbtINJK6EbNg3lKnIXO6IAxG7AEMSY8C7D1EpauOD0rhBJ1LWGD1shM6sT6iTmqSrk5amzkLmDExvdPr_BoZi4WnYx";
const client = yelp.client(yelpApiKey);
const accuracy = 0.00001;

app.get("/location", function (req, res) {
    var lat, lng;
    var location = req.query.location;
    var locationUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&key=" + googleApiKey;

    var request = https.get(locationUrl, function(response) {
        var responseBody = "";

        response.setEncoding("UTF-8");

        response.on("data", function(data) {
            responseBody += data;
        });

        response.on("end", function(err){
            if (err) {
                throw err;
            }
            responseJson = JSON.parse(responseBody);
            responseLocation = responseJson.results[0].geometry.location;
            lat = responseLocation.lat;
            lng = responseLocation.lng;
            res.json({"lat" : lat, "lng" : lng});
        })
    });

    request.on("error", function(err) {
        throw err;
    });
    
    request.end();
});

app.get("/place", function (req, res) {
    var reqInfo = req.query;
    var placeUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" 
        + reqInfo.lat + "," + reqInfo.lng
        + "&radius=" + reqInfo.distance * 1609.344
        + "&type=" + reqInfo.category
        + "&keyowrd=" + reqInfo.keyword
        + "&key=" + googleApiKey;

    var request = https.get(placeUrl, function(response) {
        var responseBody = "";

        response.on("data", function(data) {
            responseBody +=data;
        });

        response.on("end", function (err) {
            if (err) {
                throw err;
            }
            res.send(responseBody);
        });
    });

    request.on("error", function (err) {
        throw err;
    });

    request.end();
});

app.get("/moreplaces", function (req, res) {
    var placeUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=" 
        + req.query.next_page_token
        + "&key=" + googleApiKey;

    var request = https.get(placeUrl, function(response) {
        var responseBody = "";

        response.on("data", function(data) {
            responseBody +=data;
        });

        response.on("end", function (err) {
            if (err) {
                throw err;
            }
            res.send(responseBody);
        });
    });

    request.on("error", function (err) {
        throw err;
    });

    request.end();
});

app.get("/yelpreviews", function(req, res) {
    var reqInfo = req.query;
    var searchRequest = {
        name : reqInfo.name,
        address1 : reqInfo.address1,
        city : reqInfo.city,
        state : reqInfo.state,
        country : reqInfo.country,
        latitude : reqInfo.latitude,
        longtitude : reqInfo.longtitude
    };

    client.businessMatch('best', searchRequest).then(response => {
        var result = response.jsonBody.businesses[0];
        console.log(result);
        if (result != null && check_accuracy(reqInfo.latitude, result.coordinates.latitude) 
            && check_accuracy(reqInfo.longtitude, result.coordinates.longtitude)) {

            client.reviews(result.id).then(response => {
                res.json(response.jsonBody);
            }).catch(e => {
                console.log(e);
                throw e;
            });
        }
        else {
            res.send(null);
        }
    }).catch(e => {
        console.log(e);
        throw e;
    });
});

function check_accuracy(a, b) {
    if (a == null) {
        return true;
    }
    return Math.abs(a - b) < accuracy;
}

app.listen(3000, function () {
    console.log('TandESearch app running on port 3000');
});