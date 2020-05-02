/**
Alex List, no rights reserved and no guarantees made.
*/

var jitsiroot = "https://meet.jit.si/"
var prefix = jitsiroot + "SteerRoast"
var publicRooms = ["2ndFloorBalcony","2ndHNCLounge","2ndWARLounge","3rdWARLounge","4thCraftsBalcony","4thFloorBalcony","4thHNCLounge","4thWARLounge","4thWareBalcony","AlumRV","BasementMusic","ElevatorParty","FirstAtkinson","FirstCrafts","FirstHolman","FirstNichols","FirstRunkle","FirstWare","FlamingoLounge","FourthAtkinson","FourthCrafts","FourthHolman","FourthNichols","FourthRunkle","FourthWare","HausLobby","HausRoof","HousemasterApartment","KensOffice","MusicRoom","Room3rdHNCLounge","SecondAtkinson","SecondCrafts","SecondHolman","SecondNichols","SecondRunkle","SecondWare","SixthRunkle","Suite206","Suite212","Suite233","Suite312","Suite333","Suite366","Suite414","Suite433","Suite462","TVRoom","ThirdAtkinson","ThirdCrafts","ThirdHolman","ThirdNichols","ThirdRunkle","ThirdWare","TowersBalcony","TowersBunker","TowersLounge","TowersRoof","TowersShowerWithGoodPressure","Vomitorium"];

// var allRooms = ["2ndFloorBalcony","2ndHNCLounge","2ndWARLounge","3rdWARLounge","4thCraftsBalcony","4thFloorBalcony","4thHNCLounge","4thWARLounge","4thWareBalcony","AlumRV","BasementMusic","ElevatorParty","FirstAtkinson","FirstCrafts","FirstHolman","FirstNichols","FirstRunkle","FirstWare","FlamingoLounge","FourthAtkinson","FourthCrafts","FourthHolman","FourthNichols","FourthRunkle","FourthWare","HausLobby","HausRoof","HousemasterApartment","KensOffice","MusicRoom","Room104","Room105","Room106","Room107","Room108","Room109","Room110","Room111","Room112","Room113","Room114","Room115","Room116","Room140","Room142","Room143","Room146","Room147","Room148","Room149","Room150","Room151","Room153","Room205","Room206A","Room206B","Room206C","Room206D","Room207","Room209","Room212A","Room212B","Room212C","Room218","Room219","Room220","Room221","Room222","Room224","Room228","Room233A","Room233B","Room233C","Room233D","Room233E","Room241","Room246","Room247","Room248","Room249","Room250","Room251","Room252","Room253","Room254","Room260","Room262","Room304","Room305","Room306","Room307","Room309","Room312A","Room312B","Room312C","Room318","Room319","Room320","Room322","Room324","Room328","Room333A","Room333B","Room333C","Room333D","Room333E","Room340","Room341","Room343","Room344","Room346","Room347","Room348","Room349","Room350","Room351","Room352","Room354","Room361","Room362","Room363","Room364","Room366A","Room366B","Room366C","Room366D","Room3rdHNCLounge","Room404","Room405","Room406","Room407","Room408","Room409","Room414A","Room414B","Room414C","Room419","Room420","Room422","Room424","Room428","Room433A","Room433B","Room433C","Room433D","Room433E","Room441","Room446","Room447","Room448","Room449","Room450","Room451","Room452","Room454","Room462A","Room462B","Room462C","Room462D","Room462E","Room523","Room524","Room532","Room623","Room624","Room626","Room629","Room630","Room631","Room632","SecondAtkinson","SecondCrafts","SecondHolman","SecondNichols","SecondRunkle","SecondWare","SixthRunkle","Suite206","Suite212","Suite233","Suite312","Suite333","Suite366","Suite414","Suite433","Suite462","TVRoom","ThirdAtkinson","ThirdCrafts","ThirdHolman","ThirdNichols","ThirdRunkle","ThirdWare","TowersBalcony","TowersBunker","TowersLounge","TowersRoof","TowersShowerWithGoodPressure","Vomitorium"];

var c_sesh = {};
/// true once we set url monitoring and runtime message listening
var isSetup = false;

var injectStandardScripts = function(){
  chrome.tabs.executeScript(c_sesh.tab.id, {file: "jquery-3.3.1.min.js"});
  chrome.tabs.executeScript(c_sesh.tab.id, {file: "constants.js"});
};

var injectWanderScripts = function(){
  injectStandardScripts();
  chrome.tabs.executeScript(c_sesh.tab.id, {file: "wander.js"});
  console.log("injected scripts");
  return true;
};

// var currentRoomIndex = function() {
//   var href = window.location.href;
//   for (var i = 0; i < publicRooms.length; i++) {
//     if (href.endsWith(publicRooms[i])) {
//       return i;
//     }
//   }
//   return 0;
// }
//
// var isMeetingSuitable = function() {
//   if (window.APP.conference.membersCount > 1) {
//     return true;
//   }
//   return false;
// };

var wander = function() {
  var index = currentRoomIndex()
  var nextRoomIndex = (index + 1) % publicRooms.length
  var nextURL = prefix + publicRooms[nextRoomIndex]
  console.log("wandering to: " + nextURL)
  window.location = nextURL
};

/// navigates recording tab to the particular URL if necessary
var ensureTabIsOnURL = function(url){
  if (c_sesh.tab.url != url){
    console.log("record tab moving to url: " + url);
    chrome.tabs.update(c_sesh.tab.id, { url: url });
  }
  /// embedded function
  function cycleTillTabReceived(){
    return getRecordingTabOfURL(url).then(undefined, function(error) {
      return cycleTillTabReceived();
    });
  }
  return cycleTillTabReceived()
    .then(() => new Promise(resolve => setTimeout(resolve, 2000))); //HACK: to give page load time
};

/// sets up listening of tab changes from chrome
var setupURLMonitoring = function(){
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
      if (tabId == c_sesh.tab.id) {
        console.log("main tab change")
        console.log("tab change: " + JSON.stringify(c_sesh.tab));
        injectWanderScripts();
      } else {
        console.log("other tab change");
        getTabOfID(tabId).then(function(tabs){
          c_sesh.tab = tabs[0];
          return tabs[0];
        }).then(function(){
          return injectWanderScripts();
        });
      }
    }
  });
};

var setupBackgroundListening = function(){
  isSetup = true;
  setupURLMonitoring();
};

/// get a tab of id `tabId` that's on jitsi
var getTabOfID = function(tabId){
  return new Promise(function(resolve, reject){
    chrome.tabs.query({url: jitsiroot + "*"}, function(tabs){
      for (var i = 0; i < tabs.length; i++){
        if (tabs[i].id == tabId){
          return resolve([tabs[i]]);
        }
      }
      return reject();
    });
  });
};

/// Called on user click on the browser action
/// If c_sesh's tab is null, the tab is the new recording tab
chrome.browserAction.onClicked.addListener(function(tab) {
  if (isSetup == false){
    setupBackgroundListening();
  }
  getTabOfID(tab.id).then(function(tabs){
    c_sesh.tab = tabs[0];
    return tabs[0];
  }).then(injectWanderScripts);
});
