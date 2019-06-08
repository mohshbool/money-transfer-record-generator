require('dotenv').config();

const { BrowserWindow } = require('electron').remote;

const elements = [
  'transactionNumber',
  'amount',
  'benefitiaryName',
  'senderName',
  'place',
];

function getLastNodes() {
  let arr = [];
  for (let elem of elements) {
    const nodes = document.getElementsByName(elem);
    arr.push(nodes[nodes.length - 1]);
  }
  return arr;
}

function isLastRowValid() {
  for (let node of getLastNodes()) {
    if (node.value === '' || node.value.length === 0) {
      return false;
    }
  }
  return true;
}

function getNewRow() {
  return `<tr>
  <th scope="row"><input type="number" class="form-control" name="transactionNumber" placeholder="رقم الحوالة"></th>
  <td><input type="number" step="0.01" class="form-control" name="amount" placeholder="المبلغ"></td>
  <td><input type="text" class="form-control" name="benefitiaryName" placeholder="اسم المستفيد"></td>
  <td><input type="text" class="form-control" name="senderName" placeholder="المرسل"></td>
  <td><input type="text" class="form-control" name="place" placeholder="المكان"></td>
</tr>`;
}

function getValues() {
  let arr = [];
  document.getElementsByName(elements[0]).forEach(() => {
    arr.push({});
  });
  for (let index in elements) {
    document.getElementsByName(elements[index]).forEach(({ value }, i) => {
      if (value.length === 0 || value == '') {
        throw new Error('الرجاء التأكد من تعبئة النموذج كاملاً');
      }
      arr[i][elements[index]] = value;
    });
  }
  return arr;
}

window.onload = function() {
  document.getElementById('add-line').addEventListener('click', function() {
    if (isLastRowValid()) {
      document
        .querySelector('tbody')
        .insertAdjacentHTML('beforeend', getNewRow());
      getLastNodes()[0].focus();
    } else {
      alert('الرجاء التأكد من اكمال اخر حركة');
    }
  });
  document.getElementById('print').addEventListener('click', function() {
    let data = {
      statementNumber: document.getElementsByName('statementNumber')[0].value,
      date: document.getElementsByName('date')[0].value,
    };
    if (data.statementNumber.length === 0 || data.statementNumber == '') {
      alert('الرجاء ادخال رقم الكشف');
    } else if (data.date.length === 0 || data.date == '') {
      alert('الرجاء ادخال التاريخ');
    } else {
      try {
        data.transactions = getValues();
        fetch('http://127.0.0.1:5000/pdf', {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            // eslint-disable-next-line no-undef
            Authorization: process.env.AUTH,
          },
          method: 'POST',
          body: JSON.stringify(data),
        })
          .then(async res => {
            if (res.status === 200 && res.ok) {
              const reader = await res.body.getReader();
              const data = await reader.read();
              const tmpFile = require('tmp').fileSync({ postfix: '.pdf' });
              require('fs').writeFile(
                tmpFile.name,
                new Uint8Array(data.value),
                err => {
                  if (err) throw err;
                  const win = new BrowserWindow();
                  require('electron-pdf-window').addSupport(win);
                  win.loadURL(tmpFile.name);
                  win.maximize();
                  setTimeout(
                    () => win.webContents.executeJavaScript('window.print()'),
                    3000,
                  );
                  win.on('close', () => tmpFile.removeCallback());
                },
              );
            } else throw new Error(res.status);
          })
          .catch(({ message }) => {
            switch (message) {
              case '406':
                alert('الرجاء التأكد من تعبئة النموذج كاملاً');
                break;
              case '416':
              default:
                alert('حدث خطأ. الرجاء أعادة المحاولة لاحقاً');
            }
          });
      } catch ({ message }) {
        alert(message);
      }
    }
  });
};
