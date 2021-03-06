var dark = angular.module('dark-fantasy', ['ngRoute', 'ngSanitize', 'ngAria', 'ngAnimate', 'ngMaterial']);

dark.controller('MainController', function ($rootScope, Config, NavService) {
    var mc = this;
    mc.chapter_name = Config.name;
    mc.google_plus_link = 'https://plus.google.com/' + Config.id;
    mc.gdg_link = 'https://developers.google.com/groups/chapter/' + Config.id + '/';
    mc.twitter_link = Config.twitter ? 'https://twitter.com/' + Config.twitter: null;
    mc.facebook_link = Config.facebook ? 'https://www.facebook.com/' + Config.facebook: null;
    mc.meetup_link = Config.meetup ? 'http://www.meetup.com/' + Config.meetup: null;
    $rootScope.canonical = Config.domain;

    NavService.registerNavListener(function (tab) {
        mc.navTab = tab;
    });
});

dark.config(function ($routeProvider, $locationProvider, $mdThemingProvider) {

    $locationProvider.hashPrefix('!');

    $routeProvider.
        when("/about", {templateUrl: 'app/about/about.html', controller: "AboutController", controllerAs: 'vm'}).
        when("/news", {templateUrl: 'app/news/news.html', controller: "NewsController", controllerAs: 'vm'}).
        when("/events", {templateUrl: 'app/events/events.html', controller: "EventsController", controllerAs: 'vm'}).
        when("/photos", {templateUrl: 'app/photos/photos.html', controller: "PhotosController", controllerAs: 'vm'}).
        otherwise({ redirectTo: '/about' });

    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('deep-orange');
});

dark.factory('Config', function () {
    return {
        // TODO Modify these to configure your app
        'name'          : 'GDG VIT Vellore',
        'id'            : '101018908043689071742',//101018908043689071742
        'google_api'    : 'AIzaSyBLmjZggwek6J_xpdffvOXDcdDn_6sP6iY',
        'pwa_id'        : '6131627325679555265', // Picasa Web Album id, must belong to Google+ id above
        'domain'        : 'http://www.gdgvitvellore.com',
        'twitter'       : 'gdgvitvellore',
        'facebook'      : 'gdgvitvellore',
        'meetup'        : 'gdgvitvellore',
        // Change to 'EEEE, MMMM d, y - H:mm' for 24 hour time format.
        'dateFormat'    : 'EEEE, MMMM d, y - h:mm a',
        'cover' : {
            title: 'Worldwide GDG Events',
            subtitle: 'Directory of developer events organized by tags and displayed on a global map.',
            button: {
                text: 'Find local events',
                url: 'http://gdg.events/'
            }
        }
        // To update the snippet which is used for sharing, see the TODO in the index.html.
    };
});

dark.factory('NavService', function () {
    var navTab = '0';
    var navListener;

    return {
        setNavTab: setNavTab,
        getNavTab: getNavTab,
        registerNavListener: registerNavListener
    };

    function setNavTab(tabValue) {
        navTab = tabValue;
        navListener(navTab);
    }

    function getNavTab() {
        return navTab;
    }

    function registerNavListener(listenerToRegister) {
        navListener = listenerToRegister;
    }
});

dark.controller('AboutController', function ($http, Config, $scope) {
    $http.jsonp('https://www.googleapis.com/plus/v1/people/' + Config.id +
            '?callback=JSON_CALLBACK&fields=aboutMe%2Ccover%2Cimage%2CplusOneCount&key=' + Config.google_api).
        success(function (data) {
            console.log(data);
            $scope.about = data.aboutMe;
        })
        .error(function (error) {
            // vm.desc = "Sorry, we failed to retrieve the About text from the Google+ API.";
            // vm.loading = false;
            // vm.status = 'ready';
        });
});

dark.controller('NavController', ['$scope', function ($scope) {
	$scope.nav = [
		{'name': 'About Us', 'action': '1'},
		{'name': 'What We Do', 'action': '2'},
		{'name': 'Our Works', 'action': '3'},
		{'name': 'Gallery', 'action': '4'},
		{'name': 'News', 'action': '5'},
		{'name': 'Team', 'action': '6'},
		{'name': 'Contact Us', 'action': '7'}
	];
	console.log($scope.nav);
}])

dark.controller("EventsController", function ($http, $log, $filter, Config, NavService) {
    var vm = this;
    NavService.setNavTab(2);
    vm.chapter_name = Config.name;
    vm.loading = true;
    vm.dateFormat = Config.dateFormat;
    vm.events = { past:[], future:[] };
    var url = 'https://www.googleapis.com/plus/v1/people/' + Config.id + '/activities/public?callback=angular.callbacks._0&maxResults=20&key=' + Config.google_api+ ''
    var testUrl = 'http://hub.gdgx.io/api/v1/chapters/' + Config.id + '/events/upcoming?callback=JSON_CALLBACK';
    var headers = { 'headers': { 'Accept': 'application/json;' }, 'timeout': 2000 };
    $http.jsonp(url, headers)
        .success(function (data) {
            for (var i = data.items.length - 1; i >= 0; i--) {
                data.items[i].about = data.items[i].about.replace(/<br\s*\/?><br\s*\/?><br\s*\/?><br\s*\/?>/g, '<br><br>');
                vm.events.future.push(data.items[i]);
            }
            vm.events.future = $filter('orderBy')(vm.events.future, 'start', false);
            vm.loading = false;
            vm.status = 'ready';
        })
        .error(function (response) {
            vm.upcomingError = "Sorry, we failed to retrieve the upcoming events from the GDG-X Hub API.";
            vm.loading = false;
            vm.status = 'ready';
            $log.debug('Sorry, we failed to retrieve the upcoming events from the GDG-X Hub API: ' + response);
        });

    var getPastEventsPage = function(page) {
        var url = 'http://hub.gdgx.io/api/v1/chapters/' + Config.id + '/events/past?callback=JSON_CALLBACK&page=' + page;
        var headers = { 'headers': {'Accept': 'application/json;'}, 'timeout': 2000 };
        $http.jsonp(url, headers)
            .success(function (data) {
                var i;
                for (i = data.items.length - 1; i >= 0; i--) {
                    data.items[i].about = data.items[i].about.replace(/<br\s*\/?><br\s*\/?><br\s*\/?><br\s*\/?>/g, '<br><br>');
                    vm.events.past.push(data.items[i]);
                }
                if (data.pages === page) {
                    vm.events.past = $filter('orderBy')(vm.events.past, 'start', true);
                    vm.loading = false;
                    vm.status = 'ready';
                } else {
                    getPastEventsPage(page + 1);
                }
            })
            .error(function (response) {
                vm.pastError = "Sorry, we failed to retrieve the past events from the GDG-X Hub API.";
                vm.loading = false;
                vm.status = 'ready';
                $log.debug('Sorry, we failed to retrieve the past events from the GDG-X Hub API: ' + response);
            });
    };
    getPastEventsPage(1);
});

// Google+ hashtag linky from http://plnkr.co/edit/IEpLfZ8gO2B9mJcTKuWY?p=preview
dark.filter('hashLinky', function() {
    var ELEMENT_NODE = 1;
    var TEXT_NODE = 3;
    var linkifiedDOM = document.createElement('div');
    var inputDOM = document.createElement('div');

    return function(input) {
        inputDOM.innerHTML = input;
        return hashLinky(inputDOM).innerHTML;
    };

    function hashLinky(startNode) {
        var i, currentNode;
        for (i = 0; i < startNode.childNodes.length; i++) {
            currentNode = startNode.childNodes[i];

            switch (currentNode.nodeType) {
                case ELEMENT_NODE:
                    hashLinky(currentNode);
                    break;
                case TEXT_NODE:
                    var hashtagRegex = /#([A-Za-z0-9-_]+)/g;
                    currentNode.textContent =  currentNode.textContent.replace(hashtagRegex,
                        '<a href="https://plus.google.com/s/%23$1" target="_blank">#$1</a>');

                    linkifiedDOM.innerHTML = currentNode.textContent;
                    i += linkifiedDOM.childNodes.length - 1;

                    while (linkifiedDOM.childNodes.length) {
                        startNode.insertBefore(linkifiedDOM.childNodes[0], currentNode);
                    }
                    startNode.removeChild(currentNode);
            }
        }
        return startNode;
    }
});

// HTML-ified linky from http://plnkr.co/edit/IEpLfZ8gO2B9mJcTKuWY?p=preview
dark.filter('htmlLinky', function($filter) {
    var ELEMENT_NODE = 1;
    var TEXT_NODE = 3;
    var linkifiedDOM = document.createElement('div');
    var inputDOM = document.createElement('div');

    return function(input) {
        inputDOM.innerHTML = input;
        return linkify(inputDOM).innerHTML;
    };

    function linkify(startNode) {
        var i, currentNode;
        for (i = 0; i < startNode.childNodes.length; i++) {
            currentNode = startNode.childNodes[i];

            switch (currentNode.nodeType) {
                case ELEMENT_NODE:
                    linkify(currentNode);
                    break;
                case TEXT_NODE:
                    linkifiedDOM.innerHTML = $filter('linky')(currentNode.textContent, '_blank');
                    i += linkifiedDOM.childNodes.length - 1;

                    while (linkifiedDOM.childNodes.length) {
                        startNode.insertBefore(linkifiedDOM.childNodes[0], currentNode);
                    }

                    startNode.removeChild(currentNode);
            }
        }
        return startNode;
    }
});

dark.controller("NewsController", function ($http, Config, $scope) {

    $http.jsonp('https://www.googleapis.com/plus/v1/people/' + Config.id +
        '/activities/public?callback=JSON_CALLBACK&maxResults=20&key=' + Config.google_api)
        .success(function (response) {
            console.log(response);
            $scope.news = response.items;
            // var $scope.news = [], i;
            // var item, actor, object, itemTitle, html;
            // var published, actorImage, entry;

            // if (!response.items) {
            //     // handleError('Response from server contained no news items.');
            //     return;
            // }
            // for (i = 0; i < response.items.length; i++) {
            //     item = response.items[i];
            //     actor = item.actor || {};
            //     object = item.object || {};
            //     itemTitle = object.content;
            //     published = $filter('date')(new Date(item.published), 'fullDate');
            //     html = [];

            //     html.push(itemTitle.replace(new RegExp('\n', 'g'), '<br />').replace('<br><br>', '<br />'));
            //     html = html.join('');
            //     html = $sce.trustAsHtml(html);

            //     actorImage = actor.image.url;
            //     actorImage = actorImage.substr(0, actorImage.length - 2) + '16';

            //     entry = {
            //         via: {
            //             name: 'Google+',
            //             url: item.url
            //         },
            //         published: published,
            //         body: html,
            //         date: item.updated,
            //         reshares: (object.resharers || {}).totalItems,
            //         plusones: (object.plusoners || {}).totalItems,
            //         comments: (object.replies || {}).totalItems,
            //         icon: actorImage,
            //         item: item,
            //         object: object
            //     };

            //     $scope.news.push(entry);
            // }
            // $scope.news = $filter('orderBy')($scope.news, 'date', true);
            // $timeout(function () {
            //     gapi.plusone.go();
            // });
        })
        .error(function(err){
            console.log(err);
        });

        // var handleError = function(error){
        //     console.log(error);
        //     // vm.desc = "Sorry, we failed to retrieve the news from the Google+ API.";
        //     // vm.loading = false;
        //     // vm.status = 'ready';
        //     // $log.debug('Sorry, we failed to retrieve the news from the Google+ API: ' + error);
        // });

});

dark.controller("PhotosController", function ($http, Config,$scope) {
    // $scope.name = 'sahil narula';
    // var vm = this;
    // vm.loading = true;
    // NavService.setNavTab(3);
    // vm.chapter_name = Config.name;
    // vm.photos = [];

    var pwa = 'https://picasaweb.google.com/data/feed/api/user/' + Config.id + '/albumid/' + Config.pwa_id +
        '?access=public&alt=json-in-script&kind=photo&max-results=50&fields=entry(title,link/@href,summary,content/@src)&v=2.0&callback=JSON_CALLBACK';
    $scope.photos = [];
    $http.jsonp(pwa).
        success(function (data) {
            console.log(data);
            var p = data.feed.entry;
            for (var x in p) {
                var photo = {
                    link: p[x].link[1].href,
                    src: p[x].content.src,
                    alt: p[x].title.$t,
                    title: p[x].summary.$t
                };
                $scope.photos.push(photo);
            }
        })
        .error(function (data) {
            // vm.error_msg = "Sorry, we failed to retrieve the Photos from the Picasa Web Albums API. Logging out of your Google Account and logging back in may resolve this issue.";
            // vm.loading = false;
        });
});