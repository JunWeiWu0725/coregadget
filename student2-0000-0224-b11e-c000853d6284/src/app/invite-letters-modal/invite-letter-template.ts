export const inviteLetterStyle = `
  <style type="text/css">
    body {
      max-width: 800px;
      margin: 0 auto;
      font-family: "標楷體",  DFKai-sb, BiauKai;
    }
    table {
      border-collapse: collapse;
      border-spacing: 0px;
      width: 100%;
    }
    table, th, td {
      padding: 10px;
      border: 1px solid black;
    }
    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
    h1 {
      margin: 0;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      line-height: 1.5;
    }
    h2 {
      margin: 0;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      line-height: 1.5;
    }
    hr {
      border: 0;
      border-bottom: 1px dashed black;
    }
    .text-indent {
      text-indent: 2em;
    }
    .student-page {
      border: 1px solid black;
      padding: 40px;
      height: 1100px;
      margin: 20px 0px;
    }
    @media print {
      .student-page {
        break-before: page;
        padding: 5px;
        border: none;
        height: auto;
        margin: 0;
      }
      
      @page {
        size: A4;
      }
    }
 
  </style>`;

export const inviteLetterBody = `
  <div class="student-page">
    <h1 style="text-align: center">{{學校名稱}}</h1>
    <h1 style="text-align: center">{{APPName}} 家長行動應用邀請函</h1>
    <br />
      <div style="display: flex; justify-content: space-between; gap: 10px">
        <div style="flex: grow">
          <p>親愛的 {{學生姓名}} 同學的家長您好，</p>
          <p class="text-indent">隨著新學期的開始，我們誠摯邀請您透過智慧手機下載「{{APPName}}」。透過{{APPName}}，您將能即時掌握您孩子的在校表現及便利地使用校園行動應用服務。這將有助於您時刻關注孩子的學習進展並支持他們的成長。</p>
          <p style="text-align: center"><strong>手機掃描右方QR code</strong><strong>・</strong><strong>立即免費安裝{{APPName}}</strong></p>
        </div>
        {{AppQRcode}}
      </div>
    <br />
    <table>
      <tbody>
        <tr>
          <td colspan="2" rowspan="3" style="width: 40%; text-align: center">
            <p style="text-align: center"><strong>親子綁定 QR code</strong></p>
            {{QRcode}}
            <p>※請使用APP內親子綁定功能掃描</p>
            </td>
          <td colspan="2">
            <p>姓名：{{學生姓名}}</p>
          </td>
          <td colspan="2">
            <p>年級：{{年級}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <p>班級：{{班級名稱}}</p>
          </td>
          <td colspan="2">
            <p>座號：{{座號}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <p>家長代碼：{{家長代碼}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="6">
            <p class="text-indent">{{支援資訊}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="6">
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 50%; text-align: center">
                <p><strong>操作說明</strong></p>
                <p>{{操作說明URL}}</p>
                <img src="https://devapi.1campus.net/api/code/qrcode/img?chld=M&chs=232x232&cht=qr&choe=UTF-8&chl={{操作說明URL}}"  style="width: 120px; height: 120px">
              </div>
              <div style="width: 50%; text-align: center">
                <p><strong>Line客服</strong></p>
                <p>{{Line客服URL}}</p>
                <img src="https://devapi.1campus.net/api/code/qrcode/img?chld=M&chs=232x232&cht=qr&choe=UTF-8&chl={{Line客服URL}}"  style="width: 120px; height: 120px">
              </div>
            </div>
            <p style="text-align: end"><strong>{{學校名稱}}</strong></p>
            <p>*{{APPName}} 最低系統需求為 iOS 13.0 或 Android 10 以上</p>
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <hr />
    <br />
    <h2>{{APPName}} 安裝確認回執聯</h2>
    <table>
      <tbody>
        <tr>
          <td>
            <p>請勾選：</p>
            <p>☐ 已下載並完成親子綁定</p>
            <p>☐ 未下載安裝</p>
          </td>
          <td>
            <p>班級：{{班級名稱}}</p>
            <p>座號：{{座號}}</p>
            <p>姓名：{{學生姓名}}</p>
          </td>
          <td>
            <p>家長簽名：</p>
            <p>　</p>
            <p>　</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
`;

export const inviteLetterBodyWithStyle = `
  <div class="student-page" style="font-family: "標楷體",  DFKai-sb, BiauKai;">
    <h1 style="margin: 0; font-size: 20px; font-weight: bold; line-height: 1.5; text-align: center;">{{學校名稱}}</h1>
    <h1 style="margin: 0; font-size: 20px; font-weight: bold; line-height: 1.5; text-align: center;">{{APPName}}家長行動應用邀請函</h1>
    <table style="display: flex; justify-content: space-between; gap: 10px">
      <td style="flex: grow">
        <p style="margin: 0; font-size: 16px; line-height: 1.5;">親愛的 {{學生姓名}} 同學的家長您好，</p>
        <p class="text-indent" style="margin: 0; font-size: 16px; line-height: 1.5; text-indent: 2em;">隨著新學期的開始，我們誠摯邀請您透過智慧手機下載「{{APPName}}」。透過{{APPName}}，您將能即時掌握您孩子的在校表現及便利地使用校園行動應用服務。這將有助於您時刻關注孩子的學習進展並支持他們的成長。</p>
        <p style="margin: 0; font-size: 16px; line-height: 1.5; text-align: center;"><strong>手機掃描右方QR code</strong><strong>・</strong><strong>立即免費安裝{{APPName}}</strong></p>
      </td>
      <td>
      <img src="https://1campus.net/assets/img/qr_next.png" width="120" height="120">
      </td>
    </table>
    <table style="border-collapse: collapse; border-spacing: 0px; width: 100%; padding: 10px; border: 1px solid black;" width="100%">
      <tbody>
        <tr>
          <td colspan="2" rowspan="3" style="padding: 10px; border: 1px solid black; width: 40%; text-align: center;" width="40%" align="center">
            <p style="margin: 0; font-size: 16px; line-height: 1.5; text-align: center;"><strong>親子綁定 QR code</strong></p>
            {{QRcode}}
            <p style="margin: 0; font-size: 12px; line-height: 1.5;">※請使用APP內親子綁定功能掃描</p>
            </td>
          <td colspan="2" style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">姓名：{{學生姓名}}</p>
          </td>
          <td colspan="2" style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">年級：{{年級}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">班級：{{班級名稱}}</p>
          </td>
          <td colspan="2" style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">座號：{{座號}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">家長代碼：{{家長代碼}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="6" style="padding: 10px; border: 1px solid black; border-bottom: 0px solid black;">
            <p class="text-indent" style="margin: 0; font-size: 16px; line-height: 1.5; text-indent: 2em;">{{APPName}} 是由澔學學習股份有限公司提供的智慧校園行動應用，詳細的登入及親子綁定操作說明請<strong>掃描下方QR Code或連結</strong>查看。如果您在使用過程中有任何意見或安裝問題等，歡迎透過電子郵件與我們聯繫：support@ischool.com.tw，或<strong>掃描下方QR Code，使用Line加入我們為您提供的1Campus線上客服</strong>，獲得即時協助。 祝您使用愉快！</p>
          </td>
        </tr>
        <tr style="display: flex; justify-content: space-between;">
          <td colspan="3" text-align: center" align="center">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;"><strong>操作說明</strong></p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">{{操作說明URL}}</p>
            <img src="https://devapi.1campus.net/api/code/qrcode/img?chld=M&chs=120x120&cht=qr&choe=UTF-8&chl={{操作說明URL}}" style="width: 120px; height: 120px">
          </td>
          <td colspan="3" text-align: center" align="center">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;"><strong>Line客服</strong></p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">{{Line客服URL}}</p>
            <img src="https://devapi.1campus.net/api/code/qrcode/img?chld=M&chs=120x120&cht=qr&choe=UTF-8&chl={{Line客服URL}}" style="width: 120px; height: 120px">
          </td>
        </tr>
        <tr>
          <td colspan="6" align="right">
            <p style="margin: 0; font-size: 16px; line-height: 1.5; text-align: end;"><strong>{{學校名稱}}</strong></p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">*{{APPName}}最低系統需求為 iOS 13.0 或 Android 10 以上</p>
          </td>
        </tr>
      </tbody>
    </table>
    <hr>
    <br>
    <h2 style="margin: 0; text-align: center; font-size: 18px; font-weight: bold; line-height: 1.5;">{{APPName}}安裝確認回執聯</h2>
    <table style="border-collapse: collapse; border-spacing: 0px; width: 100%; padding: 10px; border: 1px solid black;" width="100%">
      <tbody>
        <tr>
          <td style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">請勾選：</p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">☐ 已下載安裝</p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">☐ 未下載安裝</p>
          </td>
          <td style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">班級：{{班級名稱}}</p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">座號：{{座號}}</p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">姓名：{{學生姓名}}</p>
          </td>
          <td style="padding: 10px; border: 1px solid black;">
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">家長簽名：</p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">　</p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">　</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <br style="page-break-before: always">
`;
