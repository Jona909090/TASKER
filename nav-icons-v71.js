// TASKER v71: premium 3D stil ikonica lijevog menija.
(() => {
  const style=document.createElement('style')
  style.textContent=`
  .nav-link{overflow:visible!important;isolation:isolate;transition:transform .2s ease,border-color .2s ease,background .2s ease,box-shadow .2s ease!important}
  .nav-link>span:first-child{position:relative!important;display:grid!important;place-items:center!important;width:38px!important;height:38px!important;flex:0 0 38px!important;border:1px solid rgba(119,199,242,.55)!important;border-radius:10px!important;background:linear-gradient(145deg,#223b58 0%,#10253e 48%,#071628 100%)!important;color:#68dbff!important;font-size:17px!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.18),inset -3px -4px 8px rgba(0,5,14,.7),0 4px 8px rgba(0,0,0,.38),0 0 0 3px rgba(4,16,29,.55)!important;text-shadow:0 0 8px rgba(73,209,255,.78)!important;filter:drop-shadow(0 0 5px rgba(57,191,244,.2));transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s ease,color .22s ease,filter .22s ease!important}
  .nav-link>span:first-child:after{content:"";position:absolute;inset:3px;border-radius:7px;border-top:1px solid rgba(255,255,255,.18);pointer-events:none}
  .nav-link:hover{transform:translateX(3px)!important;border-color:rgba(67,224,255,.48)!important;background:linear-gradient(105deg,rgba(21,58,83,.76),rgba(17,36,59,.82))!important;box-shadow:0 8px 20px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.04)!important}
  .nav-link:hover>span:first-child{transform:translateY(-2px) scale(1.055)!important;color:#a4efff!important;filter:drop-shadow(0 0 8px rgba(63,211,255,.72))!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.24),inset -3px -4px 8px rgba(0,5,14,.72),0 8px 12px rgba(0,0,0,.42),0 0 0 3px rgba(5,20,35,.72),0 0 17px rgba(53,207,255,.55)!important}
  .nav-link.active{border-color:#52ee8a!important;background:linear-gradient(105deg,rgba(21,61,70,.88),rgba(17,42,61,.92))!important;box-shadow:0 0 0 1px rgba(72,241,132,.15),0 0 18px rgba(43,231,120,.16),inset 0 1px 0 rgba(255,255,255,.07)!important}
  .nav-link.active:before{left:-2px!important;top:9px!important;bottom:9px!important;width:4px!important;background:linear-gradient(#52dfff,#58ff8c)!important;box-shadow:0 0 12px #52dfff,0 0 20px rgba(77,255,139,.6)!important}
  .nav-link.active>span:first-child{color:#73e6ff!important;border-color:rgba(103,237,255,.88)!important;background:linear-gradient(145deg,#245274,#0d304c 55%,#071a2d)!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.25),inset -3px -4px 8px rgba(0,5,14,.65),0 6px 12px rgba(0,0,0,.38),0 0 0 3px rgba(5,25,40,.7),0 0 16px rgba(65,218,255,.5)!important}
  .nav-link b{box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 3px 9px rgba(0,0,0,.26),0 0 10px rgba(81,176,237,.12)!important}
  .sidebar-footer .nav-link>span:first-child{color:#79ff9d!important;border-color:rgba(87,225,207,.55)!important;text-shadow:0 0 8px rgba(73,255,126,.75)!important}
  .sidebar-footer .nav-link:hover>span:first-child{color:#b5ffc8!important;filter:drop-shadow(0 0 8px rgba(73,255,126,.75))!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.24),inset -3px -4px 8px rgba(0,5,14,.7),0 7px 12px rgba(0,0,0,.4),0 0 0 3px rgba(5,22,35,.7),0 0 17px rgba(73,255,126,.46)!important}
  @media(max-width:760px){.nav-link>span:first-child{width:34px!important;height:34px!important;flex-basis:34px!important}.nav-link:hover{transform:none!important}.nav-link:hover>span:first-child{transform:scale(1.035)!important}}
  `
  document.head.appendChild(style)
})()

