import{c as n}from"./index-CZsi4bmq.js";/**
 * @license lucide-react v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],o=n("check",s);function e(){const r="/api";try{return new URL(r,typeof window<"u"?window.location.origin:"http://127.0.0.1:8001").origin}catch{return"http://127.0.0.1:8001"}}function i(r){if(!r)return null;const t=String(r).trim();return t?t.startsWith("data:")||t.startsWith("blob:")||t.startsWith("http://")||t.startsWith("https://")?t:t.startsWith("/")?`${e()}${t}`:t:null}function c(r){return r&&(i(r.question_image)||i(r.question_image_url))||null}function u(r){if(!r||typeof r!="string")return!1;const t=r.trim();return t.startsWith("http://")||t.startsWith("https://")||t.startsWith("/static/")||t.startsWith("/media/")}export{o as C,c as a,u as i,i as r};
