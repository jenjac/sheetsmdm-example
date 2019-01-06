function processAutoRun(data) {
  
  if ( data["Status"] == "NotNow" ) {
    return;
  }
  
  var type = getResponseType(data);
  
  var uuid = data.CommandUUID;
  
  if ( type == "Authenticate" ) {
    respondToAuthenticate(data);
  } else if ( type == "Status" ) {
    respondToStatus(data);
  }
}

function getResponseType(data) {
  
  if ( data["MessageType"] ) {
    var type = data["MessageType"];
  } else if ( data["QueryResponses"] ) {
    var type = "DeviceInformation";
  } else if ( data["SecurityInfo"] ) {
    var type = "SecurityInfo";
  } else if ( data["UserConfiguration"] ) {
    var type = "AccountConfiguration";
  } else if ( data["CommandUUID"] ) {
    var type = "Command";
  } else if ( data["Status"] ) {
    var type = "Status";
  }
  
  return type || "UNKNOWN";
}

function respondToAuthenticate(data) {
  
  var udid = data.UDID;
  var serial = data.SerialNumber;
  var device = data.DeviceName || "";
  var product = data.ProductName || "";
  
  if ( device.indexOf("Mac") == 0 ) {
    deviceInformation(udid);
  } else if ( product.indexOf("AppleTV") == 0 ) {
    // Apple TV Requires Specific Queries
    deviceInformation(udid, ["DeviceName","OSVersion","BuildVersion","ModelName","Model","ProductName","SerialNumber","DeviceID","BluetoothMAC","WiFiMAC"]);
  }
  
  updateDevicesAndSettings(data);
  
  if ( VPP_TOKEN ) {
    syncVPPServiceConfigSrv();
    assignStandardAppsToDevice(serial);
    
    // Comment this out if you don't want your VPP apps to install automatically.
    installAllVppAppsForDevice(serial, udid);
  }
}

function respondToStatus(data) {
  updateDevicesAndSettings(data);
}

//this is a function that fires when the webapp receives a POST request
//POST requests from MicroMDM come in as encoded plist files which are converted to JSON
function doPost(e) {
  
  // This is required to read the data properly
  e = JSON.stringify(e);
  e = JSON.parse(e);
  
  var post_data = JSON.parse(e.postData.contents);
  
  var event = post_data["acknowledge_event"] || post_data["checkin_event"];
  
  var payload = event.raw_payload;
  var udid = event.udid;
  
  if ( payload ) {
    var text = Utilities.newBlob(Utilities.base64Decode(payload)).getDataAsString();
    var document = XmlService.parse(text);
    var xml = XmlService.getCompactFormat().format(document);
    var data = processXML(xml);
    
    if ( data ) {
      
      var tag = udid;
      tag = tag.toString();
      
      var type = getResponseType(data);
      
      var values = [
        tag,
        type,
        JSON.stringify(e),
        xml.replace('\r\n', '').replace('\n','').replace('\r','').trim(),
        JSON.stringify(data)
      ];
      
      outputDeviceResponse(values);
      processAutoRun(data);
    }
  }
  
  var response = ContentService.createTextOutput(JSON.stringify(e) + '\n');
  response.setMimeType(ContentService.MimeType.JSON);
  
  return response;
}

//this is a function that fires when the webapp receives a GET request

function doGet(e) {
  
  var parameters = e["parameters"];
  if ( Object.keys(parameters).length > 0 ) {
    
    var action = parameters["action"];
    if ( action ) {
      for ( var i=0; i<action.length; i++ ) {
        if ( action[i] == "InstallApplication" ) {
          var request = processInstallApplicationRequest(parameters);
        } else if ( action[i] == "GetMDMInvoked" ) {
          var request = processGetMDMInvokedRequest(parameters);
        }
      }
    }
    
    if ( request ) {
      var response = ContentService.createTextOutput(JSON.stringify(request) + '\n');
    } else {
      var response = ContentService.createTextOutput(JSON.stringify(e) + '\n');
    }
  } else {
    var message = {"status": "success", "message": "Web App Enabled Successfully"};
    var response = ContentService.createTextOutput(JSON.stringify(message) + '\n');
  }
  
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}

function processXML(xml) {
  var document = XmlService.parse(xml);
  var root = document.getRootElement();
  var dict = root.getChildren()[0];
  
  var data = parseDict(dict);
  
  return data;
}

function parseDict(dict) {
  
  var data = {};
  
  var keys = dict.getChildren();
  for ( var i=0; i<keys.length; i++ ) {
    if ( keys[i].getName() == "key" ) {
      data[keys[i].getText()] = parseItem(keys[i+1]);
      i++;
    }
  }
  
  return data;
}

function parseItem(item) {
  
  var name = item.getName();
  if ( name == "dict" ) {
    return parseDict(item);
  } else if ( name == "array" ) {
    return parseArray(item);
  } else if ( name == "real" || name == "integer") {
    return Number(item.getText());
  } else if ( name == "true" ) {
    return true;
  } else if ( name == "false" ) {
    return false;
  } else {
    return item.getText();
  }
}

function parseArray(array) {
  
  var data = [];
  var keys = array.getChildren();
  for ( var i=0; i<keys.length; i++ ) {
    data.push(parseItem(keys[i]));
  }
  return data;
}

function outputDeviceResponse(values) {
  var ss = SpreadsheetApp.getActive();
  var name = "Device Responses";
  var sh = ss.getSheetByName(name);
  if ( !sh ) {
    createDeviceResponsesSheet();
  }
  
  if ( values ) {
    sh.insertRowAfter(sh.getFrozenRows());
    var row = sh.getFrozenRows() + 1;
    var range = sh.getRange(row, 1, 1, 5);
    range.setFontWeight('normal');
    range.setValues([values]);
    SpreadsheetApp.flush();
  }
}

function createDeviceResponsesSheet() {
  var ss = SpreadsheetApp.getActive();
  var name = "Device Responses";
  sh = ss.insertSheet(name);
  
  sh.getRange(1,1,1,5).setValues([["Device","Request Type","Full Server Response","Response Plist","Response Data"]])
  .setFontWeight("bold");
  sh.setFrozenRows(1);
  
  var blankSheet = ss.getSheetByName("Sheet1");
  if ( blankSheet ) {
    ss.deleteSheet(blankSheet);
  }
}
