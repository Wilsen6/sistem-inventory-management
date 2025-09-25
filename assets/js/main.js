
document.addEventListener('DOMContentLoaded', function(){
  // helper to create action dropdown HTML
  function actionCell(){
    return '<div class="btn-group"><button class="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Action</button><ul class="dropdown-menu"><li><a class="dropdown-item" href="#" data-act="view">View</a></li><li><a class="dropdown-item" href="#" data-act="edit">Edit</a></li><li><a class="dropdown-item text-danger" href="#" data-act="delete">Delete</a></li></ul></div>';
  }

  // --- Date/time helpers ---
  function pad(n){ return n.toString().padStart(2,'0'); }
  // Convert display format "YYYY-MM-DD HH:MM" (or variants) into input value "YYYY-MM-DDTHH:MM"
  function displayToInputDateTime(display){
    if(!display) return '';
    // If already looks like input format
    if(display.indexOf('T') !== -1){
      // truncate seconds if present
      return display.slice(0,16);
    }
    // common stored format: "YYYY-MM-DD HH:MM" or "YYYY-MM-DD HH:MM:SS"
    var m = display.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if(m){
      return m[1] + 'T' + m[2];
    }
    // fallback: try Date parse
    var d = new Date(display);
    if(isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  // Convert input value "YYYY-MM-DDTHH:MM" into display "YYYY-MM-DD HH:MM"
  function inputToDisplayDateTime(inputVal){
    if(!inputVal) return '';
    if(inputVal.indexOf('T') !== -1){
      return inputVal.replace('T',' ').slice(0,16);
    }
    // fallback try parse
    var d = new Date(inputVal);
    if(isNaN(d.getTime())) return inputVal;
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  // return current datetime in input format
  function nowInputDateTime(){
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // default demo data used on first load (display format datetimes)
  const defaultDemoData = {
    "purchase_table": [
      ["2021-11-03 11:50","PO-0002","Supplier 102","2","Received"],
      ["2021-11-03 11:20","PO-0001","Supplier 101","1","Received"]
    ],
    "receiving_table":[
      ["2021-11-03 11:52","BO-0004","1","Received"],
      ["2021-11-03 11:52","BO-0003","2","Received"]
    ],
    "backorder_table":[
      ["2021-11-03 11:52","BO-0004","Supplier 102","1","Received"],
      ["2021-11-03 11:51","BO-0003","Supplier 102","2","Partially received"]
    ],
    "return_table":[
      ["2021-11-03 13:45","R-0001","Supplier 102","2"]
    ],
    "stocks_table":[
      ["Item 104","Supplier 102","Sample only","170"],
      ["Item 103","Supplier 101","Sample","0"]
    ],
    "sales_table":[
      ["2021-11-03 14:03","SALE-0001","John Smith","3","7,625.00"]
    ],
    "suppliers_table":[
      ["2021-11-02 09:36","Supplier 101","Supplier Staff 101","Active"],
      ["2021-11-02 09:36","Supplier 102","Supplier Staff 102","Active"]
    ],
    "products_table":[
      ["2021-11-02 10:01","Item 101","Supplier 101","Active"],
      ["2021-11-02 10:02","Item 102","Supplier 102","Active"]
    ],
    "users_table":[
      ["2021-11-02 09:00","Admin User","Administrator","Active"]
    ]
  };

  // storage helpers
  function readStorage(){
    try{
      return JSON.parse(localStorage.getItem('sms_data') || '{}');
    }catch(e){
      return {};
    }
  }
  function writeStorage(obj){
    try{
      localStorage.setItem('sms_data', JSON.stringify(obj));
    }catch(e){ console.error('storage write failed', e); }
  }
  function ensureStorageFor(tableId){
    const s = readStorage();
    if(!s[tableId]){
      s[tableId] = defaultDemoData[tableId] ? defaultDemoData[tableId].slice() : [];
      writeStorage(s);
    }
    return s[tableId];
  }

  // initialize DataTables and populate from storage
  document.querySelectorAll('table[id$="_table"]').forEach(function(tbl){
    // init DataTable (if not already)
    var dt = $(tbl).DataTable({
      pageLength: 10,
      lengthChange: true,
      ordering: true
    });
    var tableId = tbl.id;
    // ensure storage exists for this table
    var rows = ensureStorageFor(tableId);
    // clear and populate table with stored rows
    dt.clear();
    rows.forEach(function(r){
      dt.row.add(r.concat([actionCell()]));
    });
    dt.draw(false);
  });

  // AFTER table inputs are created on each page (inline script in page), adjust input types
  // Find modal form inputs and convert date fields to datetime-local and set defaults
  (function adjustModalInputs(){
    var modal = document.getElementById('addModal');
    if(!modal) return;
    var form = modal.querySelector('form#addForm');
    if(!form) return;
    var inputs = form.querySelectorAll('input');
    inputs.forEach(function(inp){
      var name = inp.getAttribute('name') || '';
      if(name.toLowerCase().includes('date')){
        try{ inp.type = 'datetime-local'; }catch(e){}
        // if empty, default to now (only when in create mode)
        if(!inp.value){
          inp.value = nowInputDateTime();
        } else {
          // if value exists and looks like display datetime, convert to input format
          inp.value = displayToInputDateTime(inp.value);
        }
      } else {
        // leave as is
      }
    });
  })();

  // update dashboard counts if there are dashboard elements
  function updateDashboardCounts(){
    var s = readStorage();
    document.querySelectorAll('.dash-count[data-target]').forEach(function(el){
      var target = el.getAttribute('data-target');
      var arr = s[target] || [];
      el.textContent = arr.length;
    });
  }
  // initial dashboard counts update
  updateDashboardCounts();

  // store a reference when editing
  window._editing = null;

  // event delegation for action clicks
  document.addEventListener('click', function(e){
    var target = e.target;
    var menuItem = target.closest ? target.closest('.dropdown-item') : null;
    if(menuItem){
      e.preventDefault();
      var act = menuItem.getAttribute('data-act');
      var tr = menuItem.closest('tr');
      if(!tr) return;
      var tableEl = tr.closest('table');
      if(!tableEl) return;
      var tableId = tableEl.id;
      var dt = $('#' + tableId).DataTable();
      var row = dt.row(tr);
      var data = row.data() || [];
      var rowData = data.slice(0, Math.max(0, data.length-1));
      if(act === 'view'){
        openModalWithData(tableId, rowData, 'view', row.node());
      } else if(act === 'edit'){
        openModalWithData(tableId, rowData, 'edit', row.node());
      } else if(act === 'delete'){
        if(confirm('Are you sure you want to delete this row?')){
          var s = readStorage();
          var list = s[tableId] || [];
          var idx = list.findIndex(function(r){ return JSON.stringify(r) === JSON.stringify(rowData); });
          if(idx > -1){
            list.splice(idx,1);
            s[tableId] = list;
            writeStorage(s);
          } else {
            var fidx = list.findIndex(function(r){ return r[0] === rowData[0]; });
            if(fidx > -1){ list.splice(fidx,1); s[tableId] = list; writeStorage(s); }
          }
          row.remove().draw(false);
          updateDashboardCounts();
        }
      }
    }
  });

  // function to open modal and populate inputs
  function openModalWithData(tableId, dataArray, mode, rowNode){
    var modalEl = document.getElementById('addModal');
    var form = modalEl.querySelector('form#addForm');
    var title = modalEl.querySelector('.modal-title');
    form.setAttribute('data-table', tableId);
    form.setAttribute('data-mode', mode);
    form.dataset.original = dataArray ? JSON.stringify(dataArray) : '';
    window._editing = rowNode || null;
    if(mode === 'edit'){
      title.textContent = 'Edit entry';
      modalEl.querySelector('.modal-footer .btn-primary').textContent = 'Save Changes';
   
    } else {
      title.textContent = 'Create New';
      modalEl.querySelector('.modal-footer .btn-primary').textContent = 'Save';
    }
    // populate inputs and convert date fields
    var inputs = form.querySelectorAll('input');
    for(var i=0;i<inputs.length;i++){
      var inp = inputs[i];
      var val = (dataArray && i < dataArray.length) ? dataArray[i] : '';
      if(inp.type === 'datetime-local'){
        inp.value = val ? displayToInputDateTime(val) : nowInputDateTime();
      } else {
        inp.value = val || '';
      }
      inp.readOnly = (mode === 'view');
    }
    var bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  // form submit handler for add / edit / view
  document.addEventListener('submit', function(e){
    if(e.target && e.target.id === 'addForm'){
      e.preventDefault();
      var form = e.target;
      var tableId = form.getAttribute('data-table') || (document.querySelector('table[id$=\"_table\"]') ? document.querySelector('table[id$=\"_table\"]').id : null);
      var mode = form.getAttribute('data-mode') || 'add';
      var inputs = form.querySelectorAll('input');
      var values = [];
      inputs.forEach(function(inp){
        if(inp.type === 'datetime-local'){
          values.push(inputToDisplayDateTime(inp.value));
        } else {
          values.push(inp.value);
        }
      });
      var s = readStorage();
      s[tableId] = s[tableId] || [];
      var dt = $('#' + tableId).DataTable();
      if(mode === 'edit' && window._editing){
        var original = form.dataset.original ? JSON.parse(form.dataset.original) : null;
        var list = s[tableId];
        var idx = -1;
        if(original){
          idx = list.findIndex(function(r){ return JSON.stringify(r) === JSON.stringify(original); });
        }
        if(idx === -1){
          idx = list.findIndex(function(r){ return r[0] === original[0]; });
        }
        if(idx > -1){
          list[idx] = values.slice();
        } else {
          list.push(values.slice());
        }
        s[tableId] = list;
        writeStorage(s);
        dt.row(window._editing).data(values.concat([actionCell()])).draw(false);
        window._editing = null;
      } else if(mode === 'view'){
        // nothing
      } else {
        // add new row
        s[tableId].push(values.slice());
        writeStorage(s);
        dt.row.add(values.concat([actionCell()])).draw(false);
      }
      var modalEl = document.getElementById('addModal');
      var bs = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      bs.hide();
      form.reset();
      form.setAttribute('data-mode','add');
      updateDashboardCounts();
    }
  });

  // restore sidebar state and toggle handler
  try{ if(localStorage.getItem('sidebarCollapsed') === '1'){ document.querySelector('.sidebar').classList.add('collapsed'); document.body.classList.add('sidebar-collapsed'); } }catch(e){}
  var menuToggle = document.getElementById('menu-toggle');
  if(menuToggle){
    menuToggle.addEventListener('click', function(){
      var sb = document.querySelector('.sidebar');
      sb.classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-collapsed');
      try{ if(sb.classList.contains('collapsed')){ localStorage.setItem('sidebarCollapsed','1'); } else { localStorage.removeItem('sidebarCollapsed'); } }catch(e){}
    });
  }
});
