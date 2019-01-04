function invokeMunkiInstall(udid) {
  
  if ( !udid ) {
    var device = getDeviceDataForSelectedRow();
    if ( device ) {
      var udid = device["udid"];
      if ( udid ) {
        var serial = device["serial_number"];
        var tag = device["asset_tag"];
        
        var template = HtmlService.createTemplateFromFile('munki.html');
        template.tag = tag;
        template.serial = serial;
        template.udid = udid;
        
        var html = template.evaluate()
        .setWidth(500)
        .setHeight(400)
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
        SpreadsheetApp.getUi().showModalDialog(html, ' ');
        
      } else {
        var ui = SpreadsheetApp.getUi();
        ui.alert('Unable to determine device UUID.', 'Please make sure a device row is selected, and the device is currently enrolled.', ui.ButtonSet.OK);
        return;
      }
    } else {
      var ui = SpreadsheetApp.getUi();
      ui.alert('Unable to determine device UUID.', 'Please make sure a device row is selected, and the device is currently enrolled.', ui.ButtonSet.OK);
      return;
    }
  }
}

function startMDMInvokedInstall(form) {
  
  var udid = form.udid;
  var pkg = form.pkg;
  
  if ( !pkg ) {
    return;
  }
  
  var properties = PropertiesService.getScriptProperties();
  var mdmInvoked = properties.getProperty('MDM_INVOKED');
  if ( mdmInvoked ) {
    mdmInvoked = JSON.parse(mdmInvoked);
  } else {
    mdmInvoked = {};
  }
  
  if ( mdmInvoked[udid] ) {
    mdmInvoked[udid].push(pkg);
  } else {
    mdmInvoked[udid] = [pkg];
  }
  
  properties.setProperty('MDM_INVOKED', JSON.stringify(mdmInvoked));
  
  var response = installApplication("https://" + SERVER_URL + "/repo/MDM_Invoked_Munki_Software_Install.plist", udid);
}

function runTerminalCommand(udid) {
  
  if ( !udid ) {
    var device = getDeviceDataForSelectedRow();
    if ( device ) {
      var udid = device["udid"];
      if ( udid ) {
        var serial = device["serial_number"];
        var tag = device["asset_tag"];
        
        var template = HtmlService.createTemplateFromFile('run.html');
        template.tag = tag;
        template.serial = serial;
        template.udid = udid;
        
        var html = template.evaluate()
        .setWidth(500)
        .setHeight(400)
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
        SpreadsheetApp.getUi().showModalDialog(html, ' ');
        
      } else {
        var ui = SpreadsheetApp.getUi();
        ui.alert('Unable to determine device UUID.', 'Please make sure a device row is selected, and the device is currently enrolled.', ui.ButtonSet.OK);
        return;
      }
    } else {
      var ui = SpreadsheetApp.getUi();
      ui.alert('Unable to determine device UUID.', 'Please make sure a device row is selected, and the device is currently enrolled.', ui.ButtonSet.OK);
      return;
    }
  }
}

function startRunTerminalInstall(form) {
  
  var udid = form.udid;
  var script = form.script;
  
  if ( !script ) {
    return;
  }
  
  var properties = PropertiesService.getScriptProperties();
  var runTerminal = properties.getProperty('RUN_TERMINAL');
  if ( runTerminal ) {
    runTerminal = JSON.parse(runTerminal);
  } else {
    runTerminal = {};
  }
  
  if ( runTerminal[udid] ) {
    runTerminal[udid].push(script);
  } else {
    runTerminal[udid] = [script];
  }
  
  properties.setProperty('RUN_TERMINAL', JSON.stringify(runTerminal));
  
  var response = installApplication("https://" + SERVER_URL + "/repo/MDM_Invoked_Terminal_Command.plist", udid);
}

function processInstallApplicationRequest(parameters) {
  var udid = parameters["udid"];
  if ( udid ) {
    udid = udid[0];
  }
  
  var serial = parameters["serial"];
  if ( serial ) {
    serial = serial[0];
  }
  
  var vpp = parameters["vpp"];
  if ( vpp ) {
    for ( var i=0; i<vpp.length; i++ ) {
      if ( vpp[i] == "all_assigned" ) {
        
        if ( !serial ) {
          var serial = getSerialForUDID(udid);
        }
        
        if ( serial ) {
          var response = installAllVppAppsForDevice(serial);
        } else {
          var response = {"udid": udid, "status": "error", "message": "unable to find serial for udid"};
        }
      } else {
        var response = installVPPApplication(udid, Number(vpp[i]));
      }
    }
  }
  
  return response;
}

function processGetMDMInvokedRequest(parameters) {
  var udid = parameters["udid"];
  if ( udid ) {
    udid = udid[0];
  }
  
  var properties = PropertiesService.getScriptProperties();
  var mdmInvoked = properties.getProperty('MDM_INVOKED');
  if ( mdmInvoked ) {
    mdmInvoked = JSON.parse(mdmInvoked);
    
    var response = "";
    var titles = mdmInvoked[udid];
    for ( var i=0; i<titles.length; i++ ) {
      response += titles[i] + '\n';
    }
    
    delete mdmInvoked[udid];
    properties.setProperty('MDM_INVOKED', JSON.stringify(mdmInvoked));
  }
  
  return response || "nothing requested";
}

function processRunTerminalCommandRequest(parameters) {
  var udid = parameters["udid"];
  if ( udid ) {
    udid = udid[0];
  }
  
  var properties = PropertiesService.getScriptProperties();
  var runTerminal = properties.getProperty('RUN_TERMINAL');
  if ( runTerminal ) {
    runTerminal = JSON.parse(runTerminal);
    
    var response = "";
    var commands = runTerminal[udid];
    for ( var i=0; i<commands.length; i++ ) {
      response += commands[i] + '\n';
    }
    
    delete runTerminal[udid];
    properties.setProperty('RUN_TERMINAL', JSON.stringify(runTerminal));
  }
  
  return response || "nothing requested";
}
