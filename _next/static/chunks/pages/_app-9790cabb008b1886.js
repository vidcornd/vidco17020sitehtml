(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[888],{1118:function(t,e,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/_app",function(){return r(1518)}])},1518:function(t,e,r){"use strict";r.r(e),r.d(e,{default:function(){return l}});var n=r(1799),o=r(5893),i=r(7294),c=function(){return(0,o.jsx)("div",{id:"preloader",children:(0,o.jsx)("img",{className:"preloader-image",width:"60",src:"assets/img/vidcoicon.png",alt:"preloader"})})},a=r(4066),u=function(){return(0,o.jsx)("div",{onClick:function(){window.open("https://wa.me/905325661114","_blank")},style:{position:"fixed",right:"0",bottom:"85px",backgroundColor:"#25D366",width:"45px",height:"45px",borderRadius:"8px 0 0 8px",display:"flex",justifyContent:"center",alignItems:"center",cursor:"pointer",boxShadow:"2px 2px 6px rgba(0,0,0,0.4)",zIndex:1e3,transition:"all 0.3s ease"},onMouseOver:function(t){return t.currentTarget.style.transform="scale(1.1)"},onMouseOut:function(t){return t.currentTarget.style.transform="scale(1)"},children:(0,o.jsx)(a.xpo,{size:25,color:"white"})})};r(906);var l=function(t){var e=t.Component,r=t.pageProps,a=(0,i.useState)(!0),l=a[0],s=a[1];return(0,i.useEffect)((function(){setTimeout((function(){s(!1)}),1e3)}),[]),(0,o.jsxs)(i.Fragment,{children:[l&&(0,o.jsx)(c,{}),(0,o.jsx)(e,(0,n.Z)({},r)),(0,o.jsx)(u,{}),(0,o.jsx)("noscript",{children:(0,o.jsx)("iframe",{src:"https://www.googletagmanager.com/ns.html?id=GTM-MTF3KW9V",height:"0",width:"0",style:{display:"none",visibility:"hidden"}})})]})}},906:function(){},1799:function(t,e,r){"use strict";function n(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function o(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{},o=Object.keys(r);"function"===typeof Object.getOwnPropertySymbols&&(o=o.concat(Object.getOwnPropertySymbols(r).filter((function(t){return Object.getOwnPropertyDescriptor(r,t).enumerable})))),o.forEach((function(e){n(t,e,r[e])}))}return t}r.d(e,{Z:function(){return o}})},4066:function(t,e,r){"use strict";r.d(e,{xpo:function(){return m}});var n=r(7294),o={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},i=n.createContext&&n.createContext(o),c=["attr","size","title"];function a(t,e){if(null==t)return{};var r,n,o=function(t,e){if(null==t)return{};var r={};for(var n in t)if(Object.prototype.hasOwnProperty.call(t,n)){if(e.indexOf(n)>=0)continue;r[n]=t[n]}return r}(t,e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);for(n=0;n<i.length;n++)r=i[n],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(t,r)&&(o[r]=t[r])}return o}function u(){return u=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},u.apply(this,arguments)}function l(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function s(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?l(Object(r),!0).forEach((function(e){f(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):l(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function f(t,e,r){return(e=function(t){var e=function(t,e){if("object"!=typeof t||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=typeof n)return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==typeof e?e:e+""}(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function p(t){return t&&t.map(((t,e)=>n.createElement(t.tag,s({key:e},t.attr),p(t.child))))}function d(t){return e=>n.createElement(b,u({attr:s({},t.attr)},e),p(t.child))}function b(t){var e=e=>{var r,{attr:o,size:i,title:l}=t,f=a(t,c),p=i||e.size||"1em";return e.className&&(r=e.className),t.className&&(r=(r?r+" ":"")+t.className),n.createElement("svg",u({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},e.attr,o,f,{className:r,style:s(s({color:t.color||e.color},e.style),t.style),height:p,width:p,xmlns:"http://www.w3.org/2000/svg"}),l&&n.createElement("title",null,l),t.children)};return void 0!==i?n.createElement(i.Consumer,null,(t=>e(t))):e(o)}function m(t){return d({tag:"svg",attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"},child:[]}]})(t)}}},function(t){var e=function(e){return t(t.s=e)};t.O(0,[774,179],(function(){return e(1118),e(387)}));var r=t.O();_N_E=r}]);