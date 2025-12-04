function doGet(e) {
  const SHEET_NAME = "Form Responses 1";
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  // const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // A=Timestamp, B=Name, D=Booking Date
  const range = sheet.getRange("A2:D" + sheet.getLastRow());
  const values = range.getValues();

  const rows = values.map(row => {
    const [timestamp, name, , bookingDate] = row;
    if (!name) return null; // skip empty name rows
    return {
      timestamp: timestamp || null,     // Date or null
      name: name,                       // string
      bookingDate: bookingDate || null  // Date or null
    };
  }).filter(Boolean);

  const payload = JSON.stringify(rows);
  const cb = e && e.parameter && e.parameter.callback;

  if (cb) {
    return ContentService
      .createTextOutput(`${cb}(${payload})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}
