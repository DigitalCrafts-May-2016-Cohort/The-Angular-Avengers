
var app = angular.module('app',['ngRoute']);

var savedJobs = [];


/****************** Services ******************/
app.factory('jobSearchService', function($http){
  return{
    getListOfJobs: function(callback){
      $http({
        url: 'https://data.usajobs.gov/api/search',
        params: {
          //Keyword: "developer",
          JobCategoryCode: 2210,
          LocationName: 'Atlanta, Georgia'
        },
        headers: {
          //'User-Agent': 'allenhthompson1@gmail.com',
          'Authorization-Key': 'MfbLK4LehC6CQvAg3U9nr2Y0nBS5IHnMJjPK+KuoWbM='
        }
      }).success(callback);
    } // end getListOfJobs method
  }; // end return
}); // end jobSearchService factory

app.factory('weatherService', function($http){
  var APPID = '0eec4393061dd3bf6597febdb72c50c4';
  return {
    getByCityID: function(callback){
      $http({
        url: 'http://api.openweathermap.org/data/2.5/weather',
        params: {
          q: 'Atlanta',
          units: 'imperial',
          APPID: APPID
        }
      }).success(callback);
    } // end getByCityID method
  }; // end return
}); // end app.factory(weatherService)

function filterForGa(locationList){
     if(locationList.CountrySubDivisionCode === 'Georgia'){
          return true;
     } else
     return false;
}

// main controller
app.controller('MainController', function($scope, jobSearchService, googleMap){
  jobSearchService.getListOfJobs(function(data){
    // returns the first 25 results
    $scope.allResultsList = data.SearchResult.SearchResultItems;
    console.log($scope.allResultsList);

    // call to the google service plot jobs location on map
    googleMap.plotData($scope.allResultsList);
  });
});
/**** Config: Switch between pages ****/
app.config(function($routeProvider) {
     $routeProvider
     .when('/search/:keyword/:location', {
          controller: 'JobSearch',
          templateUrl: 'main.html'
     })
     .when('/savedJobs', {
          controller: 'SaveJobs',
          templateUrl: 'savedJobs.html'
     })
     .when('/', {
          controller: 'HomePage',
          templateUrl: 'home.html'
     });

});


app.controller('SaveJobs', function($scope, $http){
  $scope.savedJobs = savedJobs;
  $scope.deleteJobBtn = function(index){
    $scope.savedJobs.splice(index,1);
    console.log($scope.savedJobs);
  };
});

app.controller('HomePage', function($scope, $http, $location, weatherService){
  var d = new Date();
  document.getElementById("displayDate").innerHTML = d.toDateString();

     $scope.searchJobs = function() {
          $location.path('/search/' + $scope.keyword + '/' + $scope.location);
     };
     weatherService.getByCityID(function(data){
         $scope.data = data;
         console.log($scope.data);
     });


});

app.controller('JobSearch', function($scope, $http, $routeParams){

     // $scope.message = 'Test message.';//this line just checking connectivity

     $scope.getGeorgiaLocation = function(job){
          var cityList = job.MatchedObjectDescriptor.PositionLocation;
          var gaLocations = cityList.filter(filterForGa);
          return gaLocations[0];
     };
     $scope.openInfoWindow = function(job){
          job.infoWindow.open(map, job.marker);
     };
     // job search api call
     $http({
          url: 'https://data.usajobs.gov/api/search',
          params: {
               Keyword: $routeParams.keyword,
               //JobCategoryCode: 2210,
               LocationName: $routeParams.location
          },
          headers: {
               //'User-Agent': 'allenhthompson1@gmail.com',
               'Authorization-Key': 'MfbLK4LehC6CQvAg3U9nr2Y0nBS5IHnMJjPK+KuoWbM='
          }
     }).success(function(data) {
          var allResultsList = data.SearchResult.SearchResultItems;
          console.log('data', allResultsList);

          var filterGeorgiaResults = function(oneResult) {
               var cityList = oneResult.MatchedObjectDescriptor.PositionLocation;
               var gaLocations = cityList.filter(filterForGa);


               if (gaLocations.length > 0) {
                    return true;
               } else
               return false;
               /*
               1. store locationList as a variable
               2. filter locationList to only GA locations, store that in variable
               3. if GA locations is empty (length of 0), return false, otherwise return true
               */
          };

          function clearMarker() {
               setMapOnAll(null);
          }

          $scope.allResultsList = allResultsList;


          //$scope.georgiaResultsList = allResultsList.filter(filterGeorgiaResults);
          // $scope.resultList = data.SearchResult.SearchResultItems;
          //console.log(JSON.stringify($scope.georgiaResultsList));

          var markers = $scope.allResultsList.map(function(job) {

               var locationList = job.MatchedObjectDescriptor.PositionLocation;

               //funtiont to fliter the list of jobs to only Georgia

               //var locationsInGeorgia = locationList.filter(filterForGa);

               locationList.map(function(location){
                    var lat = location.Latitude;
                    var lng = location.Longitude;
                    var position = {
                         lat: lat,
                         lng: lng
                    };

                    var marker = new google.maps.Marker({
                         anchorPoint:new google.maps.Point(0,-8),
                         position: position,
                         map: map,
                    });
                    job.marker = marker;
                    var contentString = '<a href =' + job.MatchedObjectDescriptor.PositionURI + '>Apply To This Job</a>' + '<h5>' + job.MatchedObjectDescriptor.PositionTitle + '</h5>';


                    var infoWindow = new google.maps.InfoWindow({
                         content: contentString
                    });
                    job.infoWindow = infoWindow;
                    marker.addListener('click', function() {
                         infoWindow.open(map, marker);
                    });
                    //REMOVE THE CODE BELOW
                    // var infowindow = new google.maps.InfoWindow();
                    // function openInfoWindow(job){
                    //      var contentString = '<a href =' + job.MatchedObjectDescriptor.PositionURI + '>Apply To This Job</a>' + '<h5>' + job.MatchedObjectDescriptor.PositionTitle + '</h5>';
                    //
                    //      infoWindow.setContent(contentString);
                    //
                    //REMOVE THE CODE ABOVE

               });
          });
          //<a href = "LINK"></a>
     });

     // google map api call
     var centerLatLng = {
          lat: 39.8097,
          lng: -98.5556
     };

     var mapOtions = {
          center: centerLatLng,
          zoom: 4
     };

     var map = new google.maps.Map(document.getElementById('map'), mapOtions);


  $scope.saveJobBtn = function(job){
    savedJobs.push(job);
    // $scope.jobcomments = $cookies.get('jobcomments');
    // $cookies.put('jobcomments', job);
    console.log(savedJobs);
  };
});
