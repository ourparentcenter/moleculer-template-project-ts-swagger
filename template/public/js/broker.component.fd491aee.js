(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[2],{2010:function(e,t,c){"use strict";c("b8b2")},afc7:function(e,t,c){"use strict";c.r(t);var a=c("7a23");const i=Object(a["N"])("data-v-63ba2a4d");Object(a["B"])("data-v-63ba2a4d");const r=Object(a["i"])("div",{class:"row justify-center"},[Object(a["i"])("h3",null,"Configuration")],-1),n={class:"row items-start justify-center q-gutter-md"},b=Object(a["i"])("div",{class:"text-h6"},"Namespace",-1),l=Object(a["i"])("div",{class:"text-h6"},"Transporter",-1),s=Object(a["i"])("div",{class:"text-h6"},"Serializer",-1),d=Object(a["i"])("div",{class:"text-h6"},"Strategy",-1),o=Object(a["i"])("div",{class:"text-h6"},"Cacher",-1),O=Object(a["i"])("div",{class:"text-h6"},"Logger",-1),u=Object(a["i"])("div",{class:"text-h6"},"Metrics",-1),j=Object(a["i"])("div",{class:"text-h6"},"Tracing",-1),f={class:"column items-center justify-evenly"},p=Object(a["h"])("Broker options"),h={class:"broker-options"};Object(a["z"])();const k=i(((e,t,c,k,y,m)=>{const _=Object(a["F"])("q-card-section"),g=Object(a["F"])("q-separator"),x=Object(a["F"])("q-card"),v=Object(a["F"])("q-icon"),w=Object(a["F"])("q-slide-transition");return Object(a["y"])(),Object(a["f"])("div",null,[r,Object(a["i"])("div",n,[Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[b])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)||e.isEmpty(e.broker.namespace)?"<not set>":e.broker.namespace),1)])),_:1})])),_:1}),Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[l])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)||e.isEmpty(e.broker.namespace)?"<no transporter>":e.broker.transporter),1)])),_:1})])),_:1}),Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[s])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)?"<not set>":e.broker.serializer||"JSON"),1)])),_:1})])),_:1}),Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[d])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)?"<not set>":e.broker.registry.strategy),1)])),_:1})])),_:1}),Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[o])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)?"Disabled":"Enabled"),1)])),_:1})])),_:1}),Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[O])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)?"Disabled":"Enabled"),1)])),_:1})])),_:1}),Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[u])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)?"Disabled":"Enabled"),1)])),_:1})])),_:1}),Object(a["i"])(x,{class:"my-card text-white text-center",bordered:"",style:{background:"radial-gradient(circle, #35a2ff 0%, #014a88 100%)"}},{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[j])),_:1}),Object(a["i"])(g,{dark:"",inset:""}),Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.isEmpty(e.broker)?"Disabled":"Enabled"),1)])),_:1})])),_:1})]),Object(a["i"])("div",f,[Object(a["i"])("h3",{class:"cursor-pointer",onClick:t[1]||(t[1]=t=>e.showBrokerOptions=!e.showBrokerOptions)},[p,Object(a["i"])(v,{name:"expand_"+(e.showBrokerOptions?"less":"more")},null,8,["name"])]),Object(a["i"])(w,null,{default:i((()=>[Object(a["M"])(Object(a["i"])("div",h,[Object(a["i"])("pre",null,[Object(a["i"])(x,null,{default:i((()=>[Object(a["i"])(_,null,{default:i((()=>[Object(a["h"])(Object(a["H"])(e.broker),1)])),_:1})])),_:1})])],512),[[a["J"],e.showBrokerOptions]])])),_:1})])])}));var y=c("a748"),m=c("2ef0"),_=c.n(m),g=c("4bde"),x=(Object(g["boot"])((({app:e})=>{e.use(_.a)})),c("b3fe")),v=function(e,t,c,a){function i(e){return e instanceof c?e:new c((function(t){t(e)}))}return new(c||(c=Promise))((function(c,r){function n(e){try{l(a.next(e))}catch(t){r(t)}}function b(e){try{l(a["throw"](e))}catch(t){r(t)}}function l(e){e.done?c(e.value):i(e.value).then(n,b)}l((a=a.apply(e,t||[])).next())}))},w=Object(a["j"])({name:"CompositionComponent",setup(){const e=Object(x["a"])(),t=Object(a["D"])(),c=_.a.isEmpty,i=Object(a["D"])(!1);function r(c){return v(this,void 0,void 0,(function*(){yield y["api"].get(c).then((e=>{t.value=e.data})).catch((()=>{e.notify({color:"negative",position:"top",message:"Loading failed",icon:"report_problem"})}))}))}function n(){r("/api/~node/options")}return Object(a["v"])((()=>n())),{isEmpty:c,broker:t,showBrokerOptions:i}}}),E=(c("2010"),c("f09f")),H=c("a370"),B=c("eb85"),C=c("0016"),q=c("e9c1"),D=c("eebe"),S=c.n(D);w.render=k,w.__scopeId="data-v-63ba2a4d";t["default"]=w;S()(w,"components",{QCard:E["a"],QCardSection:H["a"],QSeparator:B["a"],QIcon:C["a"],QSlideTransition:q["a"]})},b8b2:function(e,t,c){}}]);