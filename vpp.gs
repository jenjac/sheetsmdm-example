function assignStandardAppsToDevice(serial) {
  
  var apps = [
    {"pricingParam": "STDQ", "adamIdStr": "409183694", "name": "Keynote", "deviceFamilies": ["mac"]},
    {"pricingParam": "STDQ", "adamIdStr": "409201541", "name": "Pages", "deviceFamilies": ["mac"]},
    {"pricingParam": "STDQ", "adamIdStr": "682658836", "name": "GarageBand", "deviceFamilies": ["mac"]},
    {"pricingParam": "STDQ", "adamIdStr": "1244188551", "name": "Carousel Player", "deviceFamilies": ["tvos"]}, 
    {"pricingParam": "STDQ", "adamIdStr": "409203825", "name": "Numbers", "deviceFamilies": ["mac"]},
    {"pricingParam": "STDQ", "adamIdStr": "408981434", "name": "iMovie", "deviceFamilies": ["mac"]}
  ];
  
  var device = getDEPDevices([serial])[serial];
  var family = device.device_family;
  if ( family == "Mac" ) { family = "mac" };
  if ( family == "AppleTV" ) { family = "tvos" };
  
  var responses = [];
  for ( var i=0; i<apps.length; i++ ) {
    var deviceFamilies = apps[i].deviceFamilies;
    for ( var j=0; j<deviceFamilies.length; j++ ) {
      if ( family == deviceFamilies[j] ) {
        responses.push(manageVPPLicensesByAdamIdSrv(getToken(), Number(apps[i].adamIdStr), apps[i].pricingParam, [serial]));
      }
    }
  }
  
  return responses;
}

function testInstall() {
  Logger.log(installAllVppAppsForDevice("C02JDFA1DTY3","3AAD67F9-BDE5-5B4B-9B88-2B47551D1E0D"));
}

function installAllVppAppsForDevice(serial, udid) {
  if ( udid ) {
    var licenses = getLicencesForDevice(serial);
    for ( var i=0; i<licenses.length; i++ ) {
      var id = Number(licenses[i].adamIdStr);
      installVPPApplication(udid, id);
    }
  }
}

function getVPPServiceConfigSrv() {
  var properties = PropertiesService.getScriptProperties();
  return JSON.parse(properties.getProperty('VPPServiceConfigSrv'));
}

function setVPPServiceConfigSrv(data) {
  var properties = PropertiesService.getScriptProperties();;
  properties.setProperty('VPPServiceConfigSrv', data);
}

function syncVPPServiceConfigSrv() {
  var response = VPPServiceConfigSrv();
  setVPPServiceConfigSrv(response);
}

function getToken() {
  var files = DriveApp.getFilesByName(VPP_TOKEN);
  
  var file = files.next();
  var token = file.getBlob().getDataAsString();
  
  return token;
}

function VPPServiceConfigSrv() {
  
  var url = 'https://vpp.itunes.apple.com/WebObjects/MZFinance.woa/wa/VPPServiceConfigSrv';
  
  var options =  {
    "method" : "GET",
    "contentType" : "application/json"
  };

  var response = UrlFetchApp.fetch(url, options);
  
  return response;
}

function getLicencesForDevice(serial) {
  return getVPPLicensesSrv(getToken(), serial).licenses;
}

function getVPPLicensesSrv(sToken, serial, id, batch, modified, pricing, facilitator, assigned, device, user) {
  
  var data = {
    "sToken": sToken
  };
  if ( serial ) { data["serialNumber"] = serial; }
  if ( batch ) { data["batchToken"] = batch; }
  if ( modified ) { data["sinceModifiedToken"] = modified; }
  if ( facilitator ) { data["facilitatorMemberId"] = facilitator; }
  if ( assigned == true ) { data["assignedOnly"] = assigned; }
  if ( device == true ) { data["deviceAssignedOnly"] = device; }
  if ( !device && (user == true) ) { data["userAssignedOnly"] = user; }
  if ( !batch && !modified ) {
    if ( id ) {
      data["adamId"] = id;
      if ( pricing ) {
        data["pricingParam"] = pricing;
      }
    }
  }
  
  var url = getVPPServiceConfigSrv().getLicensesSrvUrl;
  
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : JSON.stringify(data)
  };

  var response = UrlFetchApp.fetch(url, options);
  
  return JSON.parse(response);
}

function getVPPAssetsSrv(sToken, licenses, pricing, facilitator) {
  
  var data = {
    "sToken": sToken
  };
  if ( licenses == true ) {
    data["includeLicenseCounts"] = true;
  }
  if ( pricing ) {
    data["pricingParam"] = pricing;
  }
  if ( facilitator ) {
    data["facilitatorMemberId"] = facilitator;
  }
  
  var url = getVPPServiceConfigSrv().getVPPAssetsSrvUrl;
  
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : JSON.stringify(data)
  };

  var response = UrlFetchApp.fetch(url, options);
  
  return JSON.parse(response);
}

function setClientContext() {
  var data = {"hostname":getServerUrl(),"guid":Utilities.getUuid()};
  Logger.log(VPPClientConfigSrv(getToken(), data));
}

function VPPClientConfigSrv(sToken, clientContext, verbose) {
  
  var data = {
    "sToken": sToken
  };
  if ( clientContext ) {
    data["clientContext"] = JSON.stringify(clientContext);
  }
  data["verbose"] = "false";
  
  var url = getVPPServiceConfigSrv().clientConfigSrvUrl;
  
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : JSON.stringify(data)
  };

  var response = UrlFetchApp.fetch(url, options);
  
  return response;
}

function manageVPPLicensesByAdamIdSrv(sToken, id, pricing, assign, unassign, notify, facilitator) {
  
  var data = {
    "sToken": sToken,
    "adamIdStr": id,
    "pricingParam": pricing
  };
  if ( assign ) {
    if ( assign[0].length == 12 ) {
      data["associateSerialNumbers"] = assign;
    } else {
      data["associateClientUserIdStrs"] = assign;
    }
  }
  if ( unassign ) {
    if ( unassign[0].length == 12 ) {
      data["disassociateSerialNumbers"] = unassign;
    } else if ( unassign[0].length < 12 ) {
      data["disassociateLicenseIdStrs"] = unassign;
    } else {
      data["disassociateClientUserIdStrs"] = unassign;
    }
  }
  if ( notify == false ) {
    data["notifyDisassociation"] = notify;
  }
  if ( facilitator ) {
    data["facilitatorMemberId"] = facilitator;
  }
  
  var url = getVPPServiceConfigSrv().manageVPPLicensesByAdamIdSrvUrl;
  
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : JSON.stringify(data)
  };

  var response = UrlFetchApp.fetch(url, options);
  
  return response;
}

function getVppAppsForToken(sToken) {
  
  var response = getVPPAssetsSrv(sToken);
  var assets = response.assets;
  
  var apps = [];
  for ( var i=0; i<assets.length; i++ ) {
    var id = assets[i].adamIdStr;
    var pricing = assets[i].pricingParam;
    var metadata = getBasicAppData(id);
    if ( metadata ) {
      var name = metadata.name;
      var families = metadata.deviceFamilies;
      
      var data = {
        "adamIdStr": id,
        "name": name,
        "deviceFamilies": families,
        "pricingParam": pricing
      };
      apps.push(data);
    }
  }
  
  return apps;
}

function getBasicAppData(id, version) {

  if ( version ) {
    var response = metadataLookup(id, version);
  } else {
    var response = metadataLookup(id);
  }
  
  var results = response["results"];
  for ( var result in results ) {
    var data = results[result];
    var name = data.name;
    var families = data.deviceFamilies;
    return {"name": name, "deviceFamilies": families};
  }
}

function metadataLookup(id, version, platform) {
  
  var url = getVPPServiceConfigSrv().contentMetadataLookupUrl + '?p=mdm-lockup&caller=MDM&cc=us&l=en&id=' + id;
  if ( version ) {
    url += '&version=' + version;
  }
  if ( platform ) {
    url += '&platform=' + platform;
  }
    
  var options =  {
    "method" : "GET",
    "contentType" : "application/json"
  };

  var response = UrlFetchApp.fetch(url, options);
  
  return JSON.parse(response);
}
