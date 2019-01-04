function syncEverything() {
  // Get the current spreadsheet data
  var sh = getDevicesSheet();
  var devices = getJsonForSheet(sh);
  
  for ( var serial in devices ) {
    updateDevicesAndSettings(devices[serial]);
  }
}

function updateDevicesAndSettings(data) {
  
  var udid = data["UDID"] || data["udid"];
  var serial = data["SerialNumber"] || data["serial_number"];
  
  var sh = getDevicesSheet();
  
  // Get Updated Device Info
  var devices = getFullDeviceInfo([serial]);
  devices[serial]["udid"] = udid;
  
  var date = new Date();
  devices[serial]["last_seen"] = date;
  
  // Get the current spreadsheet data
  var current = getJsonForSheet(sh);
  var serials = Object.keys(current);
  
  // Combine spreadsheet data with updated device info
  devices = combineJsonData(current, devices);
  
  // Set the header values
  setHeader(sh, devices);
  var mapped = getMappedHeader();
  var header = mapped[1];
  var range = sh.getRange(sh.getFrozenRows() - 1, 1, 2, header.length);
  range.setValues(mapped);
  range.setFontWeight("bold");
  
  // Map the data to the spreadsheet
  var rows = [];
  for ( var device in devices ) {
    // Map the row for the device and add it to the list
    var row = header.map(function(key){return devices[device][key]});
    for ( var j=0; j<row.length; j++ ) {
      if ( !row[j] ) {
        row[j] = "";
      }
    }
    // Add new items to the top of the list
    if ( serials.indexOf(device) == -1 ) {
      rows.unshift(row);
    } else {
      rows.push(row);
    }
  }
  
  // Set the spreadsheet values
  var range = sh.getRange(sh.getFrozenRows() + 1, 1, rows.length, header.length);
  range.setValues(rows);
  
  // Delete Empty Rows If Needed
  var maxRow = sh.getMaxRows();
  var lastRow = sh.getLastRow();
  if ( maxRow != lastRow ) {
    sh.deleteRows(lastRow+1, maxRow-lastRow);
  }
  
  // Update column widths
  formatColumnsForSheet(sh);
}

function getFullDeviceInfo(serials) {
  // Get Full Device Info (combines data from MicroMDM with the data from Apple)
  //var devs = getDevices(serials);
  var devs = {};
  var deps = getDEPDevices(serials);
  var devices = combineJsonData(devs, deps);
  
  for ( var device in devices ) {
    for ( var item in devices[device] ) {
      if ( devices[device][item] == "" ) {
        delete devices[device][item];
      }
    }
    
    // Add assigned profile information
    devices[device] = addAssignedProfile(devices[device]);
  }
  
  return devices;
}

function addAssignedProfile(device) {

  if ( device.profile_uuid ) {
    var profile = sendGetDepProfiles(device.profile_uuid);
    if ( profile ) {
      device.assigned_profile = profile.profile_name;
    }
  } else {
    device.assigned_profile = "";
  }
  
  return device;
}

function sendGetDepProfiles(uuid) {
  
  var data = {
    "uuid" : uuid
  };
  
  var url = SERVER_URL + '/v1/dep/profiles';
  
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(USER_NAME + ':' + API_PASSWORD)
  };
      
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "headers" : headers,
    "payload" : JSON.stringify(data)
  };

  var response = JSON.parse(UrlFetchApp.fetch(url, options));
  
  return response;
}

function formatColumnsForSheet(sheet) {
  
  // Left Justify
  var range = sheet.getRange(sheet.getFrozenRows() + 1, 1, sheet.getLastRow() - sheet.getFrozenRows(), sheet.getLastColumn());
  range.setHorizontalAlignment("left");
  
  // Update column widths
  var header = sheet.getRange(sheet.getFrozenRows(), 1, 1, sheet.getLastColumn()).getValues()[0];
  for ( var i=1; i<sheet.getLastColumn()+1; i++ ) {
    sheet.autoResizeColumn(i);
    if ( header[i-1] == "assigned_profile" ) {
      sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 20)
    }
  }
}

function getDevicesSheet() {
  
  var ss = SpreadsheetApp.getActive();
  
  var name = "Devices and Settings";
  var sh = ss.getSheetByName(name);
  if ( !sh ) {
    // Create Devices and Settings Sheet
    sh = ss.insertSheet(name, 0);
    
    // Remove Empty Initial Sheet if Needed
    var sheet1 = ss.getSheetByName('Sheet1');
    if ( sheet1 ) {
      if ( sheet1.getLastColumn() + sheet1.getLastRow() == 0 ) {
        ss.deleteSheet(sheet1);
      }
    }
  }
  
  if ( !sh.getLastColumn() ) {
    var header = getMappedHeader();
    var range = sh.getRange(1, 1, header.length, header[0].length);
    range.setValues(header);
    sh.setFrozenRows(header.length);
    sh.getRange(1, 1, header.length, sh.getLastColumn()).setFontWeight("bold");
    // Hide Key Row
    sh.hideRows(header.length);
  }
  
  return sh;
}

function setHeader(sh, devices) {
  
  var keys = [];
  for ( var device in devices ) {
    keys = keys.concat(Object.keys(devices[device]));
  }
  keys = keys.filter( onlyUnique );
  
  var header = sh.getRange(sh.getFrozenRows(), 1, 1, sh.getLastColumn()).getValues()[0];
  header = header.concat(keys).filter ( onlyUnique );
  
  var titles = sh.getRange(sh.getFrozenRows() - 1, 1, 1, sh.getLastColumn()).getValues()[0];
  
  while ( header.length != titles.length ) {
    if ( header.length < titles.length ) {
      header.push("");
    }
    if ( titles.length < header.length ) {
      titles.push("");
    }
  }
  setMappedHeader(titles, header);
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function setMappedHeader(titles, header) {

  var map = {};
  for ( var i=0; i<header.length; i++ ) {
    map[header[i]] = titles[i];
  }
  
  var properties = PropertiesService.getScriptProperties();
  properties.setProperty('HEADER', JSON.stringify(map));
}

function getMappedHeader() {
  
  var properties = PropertiesService.getScriptProperties();
  var map = properties.getProperty('HEADER');
  
  if ( map ) {
    map = JSON.parse(map);
  } else {
    map = {
      "serial_number": "Serial",
      "asset_tag": "Asset Tag",
      "assigned_profile": "DEP Profile",
      "model": "Model",
      "profile_status": "Profile Status",
      "udid": "Device UDID",
      "last_seen": "Last Seen",
      "profile_uuid": "Profile UUID",
      "profile_assign_time": "Profile Assign Time",
      "profile_push_time": "Profile Push Time",
      "device_assigned_date": "Device Assigned Date",
      "device_assigned_by": "Device Assigned By",
      "description": "Device Description",
      "color": "Device Color",
      "os": "OS",
      "device_family": "Device Family",
      "op_date": "Purchase Date"
    };
  }
  
  var titles = [];
  for ( var item in map ) {
    titles.push(map[item]);
  }
  var header = [titles,Object.keys(map)];
  
  return header;
}

function combineJsonData(first, second) {
  
  for ( var item in second ) {
    if ( first[second[item].serial_number] ) {
      var row = first[second[item].serial_number];
    } else {
      var row = second[item];
    }
    if ( row ) {
      for ( var info in second[item] ) {
        row[info] = second[item][info];
      }
      first[second[item].serial_number] = row;
    }
  }
  
  return first;
}

function getJsonForSheet(sheet) {
  
  var keys = sheet.getRange(sheet.getFrozenRows(), 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var data = sheet.getRange(sheet.getFrozenRows()+1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  
  var rows = {};
  for ( var i=0; i<data.length; i++ ) {
    var json = {};
    for ( var j=0; j<keys.length; j++ ) {
      json[keys[j]] = data[i][j];
    }
    if ( json.serial_number ) {
      rows[json.serial_number] = json;
    }
  }
  
  return rows;
}

function formatDate(string) {

  var date = string.split(".")[0];
  if ( string.split(".")[1] ) {
    date = date + 'Z';
  }

  if ( date == "0001-01-01T00:00:00Z" ) {
    return "";
  } else {
    date = new Date(date);
  }
  
  if ( Utilities.formatDate(date, 'Etc/GMT', 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'') != "1970-01-01T00:00:00.000Z" ) {
    return Utilities.formatDate(date, 'America/Chicago', 'yyyy, dd MMMM - HH:mm:ss');
  }
}

function getDEPDevices(serials) {
  // Sync DEP Devices from Apple and Wait For Response
  depSyncNow();
  Utilities.sleep(5000);
  
  // Get the Full List of Serials if None Specified
  if ( !serials ) {
    var serials = Object.keys(getDevices());
  }
  
  // Get DEP Device Information from Apple
  var devices = sendGetDEPDevices(serials);
  if ( !devices ) {
    return {};
  }
  
  return formatDepResponse(devices);
}

function depSyncNow() {
  
  var data = {};
  
  var url = SERVER_URL + '/v1/dep/syncnow';
  
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(USER_NAME + ':' + API_PASSWORD)
  };
  
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "headers" : headers,
    "payload" : JSON.stringify(data)
  };

  UrlFetchApp.fetch(url, options);
}

function testSendGetDEPDevices() {
  Logger.log(sendGetDEPDevices(["C02JDFA1DTY3"]));
}

function sendGetDEPDevices(serials) {
  
  var data = {
    "serials" : serials
  };
  
  var url = SERVER_URL + '/v1/dep/devices';
  
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(USER_NAME + ':' + API_PASSWORD)
  };
      
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "headers" : headers,
    "payload" : JSON.stringify(data)
  };

  var response = JSON.parse(UrlFetchApp.fetch(url, options));
  var devices = response.devices;
  
  return devices;
}

function formatDepResponse(devices) {
  
  for ( var device in devices ) {
    if ( devices[device].profile_status == "" ) {
      devices[device].serial_number = device;
      devices[device].profile_status = "DEP REMOVED";
      devices[device].device_assigned_by = "";
    }
    
    devices[device].profile_assign_time = formatDate(devices[device].profile_assign_time);
    devices[device].profile_push_time = formatDate(devices[device].profile_push_time);
    devices[device].device_assigned_date = formatDate(devices[device].device_assigned_date);
    devices[device].op_date = formatDate(devices[device].op_date);
    
    if ( !devices[device].profile_uuid ) {
      devices[device].profile_uuid = "";
    }
  }
  
  return devices;
}
