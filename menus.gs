function onOpen(e) {
  var ss = SpreadsheetApp.getActive();
  var name = "Setup Instructions";
  var sh = ss.getSheetByName(name);
  if ( !sh ) {
    createMenu();
  } else {
    createSetupMenu();
  }
}

function createMenu() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SheetsMDM')
  .addSubMenu(
    ui.createMenu('Run Command')
    .addItem('Invoke Munki Install', 'invokeMunkiInstall')
    .addItem('Run Terminal Command', 'runTerminalCommand')
    .addItem('Available OS Updates', 'availableOSUpdates')
    .addItem('Certificate List', 'certificateList')
    .addItem('Device Information', 'deviceInformation')
    .addItem('Installed Application List', 'installedApplicationList')
    .addItem('OS Update Status', 'osUpdateStatus')
    .addItem('Profile List', 'profileList')
    .addItem('Provisioning Profile List', 'provisioningProfileList')
    .addItem('Restart Device', 'restartDevice')
    .addItem('Schedule OS Update', 'scheduleOSUpdate')
    .addItem('Schedule OS Update Scan', 'scheduleOSUpdateScan')
    .addItem('Security Info', 'securityInfo')
    .addItem('Shut Down Device', 'shutDownDevice')
    .addItem('Status Update', 'pushNotify')
  )
  .addItem('Sync', 'syncEverything')
  .addToUi();
}

function createSetupMenu() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SheetsMDM')
  .addItem('Setup...', 'setupAndAuthorize')
  .addToUi();
  ui.alert('GusDay SheetsMDM Example Setup', 'Follow the instructions on the "Setup Instructions" sheet to set up your SheetsMDM instance.', ui.ButtonSet.OK);
}

function setupAndAuthorize() {
  getDevicesSheet();
  createDeviceResponsesSheet();
  var ui = SpreadsheetApp.getUi();
  ui.alert('Authorization Finished', 'Please continue with step 6 of the Setup Instructions.', ui.ButtonSet.OK);
  createMenu();
}
