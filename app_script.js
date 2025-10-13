function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const rawHeaders = data.shift();
  const timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  
  // Format headers to match the "d MMM, yy" format from the frontend.
  const headers = rawHeaders.map(header => {
    if (header instanceof Date) {
      // This is the line that formats the date correctly.
      return Utilities.formatDate(header, timezone, "d MMM, yy");
    } else if (typeof header === 'string') {
      return header.trim();
    }
    return header;
  });

  const columns = {};
  headers.forEach(header => {
    if (header) {
      columns[header] = [];
    }
  });

  data.forEach(row => {
    headers.forEach((header, index) => {
      if (header && row[index]) {
        columns[header].push(row[index]);
      }
    });
  });

  return ContentService.createTextOutput(JSON.stringify(columns))
    .setMimeType(ContentService.MimeType.JSON);
}
