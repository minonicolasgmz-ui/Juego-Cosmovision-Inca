/* Original lightweight illustrations for Camino a Coricancha. */
window.IncaArt = (() => {
  let serial = 0;
  const svg = (viewBox, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;
  const seeded = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function landscape() {
    const id = `land-${++serial}`;
    const grain = Array.from({ length: 150 }, (_, i) => {
      const x = Math.round(seeded(i + 4) * 1400), y = Math.round(seeded(i + 370) * 1250);
      return `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 1.2 : .7}" fill="#756441" opacity=".14"/>`;
    }).join('');
    const crop = (x, y, s = 1, tint = '#f0d281') => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${tint}" stroke-width="1.8" stroke-linecap="round"><path d="M0 0V-19M0-8Q-8-15-8-19M0-5Q8-9 9-14M0-14Q4-20 3-23"/><path d="M-2-21l2 4 2-4M-3-24l3 3 3-3" stroke-width="1.2"/></g>`;
    const crops = Array.from({ length: 44 }, (_, i) => {
      const col = i % 11, row = Math.floor(i / 11);
      return crop(55 + col * 26 + row * 7, 690 + row * 19 - col * 4, .55 + row * .12);
    }).join('') + Array.from({ length: 40 }, (_, i) => {
      const col = i % 10, row = Math.floor(i / 10);
      return crop(1070 + col * 27 - row * 9, 705 + row * 24 + col * 4, .65 + row * .13, '#d1cc81');
    }).join('');
    const home = (x, y, s, flip = false) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})" stroke-linejoin="round"><path d="M-31 9L0 26 35 6 4-12Z" fill="#6b785f" opacity=".2"/><path d="M-24-4L1 8V-23L-24-34Z" fill="#e2c5a1"/><path d="M1 8L28-7V-37L1-23Z" fill="#ae9476"/><path d="M-30-30L-12-56 8-47 35-35 1-17Z" fill="#9c784b"/><path d="M-30-30L-12-56 1-40 1-17Z" fill="#c29c63"/><path d="M1-40L8-47 35-35 1-17Z" fill="#775d3f"/><path d="M8 4V-13L17-18 18-2Z" fill="#514b3b"/><path d="M-17-7v-12l7 4v12" fill="#72604a"/><path d="M-28-30L1-15 35-34" fill="none" stroke="#e2bf82" stroke-width="3"/><path d="M-20-27L-14-47M-12-23L-9-43M-5-20L-4-38" stroke="#e6c38a" stroke-width="1" opacity=".65"/><path d="M-22-1l20 10M3 1l23-13M3-9l23-13" stroke="#927d65" stroke-width=".7" opacity=".55"/></g>`;
    const person = (x, y, s, color = '#a05239', direction = 1) => `<g transform="translate(${x} ${y}) scale(${s * direction} ${s})"><ellipse cx="0" cy="2" rx="9" ry="2.5" fill="#344737" opacity=".18"/><path d="M-3-7l-2 9M3-7l2 9" stroke="#454c3d" stroke-width="2.5" stroke-linecap="round"/><path d="M-3-24L-10-9 9-9 4-24Z" fill="${color}"/><path d="M-7-14H7M-5-20H5" stroke="#dfbf7e" stroke-width="1.5"/><circle cy="-28" r="4.7" fill="#9d7153"/><path d="M-5-29q0-7 9-1" fill="#3f4337"/><path d="M-6-19L-12-12M6-19l8 2" stroke="#9d7153" stroke-width="2.5" stroke-linecap="round"/><path d="M12-24L15 0" stroke="#726145" stroke-width="1.6"/></g>`;
    const roots = [
      'M100 932C114 974 92 1002 127 1044S130 1137 95 1180',
      'M180 946C153 991 204 1007 188 1052S222 1114 208 1166',
      'M358 930C360 981 315 1022 330 1079S283 1159 320 1234',
      'M449 958C422 1014 462 1039 434 1082S450 1171 424 1248',
      'M1001 940C977 984 999 1011 965 1054S973 1134 936 1179',
      'M1139 927C1129 968 1161 1007 1121 1054S1145 1131 1111 1221',
      'M1286 952C1247 1001 1283 1038 1240 1080S1237 1159 1276 1229'
    ];
    const rootBranches = [
      'M111 990L73 1016 57 1054M129 1046L170 1071 177 1112M126 1110L76 1141 61 1179',
      'M174 978L213 1005 229 1045M191 1055L152 1083 133 1124',
      'M346 992L394 1024 405 1060M331 1069L283 1106 272 1140M309 1160L353 1192 360 1221',
      'M435 999L478 1019 490 1050M441 1108L493 1139 510 1178',
      'M988 987L944 1008 924 1042M973 1052L1014 1084 1020 1121M964 1126L909 1158 899 1195',
      'M1146 1008L1191 1030 1205 1069M1123 1061L1084 1098 1078 1133M1134 1144L1180 1174 1193 1211',
      'M1269 991L1312 1010 1340 1046M1255 1065L1209 1092M1249 1162L1307 1180 1342 1220'
    ];
    return svg('0 0 1400 1250', `
      <defs>
        <linearGradient id="${id}-sky" x2="0" y2="1"><stop stop-color="#f1ead6"/><stop offset=".6" stop-color="#e9e9d9"/><stop offset="1" stop-color="#d1ded6"/></linearGradient>
        <radialGradient id="${id}-halo"><stop stop-color="#fff5c4" stop-opacity=".94"/><stop offset=".5" stop-color="#f3d582" stop-opacity=".25"/><stop offset="1" stop-color="#edc776" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}-far" x2=".2" y2="1"><stop stop-color="#789497"/><stop offset="1" stop-color="#a3b8ab"/></linearGradient>
        <linearGradient id="${id}-rock" x2=".85" y2="1"><stop stop-color="#687f7e"/><stop offset="1" stop-color="#aab59a"/></linearGradient>
        <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#687b57"/><stop offset=".52" stop-color="#94a367"/><stop offset="1" stop-color="#9b9865"/></linearGradient>
        <linearGradient id="${id}-soil" x2="0" y2="1"><stop stop-color="#676053"/><stop offset=".23" stop-color="#4f4d46"/><stop offset="1" stop-color="#343a38"/></linearGradient>
        <linearGradient id="${id}-water" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c0d2bf"/><stop offset="1" stop-color="#76a6a0"/></linearGradient>
        <linearGradient id="${id}-cave" x2="0" y2="1"><stop stop-color="#282e2d"/><stop offset="1" stop-color="#474542"/></linearGradient>
        <pattern id="${id}-stone" width="30" height="17" patternUnits="userSpaceOnUse"><path d="M0 1H30M0 16H30M14 1v8M0 9h30M24 9v7M3 9v7" fill="none" stroke="#425f56" stroke-width=".65" opacity=".22"/></pattern>
      </defs>
      <path fill="url(#${id}-sky)" d="M0 0H1400V1250H0Z"/>
      <g class="sun-glow"><circle cx="1045" cy="178" r="264" fill="url(#${id}-halo)"/><circle cx="1045" cy="178" r="73" fill="#ebcc79" opacity=".27"/><circle cx="1045" cy="178" r="53" fill="#edcc77"/><circle cx="1045" cy="178" r="45" fill="#f5dd94"/><circle cx="1045" cy="178" r="86" fill="none" stroke="#ddbf75" stroke-width="1" opacity=".35"/><path d="M1045 78V67M1045 278v11M945 178h-11M1145 178h11M974 107l-8-8M1116 249l8 8M974 249l-8 8M1116 107l8-8" fill="none" stroke="#cbaa5e" stroke-width="1.5" opacity=".65"/></g>
      <g fill="#fffdf1" opacity=".54"><path d="M-80 191Q8 167 69 185T208 185Q249 185 268 198H-80Z"/><path d="M871 283Q932 259 1002 274T1138 269Q1194 261 1228 284Z"/><path d="M1191 110Q1240 90 1312 101T1445 105V116H1191Z"/><path d="M318 112Q353 100 389 110T466 110L489 118H318Z"/></g>
      <g fill="none" stroke="#7b8e84" stroke-width="1.7" stroke-linecap="round" opacity=".72"><path d="M491 155q9-8 18 0 9-8 18 0M534 176q6-5 12 0 6-5 12 0M469 176q5-5 10 0 5-5 10 0"/></g>
      <path d="M0 430L88 367 156 380 256 260 315 295 400 224 494 335 542 302 622 382 692 296 741 325 833 213 889 279 939 251 1041 374 1121 320 1190 350 1299 237 1400 329V614H0Z" fill="#b2c3b6"/>
      <path d="M0 449L83 401 154 422 234 364 315 386 403 290 469 380 536 372 640 450 742 354 833 213 888 281 939 251 1041 374 1100 410 1190 350 1299 237 1400 329V620H0Z" fill="url(#${id}-far)"/>
      <g fill="#e7ece0"><path d="M403 290l-53 58 29-12 24 13 17-16 24 21Z"/><path d="M833 213l-50 74 29-13 21 21 14-30 42 16-30-36Z"/><path d="M939 251l-45 51 27-5 16 22 14-19 30 11Z"/><path d="M1299 237l-60 62 35-14 19 12 16-28 31 22Z"/></g>
      <path d="M-80 473L37 312 88 342 202 171 269 278 316 257 421 426 490 472 572 522 397 653 0 655Z" fill="url(#${id}-rock)"/>
      <path d="M202 171L187 312 232 375 227 456 319 553 398 618 466 562 421 426 316 257 269 278Z" fill="#70877d"/>
      <path d="M202 171L149 249 177 239 189 261 202 228 218 268 233 250Z" fill="#f4f1de"/>
      <path d="M202 171L202 228 219 268 233 250 252 274Z" fill="#cedace"/>
      <path d="M316 257l-32 43 24-9 12 26 14-18Z" fill="#e5e8d8"/>
      <path d="M38 312l-32 42 29-13 12 19 12-18Z" fill="#d6e0d2"/>
      <g fill="none" stroke="#e4e3c6" stroke-width="2" opacity=".2"><path d="M187 312L142 392 162 443 120 500M232 375l54 70 12 73M316 324l25 73 34 26M60 381L28 457M125 326l-32 76-14 69"/></g>
      <path d="M972 571L1107 447 1153 436 1221 333 1301 397 1358 372 1466 454V664Z" fill="#8e9a77"/>
      <path d="M1221 333l-24 116 31 84 103 86 121-20-94-227-57 25Z" fill="#a5a983"/>
      <path d="M1221 333l-29 48 22-7 20 28 7-29 32 10Z" fill="#e0dfc5"/>
      <path d="M0 546Q164 445 311 509T615 521Q706 494 803 506T995 489Q1170 470 1400 567V969H0Z" fill="url(#${id}-earth)"/>
      <path d="M0 559Q178 464 323 529T623 542Q728 514 823 522" fill="none" stroke="#bdc297" stroke-width="9"/>
      <path d="M780 547Q1005 478 1200 522T1440 582" fill="none" stroke="#c1c392" stroke-width="7"/>
      <g class="terraces">
        <path d="M-30 573Q116 511 247 550T454 594Q516 597 573 569L636 603Q536 655 419 637T183 591Q64 578-30 634Z" fill="#b2b780"/>
        <path d="M-30 634Q64 578 183 591T419 637Q536 655 636 603L635 615Q536 670 419 652T183 606Q64 593-30 650Z" fill="#66755b"/>
        <path d="M-30 650Q104 591 256 635T489 678Q564 674 631 639L689 676Q585 735 463 717T201 672Q63 667-30 723Z" fill="#abb77a"/>
        <path d="M-30 723Q63 667 201 672T463 717Q585 735 689 676L688 691Q585 751 463 734T201 689Q63 684-30 741Z" fill="#63755a"/>
        <path d="M-30 741Q104 685 256 725T514 764Q606 758 696 712L753 754Q632 820 477 805T169 758Q51 768-30 812Z" fill="#c1bb7c"/>
        <path d="M-30 812Q51 768 169 758T477 805Q632 820 753 754L752 770Q632 839 477 824T169 777Q51 787-30 831Z" fill="#778062"/>
        <path d="M-30 831Q129 767 322 820T625 849Q710 827 775 789L802 843Q646 926 443 877T176 854Q59 854-30 899Z" fill="#99a46c"/>
        <path d="M-30 899Q59 854 176 854T443 877Q646 926 802 843L800 862Q646 946 443 897T176 874Q59 874-30 920Z" fill="#68785b"/>
        <path d="M895 547Q1005 511 1140 559T1440 594V644Q1268 656 1127 609T894 591Z" fill="#acb97d"/>
        <path d="M894 591Q986 562 1127 609T1440 644V658Q1268 670 1127 623T894 605Z" fill="#6c7d5f"/>
        <path d="M891 624Q1002 596 1142 644T1440 679V726Q1263 748 1108 691T875 674Z" fill="#96ac70"/>
        <path d="M875 674Q983 642 1108 691T1440 726V741Q1263 763 1108 706T875 689Z" fill="#60775a"/>
        <path d="M865 715Q974 672 1130 739T1440 755V810Q1277 836 1107 772T849 759Z" fill="#b6bb79"/>
        <path d="M849 759Q972 714 1107 772T1440 810V828Q1277 854 1107 790T849 777Z" fill="#73815d"/>
        <path d="M831 807Q972 751 1136 822T1440 847V916Q1279 945 1105 870T811 862Z" fill="#9da86b"/>
        <path d="M811 862Q951 804 1105 870T1440 916V938Q1279 967 1105 892T811 884Z" fill="#6a7858"/>
      </g>
      <g fill="none" stroke="#e1d7a8" opacity=".42" stroke-width="1.5"><path d="M-10 613Q90 560 230 603T480 640M-10 703Q120 646 260 691T556 720M-10 792Q100 738 230 781T533 811M980 574Q1110 590 1209 624T1410 641M953 659Q1060 665 1185 713T1410 728M974 738Q1075 751 1200 799T1410 813"/></g>
      <g fill="url(#${id}-stone)" opacity=".65"><path d="M0 714Q63 667 201 672T463 717Q585 735 689 676L688 691Q585 751 463 734T201 689Q63 684 0 725Z"/><path d="M849 759Q972 714 1107 772T1440 810V828Q1277 854 1107 790T849 777Z"/></g>
      <path d="M725 502Q760 529 738 562T754 620Q783 648 749 688T780 774Q821 812 790 863T810 950" fill="none" stroke="#637d65" stroke-width="29" opacity=".25"/>
      <g class="water"><path d="M725 502Q752 530 735 561T750 622Q772 648 740 687T769 777Q811 813 780 865T794 950" fill="none" stroke="url(#${id}-water)" stroke-width="15"/><path d="M727 508Q748 532 731 563T749 625Q764 650 734 688T764 779Q805 814 775 866T789 946" fill="none" stroke="#e5e7c9" stroke-width="2.5" opacity=".58"/><path d="M746 642l14 2M730 695l13-1M777 805l17-1M770 881l17 2" stroke="#f3eecf" stroke-width="2.2" stroke-linecap="round" opacity=".8"/></g>
      <path d="M122 567Q201 602 287 589T486 575Q578 591 639 645T768 716Q900 701 1008 642T1302 628" fill="none" stroke="#ddc697" stroke-width="7"/>
      <path d="M359 949Q355 893 420 860T559 799Q617 765 620 713T656 653" fill="none" stroke="#d6bf92" stroke-width="12"/>
      <g stroke="#8b7d5f" stroke-width="2" stroke-linejoin="round"><path d="M720 705l56 10 1 10-57-9Z" fill="#c2aa74"/><path d="M721 700l56 10M721 700v16M739 703v16M758 707v16M777 710v15" fill="none"/></g>
      <g class="homes">${home(182, 567, .88)}${home(247, 580, .7)}${home(294, 552, .57)}${home(1213, 606, .94, true)}${home(1281, 625, .7, true)}${home(1151, 600, .59, true)}${home(430, 836, .87)}${home(665, 570, .56)}${home(692, 560, .4)}</g>
      <g class="crops">${crop(624, 571, .46)}${crop(632, 568, .48)}${crop(640, 565, .46)}${crop(619, 582, .5)}${crop(628, 579, .5)}${crop(637, 576, .48)}</g>
      <g class="people">${person(705, 578, .52)}${person(649, 578, .47, '#b68245')}${person(679, 584, .46, '#658475', -1)}</g>
      <g class="crops">${crops}<g fill="#76945f"><path d="M528 846q-21-11-10-20 11 2 10 20M528 846q23-14 14-23-16 5-14 23M555 837q-21-12-11-20 12 2 11 20M555 837q21-11 13-22-14 5-13 22M582 826q-21-13-11-22 12 2 11 22M582 826q21-12 13-22-14 5-13 22"/></g></g>
      <g class="people">${person(286, 604, .65)}${person(317, 611, .59, '#d2ba7b', -1)}${person(1133, 655, .66, '#785d65')}${person(1105, 666, .57, '#b68245', -1)}${person(442, 878, .9)}${person(463, 869, .77, '#658475', -1)}${person(842, 700, .65, '#b28a50')}</g>
      <g fill="#e5d8b6" stroke="#7a8062" stroke-width="1.2"><path d="M1209 855l-15-7-12 3-5-18-5-4-4 7 4 26 7 6h20l6-3 1 15h4l2-19Z"/><path d="M1218 866l-5 14M1182 865l-3 15M1172 834l-3-9M1176 835l1-8" fill="none" stroke-linecap="round"/><path d="M1270 878l-13-6-10 2-5-14-4-3-3 5 3 23 6 5h16l6-3 1 12h3l2-15Z"/><path d="M1244 889l-3 10M1237 862l-2-8M1240 862v-7" fill="none"/></g>
      <path d="M0 946Q121 921 227 945T450 950Q609 922 735 953T990 943Q1140 918 1252 950T1400 938V1250H0Z" fill="url(#${id}-soil)"/>
      <path d="M0 944Q121 919 227 943T450 948Q609 920 735 951T990 941Q1140 916 1252 948T1400 936" fill="none" stroke="#aaa371" stroke-width="13"/>
      <path d="M0 965Q121 940 227 964T450 970Q609 942 735 974T990 965Q1140 940 1252 972T1400 960" fill="none" stroke="#91816c" stroke-width="6" opacity=".7"/>
      <g class="roots" fill="none" stroke="#b49a75" stroke-linecap="round" opacity=".62">${roots.map(d => `<path d="${d}" stroke-width="3.2"/>`).join('')}${rootBranches.map(d => `<path d="${d}" stroke-width="1.8"/>`).join('')}</g>
      <g fill="none" stroke="#a89b83" stroke-width="1" opacity=".14"><path d="M0 1050l71-24 35 17 89-13 48 17 39-7M340 1127l82-15 40 11 110-21M826 1018l37 16 58-13 55 10M1028 1200l41-11 34 5 80-10M0 1206l100-20 61 12 73-24M1184 1043l80-16 92 15 44-10"/></g>
      <g opacity=".28" fill="#b4aa92"><path d="M66 1077l14-6 16 6-5 12-18 2Z"/><path d="M267 999l11-5 16 8-8 9-14-2Z"/><path d="M505 1196l18-9 23 11-3 16-29 3Z"/><path d="M898 1099l13-10 18 6 4 13-24 5Z"/><path d="M1325 1150l17-13 24 5 6 21-27 7Z"/><path d="M1229 993l9-7 13 4 3 9-15 4Z"/></g>
      <path d="M562 1250l17-83 24-36 23-52 49-18 32 9 43 54 14 72 15 54Z" fill="url(#${id}-cave)" opacity=".8"/>
      <path d="M579 1167l24-36 23-52 49-18 32 9 43 54" fill="none" stroke="#817762" stroke-width="7" opacity=".3"/>
      <g fill="#b1a385" opacity=".24"><path d="M615 1198l6-20h19l6 20-3 14h-26Z"/><path d="M666 1215l4-29h16l7 29-7 13h-15Z"/><path d="M705 1185l4-19h15l5 19-5 11h-14Z"/></g>
      <g class="earth-sparks" fill="#d8c597" opacity=".45"><circle cx="234" cy="1139" r="1.4"/><circle cx="523" cy="1019" r="1.2"/><circle cx="858" cy="1178" r="1.7"/><circle cx="1091" cy="1033" r="1.4"/><circle cx="1199" cy="1142" r="1"/></g>
      <g class="landscape-grain">${grain}</g>
    `, 'preserveAspectRatio="xMidYMid slice" class="andean-landscape"');
  }

  function temple(progress = 0) {
    const p = Math.max(0, Math.min(100, Number(progress) || 0));
    const id = `temple-${++serial}`;
    const stage = (level, body) => `<g class="temple-stage temple-stage-${level}" data-stage="${level}" opacity="${p >= level ? 1 : 0}">${body}</g>`;
    const seamsLeft = '<path d="M110 168l187 97M110 186l187 97M129 161v19M157 176v19M185 190v19M213 205v19M241 219v20M269 234v19M116 191v18M144 205v18M172 220v18M200 234v18M228 249v18M256 263v18M284 278v15"/>';
    const seamsRight = '<path d="M297 265l222-126M297 283l222-126M321 251v19M351 234v19M381 217v19M411 200v19M441 183v19M471 166v19M501 149v19M307 278v16M337 261v17M367 244v17M397 227v17M427 210v17M457 193v17M487 176v17M516 159v16"/>';
    return svg('0 0 600 330', `
      <defs><linearGradient id="${id}-gold" x2="1" y2=".7"><stop stop-color="#f1d280"/><stop offset=".5" stop-color="#c49b49"/><stop offset="1" stop-color="#e4c572"/></linearGradient><radialGradient id="${id}-light"><stop stop-color="#f5da8c" stop-opacity=".4"/><stop offset="1" stop-color="#f5da8c" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="302" cy="267" rx="225" ry="40" fill="#283c2d" opacity=".1"/>
      <g class="temple-foundation"><path d="M86 186L331 59 546 154 297 298Z" fill="#c8b58e"/><path d="M86 186v17l211 98v-17Z" fill="#8d907a"/><path d="M297 284l249-130v18L297 310Z" fill="#747f6e"/><path d="M99 179L331 67 532 156 297 287Z" fill="#d4c6a6"/><path d="M108 183L332 75 520 159 297 279Z" fill="#b6b199"/><path d="M136 184L334 89 490 159 296 263Z" fill="#d3c29b"/><path d="M108 183L332 75 520 159 297 279Z" fill="none" stroke="#eee2bf" stroke-width="2"/><path d="M142 209v15M182 228v15M222 247v15M263 266v16M333 265v20M379 240v21M425 216v19M471 192v18M516 169v19" stroke="#647565" stroke-width="1" opacity=".5"/></g>
      ${stage(25, `<path d="M108 153L297 251V280L108 183Z" fill="#acac94"/><path d="M297 251L520 127V159L297 280Z" fill="#84917e"/><path d="M108 153L332 43 520 127 297 251Z" fill="#dfd0ab"/><path d="M130 154L333 56 496 128 297 236Z" fill="#b3af92"/><path d="M130 154L333 56V79L151 167Z" fill="#8e9b83"/><path d="M333 56L496 128 477 140 333 79Z" fill="#bdb99b"/><g stroke="#667d6c" stroke-width="1" fill="none" opacity=".45">${seamsLeft}${seamsRight}</g>`)}
      ${stage(50, `<path d="M108 153V117L297 213V251Z" fill="#c3bca1"/><path d="M297 213L520 91V128L297 251Z" fill="#9ba38b"/><path d="M108 117L332 8 520 91 297 213Z" fill="#eee0b9"/><path d="M130 119L333 24 496 93 297 196Z" fill="#a8ae91"/><path d="M130 119L333 24V74L181 149Z" fill="#8e9d85"/><path d="M333 24L496 93 455 118 333 68Z" fill="#cec5a3"/><path d="M166 135L296 194 456 115 335 63Z" fill="#d5caa7"/><g fill="none" stroke="#6e8270" stroke-width="1" opacity=".42"><path d="M109 135l188 98 223-124M130 129v18M160 144v20M190 160v19M220 176v19M250 191v20M280 207v19M326 217v20M358 200v19M390 182v20M422 165v19M454 147v20M486 130v19M139 114l188-88M170 128l162-80M348 40l133 56M376 29v21M410 44v20M445 58v21"/></g><path d="M361 245L366 191 400 172 405 222Z" fill="#3f5548"/><path d="M358 247L362 187 402 165 409 220 402 224 397 178 369 194 366 243Z" fill="#d2c7a6"/><path d="M180 184l2-28 21 10 2 29Z" fill="#697864"/><path d="M231 210l2-27 21 11 2 29Z" fill="#697864"/>`)}
      ${stage(75, `<path d="M109 117L296 213V224L109 128Z" fill="#dfbf68"/><path d="M296 213L520 91V103L296 225Z" fill="url(#${id}-gold)"/><path d="M108 116L332 8 520 91 297 213Z" fill="none" stroke="#ead193" stroke-width="3"/><path d="M190 126L334 55 416 91 276 166Z" fill="#c6ad77"/><path d="M205 121L336 58 408 91 278 158Z" fill="#b99d65"/><path d="M236 133V84L331 36 381 61V104L278 159Z" fill="#e3d0a0"/><path d="M278 159V108L381 61V104Z" fill="#a5a183"/><path d="M236 84L331 36 381 61 278 108Z" fill="#d8bd76"/><path d="M235 83L327 17 384 60 278 111Z" fill="#b29a65"/><path d="M235 83L327 17 278 80V111Z" fill="#dac18c"/><path d="M278 80L327 17 384 60 278 111Z" fill="#967f52"/><path d="M235 85L278 110 384 60" fill="none" stroke="#efd79a" stroke-width="3"/><path d="M310 141l3-28 20-10 3 24Z" fill="#56604e"/><path d="M238 98l40 22 102-47M239 113l39 22 27-14M344 102l35-18" fill="none" stroke="#8b947a" stroke-width="1" opacity=".45"/>`)}
      ${stage(75, `<circle cx="327" cy="45" r="70" fill="url(#${id}-light)"/><g transform="translate(327 45)"><circle r="23" fill="#f0ce72" stroke="#ba9146" stroke-width="1.5"/><circle r="17" fill="none" stroke="#fff0b4" stroke-width="1.2"/><circle r="11" fill="#e9bb54"/><path d="M0-33v6M0 27v6M-33 0h6M27 0h6M-23-23l4 4M19 19l4 4M-23 23l4-4M19-19l4-4" stroke="#c39b4a" stroke-width="2" stroke-linecap="round"/></g>`)}
      ${stage(100, `<path d="M153 212l-12 15 8 5 12-16M457 210l15 11-7 6-16-12" fill="#d2b462"/><path d="M180 241l6-15 6 22Z" fill="#9e664c"/><circle cx="186" cy="222" r="3" fill="#976e4e"/><path d="M435 241l5-15 6 9-5 13Z" fill="#b99854"/><circle cx="440" cy="222" r="3" fill="#976e4e"/><path d="M361 188l40-23 1 7-40 23Z" fill="#e3c476"/><g fill="#f8e8b2"><path d="M414 57l2-7 2 7 7 2-7 2-2 7-2-7-7-2Z"/><path d="M241 46l1-4 1 4 4 1-4 1-1 4-1-4-4-1Z"/></g>`)}
    `, `class="coricancha-art" data-progress="${p}"`);
  }

  function event(theme = 'community') {
    const id = `event-${++serial}`;
    const cold = /frost|helada|cold/.test(theme), dry = /drought|sequia|sequía|dry/.test(theme);
    const base = cold ? '#dce6e3' : dry ? '#e8d8ab' : '#e4e4cd';
    const mountain = cold ? '#8babae' : dry ? '#b39b70' : '#7d9786';
    return svg('0 0 500 200', `<defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="#f0ead8"/></linearGradient></defs><path d="M0 0h500v200H0Z" fill="url(#${id})"/><circle cx="401" cy="49" r="${dry ? 32 : 22}" fill="${cold ? '#ecf0df' : '#e0bc63'}"/><path d="M0 149L63 63 101 113 174 26 263 139 310 91 347 117 409 47 500 135V200H0Z" fill="${mountain}"/><path d="M174 26l-36 48 28-12 10 18 10-21 22 10Z" fill="#edf0df"/><path d="M409 47l-29 37 22-6 10 12 8-21 14 8Z" fill="#edf0df"/><path d="M0 143Q97 112 204 152T500 135V200H0Z" fill="${cold ? '#a5bab0' : dry ? '#b8ad77' : '#a1b27e'}"/><path d="M0 159q92-35 200 0t300-9M0 178q92-35 200 0t300-9M0 197q92-35 200 0t300-9" fill="none" stroke="${cold ? '#e3e9d6' : '#d5cca0'}" stroke-width="5"/>${cold ? '<g stroke="#f6f6e9" stroke-width="1.4"><path d="M94 42v14M87 49h14M89 44l10 10M89 54l10-10M299 29v14M292 36h14M294 31l10 10M294 41l10-10M366 101v14M359 108h14M361 103l10 10M361 113l10-10"/></g>' : dry ? '<path d="M265 172l13-7 9 9 20-8M118 176l-6 10 16 8M413 162l-11 11 17 10" fill="none" stroke="#927953" stroke-width="1.5"/>' : '<g><path d="M242 157l-10 26h22Z" fill="#a1694c"/><circle cx="242" cy="152" r="5" fill="#976e50"/><path d="M272 156l-10 26h22Z" fill="#bfa366"/><circle cx="272" cy="151" r="5" fill="#976e50"/><path d="M248 165l10 8 10-9" fill="none" stroke="#976e50" stroke-width="3"/><path d="M239 182l-2 12M248 182l2 12M269 182l-2 11M278 182l2 11" stroke="#5b6650" stroke-width="3"/></g>'}`, `class="event-art event-art-${String(theme).replace(/[^a-z-]/gi, '')}" preserveAspectRatio="xMidYMid slice"`);
  }

  function icon(name) {
    const paths = {
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
      grain: '<path d="M12 22V5M12 10C6 10 5 7 5 4c5 0 7 3 7 6ZM12 15c6 0 7-3 7-6-5 0-7 3-7 6ZM12 20c-6 0-7-3-7-6 5 0 7 3 7 6ZM12 6s-3-3 0-5c3 2 0 5 0 5Z"/>',
      people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v3"/>',
      ayni: '<path d="M2 10l4-5 5 1 2 3-5 5-3-1-3-3ZM22 10l-4-5-5 1-2 3 5 5 3-1 3-3ZM5 13l5 6 2-1 2 1 5-6M9 16l3 2M12 14l4 3"/>',
      temple: '<path d="M3 21V9l9-6 9 6v12H3ZM3 10h18M6 10v11M18 10v11M9 21l1-7h4l1 7"/>',
      book: '<path d="M12 6C9 3 5 3 2 4v16c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2ZM12 6v16"/>',
      work: '<path d="M6 3l15 18M3 8l7-6M9 5c5-2 8-1 10 2M4 20l8-9M2 22l4-1-3-3-1 4Z"/>',
      map: '<path d="M9 4L2 2v18l7 2 6-3 7 2V3l-7-2-6 3ZM9 4v18M15 1v18"/>',
      root: '<path d="M12 2v7l-4 5 1 8M12 9l4 5-1 8M8 14l-5 2-1 4M16 14l5 2 1 4M12 3L7 5 4 3M12 6l5-2 3 1"/>',
      arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
      sound: '<path d="M3 9v6h4l5 4V5L7 9H3ZM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>',
      muted: '<path d="M3 9v6h4l5 4V5L7 9H3ZM17 9l5 6M22 9l-5 6"/>',
      pause: '<path d="M7 4v16M17 4v16" stroke-width="4"/>',
      play: '<path d="M7 3l14 9-14 9V3Z"/>',
      speed: '<path d="M3 5l8 7-8 7V5ZM12 5l8 7-8 7V5ZM22 5v14"/>',
      close: '<path d="M5 5l14 14M19 5L5 19"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
      log: '<path d="M5 3h14v18H5ZM9 7h6M9 11h6M9 15h4"/>',
      chevron: '<path d="M6 9l6 6 6-6"/>',
      leaf: '<path d="M20 3C7 2 1 9 7 16s14 0 13-13ZM4 21L16 8"/>',
      mountain: '<path d="M2 21L10 5l5 9 3-5 4 12H2ZM7 11l3 2 3-2"/>',
      heart: '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z"/>',
      check: '<path d="M4 12l5 5L20 6"/>',
      water: '<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14ZM8 16a4 4 0 0 0 4 4"/>',
      reset: '<path d="M3 10a9 9 0 1 1 1 7M3 3v7h7"/>',
      star: '<path d="M12 2l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1 3-7Z"/>',
    };
    return svg('0 0 24 24', paths[name] || '<path d="M12 2l10 10-10 10L2 12 12 2ZM7 12h10M12 7v10"/>', 'class="icon" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"');
  }
  return Object.freeze({ landscape, temple, event, icon });
})();
