# PendIt

PendIt is a lightweight issue tracking application that uses Google Sheets as a backend database via Google Apps Script.

## Setup Instructions

To connect this app to your own Google Sheet, follow these steps:

### 1. Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name the first sheet exactly **Issues** (case-sensitive).
3. Add the following headers in the first row (A1 to I1):
   - `id`
   - `title`
   - `outlet`
   - `reason`
   - `dateReported`
   - `status`
   - `notes`
   - `timeLimitDays`
   - `photo`

### 2. Add the Google Apps Script
1. In your Google Sheet, click on **Extensions** > **Apps Script**.
2. Delete any code in the script editor and paste the following code:

```javascript
const SCRIPT_PROP = PropertiesService.getScriptProperties();

function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty("key", doc.getId());
}

function doGet(e) {
  try {
    const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    const sheet = doc.getSheetByName("Issues");
    
    if (!sheet) {
      throw new Error("Sheet named 'Issues' not found");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const issues = rows.map(row => {
      let issue = {};
      headers.forEach((header, index) => {
        issue[header] = row[index];
      });
      return issue;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(issues))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    const sheet = doc.getSheetByName("Issues");
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'add') {
      const issue = data.issue;
      sheet.appendRow([
        issue.id,
        issue.title,
        issue.outlet,
        issue.reason,
        issue.dateReported,
        issue.status,
        issue.notes,
        issue.timeLimitDays,
        issue.photo || ""
      ]);
    } else if (data.action === 'resolve') {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          sheet.getRange(i + 1, 6).setValue('Resolved');
          break;
        }
      }
    } else if (data.action === 'delete') {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### 3. Deploy the Script
1. Click the **Run** button at the top (select the `setup` function first). Review and accept the permissions.
2. Click **Deploy** > **New deployment** in the top right.
3. Click the gear icon next to "Select type" and choose **Web app**.
4. Set the following:
   - **Description**: `PendIt API v1` (or anything you like)
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. Click **Deploy**.
6. Copy the **Web app URL**.

### 4. Connect the App
1. Create a `.env` file in the root of your project.
2. Add your Web app URL to the file:
   ```
   VITE_GAS_URL=your_copied_web_app_url_here
   ```
3. Run your development server!
