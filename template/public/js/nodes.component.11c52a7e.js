(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[5],{"106c":function(e,t,o){},1330:function(e,t,o){"use strict";o.r(t);var a=o("7a23");const c=Object(a["N"])("data-v-31991304");Object(a["B"])("data-v-31991304");const n={class:"q-pa-md"};Object(a["z"])();const r=c(((e,t)=>{const o=Object(a["F"])("q-th"),r=Object(a["F"])("q-tr"),l=Object(a["F"])("q-td"),i=Object(a["F"])("q-badge"),s=Object(a["F"])("q-chip"),b=Object(a["F"])("q-table");return Object(a["y"])(),Object(a["f"])("div",n,[Object(a["i"])(b,{title:"Node Status",rows:e.nodes,columns:e.columns,"row-key":"name"},{header:c((e=>[Object(a["i"])(r,{props:e},{default:c((()=>[(Object(a["y"])(!0),Object(a["f"])(a["a"],null,Object(a["E"])(e.cols,(t=>(Object(a["y"])(),Object(a["f"])(o,{key:t.name,props:e},{default:c((()=>[Object(a["h"])(Object(a["H"])(t.label),1)])),_:2},1032,["props"])))),128))])),_:2},1032,["props"])])),body:c((e=>[Object(a["i"])(r,{props:e},{default:c((()=>[Object(a["i"])(l,{key:"id",props:e},{default:c((()=>[Object(a["h"])(Object(a["H"])(e.row.id),1)])),_:2},1032,["props"]),Object(a["i"])(l,{key:"type",props:e},{default:c((()=>[Object(a["h"])(Object(a["H"])(e.row.client.type),1)])),_:2},1032,["props"]),Object(a["i"])(l,{key:"version",props:e},{default:c((()=>[e.row.client.version?(Object(a["y"])(),Object(a["f"])(i,{key:0,transparent:"",color:"black"},{default:c((()=>[Object(a["h"])(Object(a["H"])("v"+e.row.client.version),1)])),_:2},1024)):Object(a["g"])("",!0)])),_:2},1032,["props"]),Object(a["i"])(l,{key:"ip",props:e},{default:c((()=>[Object(a["h"])(Object(a["H"])(e.row.ipList[0]),1)])),_:2},1032,["props"]),Object(a["i"])(l,{key:"hostname",props:e},{default:c((()=>[Object(a["h"])(Object(a["H"])(e.row.hostname),1)])),_:2},1032,["props"]),Object(a["i"])(l,{key:"status",props:e},{default:c((()=>[Object(a["i"])(s,{class:"glossy",square:"",color:e.row.available?"teal":"red","text-color":"white",icon:e.row.available?"done":"priority_high"},{default:c((()=>[Object(a["h"])(Object(a["H"])(e.row.available?"Online":"Offline"),1)])),_:2},1032,["color","icon"])])),_:2},1032,["props"]),Object(a["i"])(l,{key:"cpu",props:e},{default:c((()=>[Object(a["h"])(Object(a["H"])(null!=e.row.cpu?Number(e.row.cpu).toFixed(0)+"%":"-"),1),Object(a["i"])("div",{class:"bar",style:{width:null!=e.row.cpu?e.row.cpu+"%":"0",backgroundColor:e.row.cpu>="60"?"rgba(207,0,15,0.6)":"rgba(0,0,0,0.3)"}},null,4)])),_:2},1032,["props"])])),_:2},1032,["props"])])),_:1},8,["rows","columns"])])}));var l=o("6c02"),i=o("b3fe"),s=o("a748"),b=function(e,t,o,a){function c(e){return e instanceof o?e:new o((function(t){t(e)}))}return new(o||(o=Promise))((function(o,n){function r(e){try{i(a.next(e))}catch(t){n(t)}}function l(e){try{i(a["throw"](e))}catch(t){n(t)}}function i(e){e.done?o(e.value):c(e.value).then(r,l)}i((a=a.apply(e,t||[])).next())}))};const p=[{name:"id",required:!0,label:"Node ID",align:"left",field:e=>e.id,format:e=>`${e}`,sortable:!0},{name:"type",align:"center",label:"Type",field:"client.type",sortable:!0},{name:"version",align:"center",label:"Version",field:"client.version",sortable:!0},{name:"ip",align:"center",label:"IP",field:"ipList",sortable:!0},{name:"hostname",align:"center",label:"Hostname",field:"hostname",sortable:!0},{name:"status",align:"center",label:"Status",field:"available",sortable:!0},{name:"cpu",align:"center",label:"CPU",field:"cpu",sortable:!0}];var u=Object(a["j"])({name:"CompositionComponent",setup(){const e=Object(i["a"])(),t=Object(a["D"])([]);let o;function c(t){return b(this,void 0,void 0,(function*(){return yield s["axios"].get(t).then((e=>e.data)).catch((()=>{e.notify({color:"negative",position:"top",message:"Loading failed",icon:"report_problem"})}))}))}function n(){c("/api/~node/list").then((e=>{e.sort(((e,t)=>e.id.localeCompare(t.id))),t.value=e}))}return Object(a["v"])((()=>{o=setInterval((()=>{n()}),2e3)})),Object(l["c"])(((e,t,a)=>{clearInterval(o),a()})),{nodes:t,columns:p}}}),d=(o("3a80"),o("eaac")),O=o("bd08"),j=o("357e"),f=o("db86"),h=o("58a8"),m=o("b047"),w=o("eebe"),y=o.n(w);u.render=r,u.__scopeId="data-v-31991304";t["default"]=u;y()(u,"components",{QTable:d["a"],QTr:O["a"],QTh:j["a"],QTd:f["a"],QBadge:h["a"],QChip:m["a"]})},"3a80":function(e,t,o){"use strict";o("106c")}}]);