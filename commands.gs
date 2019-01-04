// These functions send API calls to the micromdm server to run commands
//
// Available Commands (* indicates not documented in MicroMDM Github)
//
// SendPushNotification (function of MicroMDM)
//
// **AccountConfiguration (NOT HERE - Set through Blueprints)
// AvailableOSUpdates
// CertificateList
// *DeleteUser (iOS ONLY - NOT TESTED)
// DeviceInformation
// DeviceLock
// *DeviceName
// *EraseDevice
// InstallApplication
// InstallEnterpriseApplication (NOT TESTED)
// InstallProfile (NOT TESTED)
// InstallProvisioningProfile (NOT TESTED)
// InstalledApplicationList
// TODO (MAYBE) - InviteToProgram
// TODO (MAYBE) - LostMode
// *LogOutUser (iOS ONLY - NOT TESTED)
// TODO - Managed App Configuration
// OSUpdateStatus
// ProfileList
// ProvisioningProfileList (PARTIALLY TESTED)
// RemoveProfile (NOT TESTED)
// RemoveProvisioningProfile (NOT TESTED)
// RestartDevice
// TODO - RequestMirroring and StopMirroring
// TODO - Restrictions
// TODO (MAYBE) - RotateFileVaultKey
// ScheduleOSUpdate
// ScheduleOSUpdateScan
// SecurityInfo
// *SetAutoAdminPassword
// *SetFirmwarePassword
// *ShutDownDevice
// TODO (MAYBE) - UnlockUserAccount
// *VerifyFirmwarePassword

function availableOSUpdates(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Request Check for Available Updates Response');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "AvailableOSUpdates",
    "udid": udid
  };
  
  return sendCommand(data);
}

function certificateList(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Request Certificate List Response');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "CertificateList",
    "udid": udid
  };
  
  return sendCommand(data);
}

function deleteUser(username, udid, force) {
  
  var data = {
    "request_type": "DeleteUser",
    "username": username,
    "udid": udid
  };
  if ( force ) {
    data["force"] = force;
  }
  
  return sendCommand(data);
}

function deviceInformation(udid, queries) {
  
  // Example "queries" parameter
  // queries = [
  //   "OSVersion",
  //   "Model",
  //   "SerialNumber"
  // ];
  
  if ( !udid ) {
    udid = getSelectedUDID('Request Device Info Response');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "DeviceInformation",
    "udid": udid
  };
  
  if ( queries ) {
    data["queries"] = queries;
  }
  
  return sendCommand(data);
}

function deviceLock(pin, udid, message, phone) {
  
  var data = {
    "request_type": "DeviceLock",
    "udid": udid,
    "pin": pin
  };
  // Message and Phone do not show up on Mac, not tested elsewhere
  if ( message ) {
    data["message"] = message;
  }
  if ( phone ) {
    data["phone_number"] = phone;
  }
  
  return sendCommand(data);
}

function deviceName(name, udid) {
  
  var data = {
    "request_type": "Settings",
    "Settings": [
      {
        "Item": "DeviceName",
        "device_name": name
      },
      {
        "Item": "HostName",
        "HostName": name
      }
    ],
    "udid": udid
  }
  
  return sendCommand(data);
}

function eraseDevice(pin, udid) {
  // Doesn't work with Parallels
  var data = {
    "request_type": "EraseDevice",
    "udid": udid,
    "pin": pin
  };
  
  return sendCommand(data);
}

function installVPPApplication(udid, itunes) {
  return installApplication(null, udid, itunes, {"purchase_method": 1});
}

function installApplication(url, udid, itunes, options, system, flags, config, attrib, state) {
  
  var data = {
    "request_type": "InstallApplication",
    "udid": udid
  };
  if ( url ) {
    data["manifest_url"] = url;
  }
  if ( itunes ) {
    data["itunes_store_id"] = itunes;
  }
  if ( options ) {
    data["options"] = options;
  }
  if ( system ) {
    data["identifier"] = system;
  }
  if ( flags ) {
    data["management_flags"] = flags;
  }
  if ( config ) {
    data["configuration"] = config;
  }
  if ( attrib ) {
    data["attributes"] = attrib;
  }
  if ( state == true) {
    data["change_management_state"] = "Managed";
  }
  
  return sendCommand(data);
}

function installEnterpriseApplication(url, udid) {
  
  var data = {
    "request_type": "InstallEnterpriseApplication",
    "manifest_url": url,
    "udid": udid
  };
  
  return sendCommand(data);
}

function installProfile(profile, udid) {
  
  var data = {
    "request_type": "InstallProfile",
    "payload": profile,
    "udid": udid
  };
  
  return sendCommand(data);
}

function installProvisioningProfile(profile, udid) {
  
  var data = {
    "request_type": "InstallProvisioningProfile",
    "provisioning_profile": profile,
    "udid": udid
  };
  
  return sendCommand(data);
}

function installedApplicationList(udid, identifiers, managed) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Get Installed Applications');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "InstalledApplicationList",
    "udid": udid
  };
  // These only work in iOS, not sure about tvOS
  if ( identifiers ) {
    data["identifiers"] = identifiers;
  }
  if ( managed ) {
    data["managed_apps_only"] = managed;
  }
  
  return sendCommand(data);
}

function logOutUser(udid) {
  
  var data = {
    "request_type": "LogOutUser",
    "udid": udid
  };
  
  return sendCommand(data);
}

function osUpdateStatus(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Request OS Update Status Response');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "OSUpdateStatus",
    "udid": udid
  };
  
  return sendCommand(data);
}

function profileList(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Request Profile List Response');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "ProfileList",
    "udid": udid
  };
  
  return sendCommand(data);
}

function provisioningProfileList(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Request Provisioning Profile List Response');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "ProvisioningProfileList",
    "udid": udid
  };
  
  return sendCommand(data);
}

function removeProfile(id, udid) {
  
  var data = {
    "request_type": "RemoveProfile",
    "identifier": id,
    "udid": udid
  };
  
  return sendCommand(data);
}

function removeProvisioningProfile(profile_uuid, udid) {
  
  var data = {
    "request_type": "RemoveProvisioningProfile",
    "uuid": profile_uuid,
    "udid": udid
  };
  
  return sendCommand(data);
}

function restartDevice(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Restart Device');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "RestartDevice",
    "udid": udid
  };
  
  return sendCommand(data);
}

function scheduleOSUpdate(udid, updates) {
  
  // Example "updates" parameter
  // updates = [
  //   {"product_key": key, "install_action": action},
  //   {"product_key": key, "install_action": action}
  // ];
  
  if ( !udid ) {
    udid = getSelectedUDID('Schedule OS Update');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "ScheduleOSUpdate",
    "udid": udid
  };
  if ( updates ) {
    data["updates"] = updates;
  }
  
  return sendCommand(data);
}

function scheduleOSUpdateScan(udid, force) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Schedule OS Update Scan');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "ScheduleOSUpdateScan",
    "udid": udid
  };
  if ( force != undefined ) {
    data["force"] = force;
  }
  
  return sendCommand(data);
}

function securityInfo(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Request Security Info Response');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "SecurityInfo",
    "udid": udid
  };
  
  return sendCommand(data);
}

function setFirmwarePassword(udid, newPass, oldPass, allowOroms) {
  
  var data = {
    "request_type": "SetFirmwarePassword",
    "new_password": newPass,
    "udid": udid
  };
  if ( oldPass ) {
    data["current_password"] = oldPass;
  }
  if ( allowOroms ) {
    data["allowOroms"] = allowOroms;
  }
  
  return sendCommand(data);
}

function shutDownDevice(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Shut Down Device');
    if ( !udid ) {
      return;
    }
  }
  
  var data = {
    "request_type": "ShutDownDevice",
    "udid": udid
  };
  
  return sendCommand(data);
}

function verifyFirmwarePassword(udid, passwd) {
  
  var data = {
    "request_type": "VerifyFirmwarePassword",
    "password": passwd,
    "udid": udid
  };
  
  return sendCommand(data);
}

function sendCommand(data) {
   var url = SERVER_URL + '/v1/commands';
  
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(USER_NAME + ':' + API_PASSWORD)
  };
  
  var options =  {
    "method" : "POST",
    "contentType" : "application/json",
    "headers" : headers,
    "payload" : JSON.stringify(data)
  };

  var response = UrlFetchApp.fetch(url, options);
  var obj = JSON.parse(response);
  
  return obj;
}

function pushNotify(udid) {
  
  if ( !udid ) {
    udid = getSelectedUDID('Push Checkin for Status');
    if ( !udid ) {
      return;
    }
  }
  
  var url = SERVER_URL + '/push/' + udid;
  
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(USER_NAME + ':' + API_PASSWORD)
  };
  
  var options =  {
    "method" : "GET",
    "contentType" : "application/json",
    "headers" : headers
  };

  var response = UrlFetchApp.fetch(url, options);
  
  return response;
}

function getSelectedUDID(message) {
  var ui = SpreadsheetApp.getUi();
  
  var device = getDeviceDataForSelectedRow();
  if ( device ) {
    var udid = device["udid"];
    if ( udid ) {
      var serial = device["serial_number"];
      var tag = device["asset_tag"];
      
      var response = ui.alert(message, 'Selected Device:\n' + tag + ' | ' + serial + ' | ' + udid, ui.ButtonSet.OK_CANCEL);
      if (response == ui.Button.OK) {
        return udid;
      } else {
        return;
      }
    }
  }
  
  ui.alert('Unable to determine device UUID.', 'Please make sure a device row is selected, and the device is currently enrolled.', ui.ButtonSet.OK);
}

function getDeviceDataForSelectedRow() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getActiveSheet();
  
  var data = getJsonForSheet(sh);
  
  var range = ss.getActiveRange();
  var header = sh.getRange(sh.getFrozenRows(), 1, 1, sh.getLastColumn()).getValues()[0];
  for ( var i=0; i<header.length; i++ ) {
    if ( header[i] == "serial_number" ) {
      var serial = sh.getRange(range.getRow(), i+1, 1, 1).getValue();
    }
  }
  return data[serial];
}
