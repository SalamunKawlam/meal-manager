function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Get data only from columns A and B, starting from row 2 to the last row.
  const range = sheet.getRange("A2:B" + sheet.getLastRow());
  const values = range.getValues();

  const data = values.map(row => {
    // Ensure we don't process empty rows
    if (row[0] || row[1]) {
      return {
        timestamp: row[0], // Column A
        name: row[1]       // Column B
      };
    }
  }).filter(item => item); // Filter out any empty rows that might have been processed

  // Safely handle the JSONP callback
  const callback = e && e.parameter ? e.parameter.callback : null;
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Fallback for direct access or non-JSONP requests
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
