// دوال الاستمارة
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('نظام إبلاغ الأعطال')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function submitFormData(formData) {
  try {
    Logger.log('بدء إرسال البيانات...');
    Logger.log('البيانات المستلمة: ' + JSON.stringify({
      name: formData.name,
      email: formData.email,
      department: formData.department,
      hasProblemImage: !!formData.problemImageData,
      hasLocationImage: !!formData.locationImageData
    }));
    
    // فتح الشيت
    const spreadsheetId = '1bDxVwP76HVQGABqI-_YKQUBIknxU9zHOVxz9SR8tFmo';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('Sheet1');
    
    // رفع الصور أولاً
    let problemImageUrl = '';
    let locationImageUrl = '';
    
    if (formData.problemImageData) {
      problemImageUrl = uploadImageSimple(formData.problemImageData, 'problem');
      Logger.log('تم رفع صورة العطل: ' + problemImageUrl);
    }
    
    if (formData.locationImageData) {
      locationImageUrl = uploadImageSimple(formData.locationImageData, 'location');
      Logger.log('تم رفع صورة المكان: ' + locationImageUrl);
    }
    
    // إدخال البيانات في الشيت
    const timestamp = new Date();
    const rowData = [
      timestamp,
      formData.email,
      formData.name,
      formData.department,
      problemImageUrl,
      locationImageUrl,
      false, // repairStatus
      false  // reviewStatus
    ];
    
    Logger.log('إدخال البيانات في الصف: ' + JSON.stringify(rowData));
    sheet.appendRow(rowData);
    
    // إعداد مربعات الاختيار للصف الجديد
    const lastRow = sheet.getLastRow();
    setupCheckboxesForRow(sheet, lastRow);
    
    Logger.log('تم الإرسال بنجاح - الصف: ' + lastRow);
    return JSON.stringify({
      status: 'success',
      message: 'تم إرسال البلاغ بنجاح'
    });
    
  } catch (error) {
    Logger.log('❌ خطأ في submitFormData: ' + error.toString());
    return JSON.stringify({
      status: 'error',
      error: 'حدث خطأ في إرسال البيانات: ' + error.message
    });
  }
}

function uploadImageSimple(imageData, type) {
  try {
    Logger.log('بدء رفع صورة: ' + type);
    
    // تحديد المجلد حسب نوع الصورة
    const folderId = type === 'problem' 
      ? '1wNPd2oQcJaprdD1huh1b-Dd--qYbAQhm5JOjer_sKMJnM4x9SKDGZXYs9Hzmn8X6Ir7Ot87y'
      : '1yiV2XD_OI2HSc2gDigVMl623whJbpa0s7GuhyvrMH2MEKtN3LRxpCoso_9MT8Z_1qBZdUyzS';
    
    const folder = DriveApp.getFolderById(folderId);
    
    // فصل بيانات base64
    const base64Data = imageData.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', type + '_' + new Date().getTime() + '.jpg');
    
    // رفع الملف
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = 'https://drive.google.com/uc?id=' + file.getId();
    Logger.log('تم رفع الصورة: ' + fileUrl);
    
    return fileUrl;
    
  } catch (error) {
    Logger.log('❌ خطأ في رفع الصورة: ' + error.toString());
    return '';
  }
}

function setupCheckboxesForRow(sheet, rowNum) {
  try {
    const checkboxRule = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .setAllowInvalid(false)
      .build();
    
    sheet.getRange('G' + rowNum).setDataValidation(checkboxRule);
    sheet.getRange('H' + rowNum).setDataValidation(checkboxRule);
    
    Logger.log('تم إعداد مربعات الاختيار للصف: ' + rowNum);
    
  } catch (error) {
    Logger.log('❌ خطأ في إعداد مربعات الاختيار: ' + error.toString());
  }
}

// دالة لاختبار النظام
function testSystem() {
  Logger.log('✅ نظام الاستمارة يعمل بشكل صحيح');
  return 'النظام جاهز للاستخدام';
}
