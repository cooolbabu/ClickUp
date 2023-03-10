
/*
  Google AppScript attached to a Spreasheet. This module can read rows and create Tasks in ClickUp using REST Api.
  Options for running - Manual, Schedule or Event based
*/

function createTasksInClickUp() {

  // Create / empty the target sheet
  var sheetName = "Sheet1";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, ss.getSheets().length);
  var fromDateTime = new Date(sheet.getRange(1, 1, 1, 8).getCell(1, 1).getValue());

  const secondsSinceEpoch = (date) => Math.floor(date.getTime()).toString();

  var values = sheet.getSheetValues(1, 1, 7, 8);
  Logger.log(values);


  for (var i = 1; i < sheet.getMaxRows() &&  i<5; i++) {
      custName = values[i][0];
      orderId = values[i][1];
      orderDesc = values[i][2];
      orderAmt = values[i][3];
      orderDate = new Date(values[i][4]);
      deliveryDate = new Date(values[i][5]);
      orderEntryDate = new Date(values[i][6]);

      if (values[i][7] == 'No') {
          Logger.log("Customer: %s, OrderId: %s, orderAmt: %s, orderDate: %s, deliveryDate: %s ", 
              custName, orderId, orderAmt, secondsSinceEpoch(orderDate), secondsSinceEpoch(deliveryDate));

          createTaskRequest = createRequestJsonObject(custName, orderId, orderDesc, orderAmt, 
              secondsSinceEpoch(orderDate), secondsSinceEpoch(deliveryDate));

          Logger.log("Value of i is : %s and createTaskRequest is %s", i, createTaskRequest);


          sheet.getRange(1,1,i+1,8).getCell(i+1,8).setValue("Yes");

          if (callClickUpCreateTask(createTaskRequest))
            sheet.getRange(1,1,i,8).getCell(i,8).setValue("Yes");
      }
      //Logger.log("Task creation response Code: ", responseCode);
  }
  
  sheet.getRange("A:H").sort({ column: 8, ascending: true });
  sheet.getRange("H1").setValue(Utilities.formatDate(new Date(), 'America/Chicago', 'dd MMM yyyy HH:mm:ss Z'));

}

// There is an issue with response on UrlFetchApp.fetch(), where errors are not in the right format. Need to look into this.
// Custom fields are not getting populated. Noticed the same in Chrome Extension
// It works in Make. There is another API call to set Custom fields. I guess you need to make that second call to set Custom fields

function callClickUpCreateTask(createTaskRequest){

  // List id is hardcoded. Can be made flexible - drill down from spaces or calling a known task
  const URL = 'https://api.clickup.com/api/v2/list/901000149801/task';
  var options = {
      'method' : 'post',
      
      'headers' : {
            'Authorization': '<API Token>',
            'Content-Type': 'application/json'
          },
    
      'payload' : JSON.stringify(createTaskRequest),
      'muteHttpExceptions': false
  };

  console.log("Request object: ", JSON.stringify(createTaskRequest));

  try {
    var response = UrlFetchApp.fetch(URL, options);
    return true;
  }    
    catch(err){
      console.log(err);
      return false;
    };
}

  /*
  
  Function to create a JSON object for task creation in ClickUp. This can be passed as a request to ClickUp REST Api.  
  This is request builds a request based on the template associated with the List

  Custom fields are kind of hard coded. They don't seem to work with Postman either. Need further investigation


  */

  function createRequestJsonObject(custName, orderId, orderDesc, orderAmt, orderDate, deliveryDate){

  const requestJson = '{ "name": "","status": "to do","content": "","list_id": "901000149801","team_id": "9010006453","due_date": 1672969194377,   "priority": 3,"space_id": "90100015887","assignees": [38267854],"folder_id": "90100083457","notify_all": false,"start_date": 1672969194377,        "custom_fields": {"2125f255-d18a-435b-a154-5b76f91f92c2": 1672969194377,"7c42cb2f-df17-4b6d-a107-c4c1d1539575": 9999,       "e5dd3988-ad3c-4f89-90d5-b0d59bc63b6c": 1672969194377},"due_date_time": false,"start_date_time": false}';

  var reqObj = JSON.parse(requestJson);
  reqObj.name = custName + " :: " + orderId;
  reqObj.content = orderDesc;
  reqObj.start_date = orderDate;
  reqObj.due_date = deliveryDate;
  reqObj.custom_fields["7c42cb2f-df17-4b6d-a107-c4c1d1539575"] = orderAmt;
  reqObj.custom_fields["2125f255-d18a-435b-a154-5b76f91f92c2"] = orderDate;
  reqObj.custom_fields["e5dd3988-ad3c-4f89-90d5-b0d59bc63b6c"] = deliveryDate;

  return reqObj;
 }
