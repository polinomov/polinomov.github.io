
  

var htmlCanvas;
var context;
class GlobVars {
    mouseX = 0;
    mouseY = 0;
}
var gv = new GlobVars();

var gCamRotCb;
var gCamMoveCb;
var gCamDbClickCB;
var gUIChangeCB;
var gIdChanged = "unknown"

function callWasm1() {
    console.log("CallWasm");
    Module['canvas'] = document.getElementById('myPics');
    const result = Module.ccall('CallCFunc', 'number');
}

function OnTest( v) {
    console.log("Hello TestMe JS-\n");
    test_cb = Module.cwrap('OnTestJS', 'number', ['number']);
    test_cb(v);
}

function OnMouseMove(e) {

    gv.mouseX = e.offsetX;
    gv.mouseY = e.offsetY;
    OnDraw();
}

function OnFileSelected(input) {
    //document.getElementById('GFG').innerHTML = 'Reading: ' + input.files[0].name;
    document.getElementById('GFG').innerHTML = 'Reading ... '
    var file = input.files[0];
    if (!file) {
        console.log("NO FILE");
        return;
    }
    var ext = input.files[0].name.split('.').pop();
    console.log("YES FILE size=" + input.files[0].size + " ext=" + ext);
    var fz = input.files[0].size;
    var reader = new FileReader();
    reader.onload = function (e) {
        var data = reader.result;
        var array = new Uint8Array(data);
        var res_ptr = Module._malloc(fz);
        Module.HEAPU8.set(array, res_ptr);
        file_cb = Module.cwrap('FileBinDataJS', 'number', ['arrayPointer', 'number', 'number'], { async: true });
        switch (ext) {
            case "xyz": file_cb(res_ptr, fz, 0); break;
            case "las": file_cb(res_ptr, fz, 1); break;
        }
        Module._free(res_ptr);
    };
    reader.onloadend = function (e) {
        console.log("load done");
    }
    reader.onerror = function (e) {
        console.log('Error : ' + e.type);
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function OnSampleLoad(){
    console.log("-OnSampleLoad-");
 
}

function OnFileOpen() {
    document.getElementById('attachment').click();
}


function resizeCanvas() {
    resize_cb = Module.cwrap('CallCFunc', 'number', ['number', 'number']);
    document.getElementById('canvas').height = window.innerHeight;
    document.getElementById('canvas').width = window.innerWidth;
    resize_cb(window.innerWidth, window.innerHeight);
}

function forceResize(){
    window.dispatchEvent(new Event('resize'));
}

function GetBkColorValue(){
    var vs = document.getElementById("bkcolor").value; 
    var vi =  "0x"+vs.slice(1);
    var v = parseInt(vi);
    return v;    
}

function GetBudgetValue(){
    return  document.getElementById("budVal").value; 
}

function GetPtSizeValue(){
    return document.getElementById("ptSize").value; 
}

function GetFovValue(){
    return document.getElementById("fovVal").value; 
}

function GetUIString(){
    return gIdChanged;
}

function OnUIEvent1(input){
    gIdChanged = input.id;
    var elType = document.getElementById(input.id).type;
    if(elType == "checkbox"){
        gUIChangeCB(123,document.getElementById(input.id).checked );
    }else{
        gUIChangeCB(123, document.getElementById(input.id).value);
    }
    // gray out some UI elements
    if( input.id == "camOrto"){
        fovEl = document.getElementById("fovVal");
        if(document.getElementById(input.id).checked==true){
            fovEl.setAttribute("disabled", true);
        }else{
            fovEl.removeAttribute('disabled');
        }
    }
    if( input.id == "rdAll"){
        budgetEl = document.getElementById("budVal");
        if(document.getElementById(input.id).checked==true){
            budgetEl.setAttribute("disabled", true);
        }else{
            budgetEl.removeAttribute('disabled');
        }
    }
}

function OnBkhanged(input){
    gIdChanged = 'bkgcol';
    var val = GetBkColorValue(); 
    gUIChangeCB(123,val);
}


class ProscessEventsClass {
    constructor() {
        this.ctrlOn = 0;
        this.mouseOn = 0;
        this.action = 0;
        this.posX = -1;
        this.posY = -1;
    };

    onMouseUp(e) {
        this.mouseOn = 0;
        this.posX = -1;
        this.posY = -1;
    }

    onMouseClick(e) {
    }

    onDbClick(e){
        console.log("DBclick: x= " + e.clientX + " y="+e.clientY);
        gCamDbClickCB(e.clientX,e.clientY);
    }

    onMouseDown(e) {
        this.mouseOn = 1;
        this.posX = e.clientX;
        this.posY = e.clientY;
        if(e.button==0){//left
            this.action = 1; //rotate
        }
        if(e.button==2){//right
            console.log("btnCode="+ e.button);
            this.action = 2; //move
        }
    }

    onMouseMove(e) {
        if (this.mouseOn == 1) {
            let dx = e.clientX - this.posX;
            let dy = e.clientY - this.posY;
            let adx = (dx > 0) ? dx : -dx;
            let ady = (dy > 0) ? dy : -dy;
            if(this.action==1){// rotation
                if (adx > ady) {
                    let vx = adx * 10000 / window.innerWidth;
                    gCamRotCb((dx>0)?-1:1, 0, 0, vx);
                }
                else {
                    let vy = ady * 10000 / window.innerHeight;
                    gCamRotCb(0, (dy>0)?-1:1, 0, vy);
                }
            }
            if(this.action==2){// move
                gCamMoveCb(dx,dy);
            }
            this.posX = e.clientX;
            this.posY = e.clientY;
        }
    }

    onMouseWheel(e) {
    }

    onWheel(e) {
        if (e.deltaY > 0) {
            gCamRotCb(0, 1, 1, 0);
        } else {
            gCamRotCb(0, -1, 1, 0);
        }
    }

    onKeyUp(e) {
        if (e.key == "Control") {
            this.ctrlOn = 0;
        }
    }

    onKeyDown(e) {
        switch (e.key) {
            case "ArrowUp": gCamRotCb(0, 1, this.ctrlOn, 200); break;
            case "ArrowDown": gCamRotCb(0, -1, this.ctrlOn, 200); break;
            case "ArrowLeft": gCamRotCb(-1, 0, this.ctrlOn, 200); break;
            case "ArrowRight": gCamRotCb(1, 0, this.ctrlOn, 200); break;
            case "Control": this.ctrlOn = 1; break;
            case "r" : OnTest(-1); break;
            case "t" : OnTest(-2); break;
        }
    }

    onButton(e){
        //console.log("onButton");
    }
}

var ProcessEvents = new ProscessEventsClass();

function onTestCheckClick(cb) {
    ch_cb = Module.cwrap('OnDebugCheckBox', 'number', ['number']);
    if (cb.checked) {
        ch_cb(1);
    } else {
        ch_cb(0);
    }
}

function OnTestButton() {

}

function OnLoaded() {
    // init canvas
    htmlCanvas = document.getElementById('myPics');
    context = htmlCanvas.getContext('2d');
    resizeCanvas();
}

function OnStart() {
    console.log("-OnStart-\n");
    gCamRotCb   = Module.cwrap('CameraRotateJS', 'number', 'number', 'number', 'number',['number']);
    gCamMoveCb  = Module.cwrap('CameraMoveJS', 'number', ['number','number']);
    gCamDbClickCB = Module.cwrap('CameraMoveDbClickJS', 'number', ['number','number']);
    gUIChangeCB = Module.cwrap('OnUIChangeJS', 'number', ['number', 'number']);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, false);
    window.addEventListener('keydown', (event) => { ProcessEvents.onKeyDown(event); }, false);
    window.addEventListener('keyup', (event) => { ProcessEvents.onKeyUp(event); }, false);
    const el = document.getElementById("canvas");
    el.addEventListener('click', (event) => { ProcessEvents.onMouseClick(event); }, false);
    el.addEventListener('mouseup', (event) => { ProcessEvents.onMouseUp(event); }, false);
    el.addEventListener('mousemove', (event) => { ProcessEvents.onMouseMove(event); }, false);
    el.addEventListener('mousedown', (event) => { ProcessEvents.onMouseDown(event); }, false);
    el.addEventListener('mousewheel', (event) => { ProcessEvents.onMouseWheel(event); }, false);
    el.addEventListener('wheel', (event) => { ProcessEvents.onWheel(event); }, false);
    el.addEventListener('dblclick', (event) => { ProcessEvents.onDbClick(event); }, false);

    const color = document.getElementById("bkcolor");
    color.addEventListener('input', function(e) {OnBkhanged(e);});
    // disable some elements
    //document.getElementById("colrgb").disabled = true;
 }



//OnStart();