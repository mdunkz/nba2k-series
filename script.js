const firebaseConfig = {
  apiKey: "AIzaSyCbjAqW0inyoxW38SRrbfMZ3IR5ryWtjxw",
  authDomain: "nba-tracker-86afd.firebaseapp.com",
  databaseURL: "https://nba-tracker-86afd-default-rtdb.firebaseio.com",
  projectId: "nba-tracker-86afd",
  storageBucket: "nba-tracker-86afd.firebasestorage.app",
  messagingSenderId: "197871582020",
  appId: "1:197871582020:web:c1e56810aff6acba007511",
  measurementId: "G-TH1KT8T0VB"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const ADMIN_KEY = "MIKEY26";
let currentSeries = "mikey_zach";
let currentGameType = "live";
let currentHistoryFilter = "all";

// Global tracker for currently spun teams
let spunTeams = { p1: null, p2: null };

const players = {
    mikey_zach: ["Mikey", "Zach"],
    mikey_jake: ["Mikey", "Jake"],
    jake_zach: ["Jake", "Zach"]
};

const teams = {
    live: ["hawks", "celtics", "nets", "hornets", "bulls", "cavaliers", "mavericks", "nuggets", "pistons", "warriors", "rockets", "pacers", "clippers", "lakers", "grizzlies", "heat", "bucks", "timberwolves", "pelicans", "knicks", "thunder", "magic", "76ers", "suns", "trail_blazers", "kings", "spurs", "raptors", "jazz", "wizards"],
    alltime: ["76ers", "bucks", "bulls", "cavaliers", "celtics", "clippers", "grizzlies", "hawks", "heat", "hornets", "jazz", "kings", "knicks", "lakers", "magic", "mavericks", "nets", "nuggets", "pacers", "pelicans", "pistons", "raptors", "rockets", "spurs", "suns", "thunder", "timberwolves", "trail_blazers", "warriors", "wizards"],
    historic: ["2000-01_76ers","1976-77_76ers","1970-71_bucks","1984-85_bucks","1985-86_bulls","1988-89_bulls","1990-91_bulls","1992-93_bulls","1995-96_bulls","1997-98_bulls","2010-11_bulls","1989-90_cavaliers","2006-07_cavaliers","2015-16_cavaliers","2007-08_celtics","1985-86_celtics","2013-14_clippers","2005-06_grizzlies","2012-13_grizzlies","1985-86_hawks","2005-06_heat","1996-97_heat","2012-13_heat","1992-93_hornets","1997-98_jazz","2001-02_kings","1971-72_knicks","1994-95_knicks","1998-99_knicks","2011-12_knicks","1964-65_lakers","1970-71_lakers","1986-87_lakers","1990-91_lakers","1997-98_lakers","2000-01_lakers","2003-04_lakers","1994-95_magic","2002-03_mavericks","2010-11_mavericks","2001-02_nets","1993-94_nuggets","2007-08_nuggets","2013-14_pacers","1988-89_pistons","2003-04_pistons","1999-00_raptors","2018-19_raptors","1993-94_rockets","2007-08_rockets","1997-98_spurs","2004-05_spurs","2013-14_spurs","2002-03_suns","2004-05_suns","1995-96_supersonics","2011-12_thunder","2003-04_timberwolves","1990-91_trailblazers","1999-00_trailblazers","2009-10_trailblazers","1990-91_warriors","2006-07_warriors","2015-16_warriors","2016-17_warriors","2006-07_wizards"]
};

let seriesData = { mikey_zach: {p1:0, p2:0}, mikey_jake: {p1:0, p2:0}, jake_zach: {p1:0, p2:0} };

database.ref('scores').on('value', snap => { if(snap.val()) { seriesData = snap.val(); updateUI(); } });

function updateUI() {
    const s = seriesData[currentSeries];
    document.getElementById("scoreDisplay").innerText = `${s.p1} - ${s.p2}`;
    document.getElementById("gameNumberLabel").innerText = `GAME ${s.p1 + s.p2 + 1}`;
    const isEven = (s.p1 + s.p2 + 1) % 2 === 0;
    let p1Home = (currentSeries === "jake_zach") ? !isEven : isEven;
    
    document.getElementById("p1Status").innerText = p1Home ? "HOME" : "AWAY";
    document.getElementById("p1Status").className = `status-badge ${p1Home ? 'home-bg' : 'away-bg'}`;
    document.getElementById("p1Wheel").className = `wheel ${p1Home ? 'home-team-border' : ''}`;
    document.getElementById("p2Status").innerText = p1Home ? "AWAY" : "HOME";
    document.getElementById("p2Status").className = `status-badge ${p1Home ? 'away-bg' : 'home-bg'}`;
    document.getElementById("p2Wheel").className = `wheel ${!p1Home ? 'home-team-border' : ''}`;
    calculateStreaks();
}

function recordWin(pNum) {
    if (prompt("Admin Key:") !== ADMIN_KEY) return;

    let gScore = prompt("Enter Game Final Score (e.g., 102-98):");
    if (!gScore) return;

    // PRE-FILL TEAM 1
    const p1Name = players[currentSeries][0];
    let t1 = null;
    while (t1 === null) {
        let input = prompt(`Enter team used by ${p1Name}:`, spunTeams.p1 || "");
        if (input === null) return;
        t1 = validateTeam(input);
        if (!t1) alert("Invalid Team Name. Check spelling.");
    }

    // PRE-FILL TEAM 2
    const p2Name = players[currentSeries][1];
    let t2 = null;
    while (t2 === null) {
        let input = prompt(`Enter team used by ${p2Name}:`, spunTeams.p2 || "");
        if (input === null) return;
        t2 = validateTeam(input);
        if (!t2) alert("Invalid Team Name. Check spelling.");
    }

    pNum === 1 ? seriesData[currentSeries].p1++ : seriesData[currentSeries].p2++;
    const entry = { 
        date: new Date().toLocaleDateString(), 
        winner: players[currentSeries][pNum-1], 
        teams: `${t1.toUpperCase().replace(/_/g, ' ')} vs ${t2.toUpperCase().replace(/_/g, ' ')}`, 
        gScore: gScore, 
        sScore: `${seriesData[currentSeries].p1}-${seriesData[currentSeries].p2}` 
    };
    
    database.ref('scores').set(seriesData);
    database.ref('history/' + currentSeries).push(entry);

    // Reset local spun tracking after saving
    spunTeams = { p1: null, p2: null };
    document.getElementById("p1Wheel").innerHTML = "";
    document.getElementById("p2Wheel").innerHTML = "";
}

function validateTeam(input) {
    if(!input) return null;
    let clean = input.toLowerCase().trim().replace(/\s+/g, '_');
    return [...teams.live, ...teams.alltime, ...teams.historic].includes(clean) ? clean : null;
}

function calculateStreaks() {
    database.ref('history/' + currentSeries).limitToLast(10).once('value', snap => {
        let logs = []; snap.forEach(c => logs.push(c.val()));
        updateStreakDisplay("p1Streak", logs, players[currentSeries][0]);
        updateStreakDisplay("p2Streak", logs, players[currentSeries][1]);
    });
}

function updateStreakDisplay(id, logs, name) {
    let count = 0, type = '';
    for (let i = logs.length-1; i >= 0; i--) {
        let cur = (logs[i].winner === name) ? 'W' : 'L';
        if (type === '') { type = cur; count = 1; }
        else if (type === cur) count++;
        else break;
    }
    const el = document.getElementById(id);
    el.innerText = count > 0 ? `${type}${count}` : "";
    el.className = `streak-label ${type === 'W' ? 'streak-win' : 'streak-loss'}`;
}

async function loadPlayerProfile() {
    const pName = document.getElementById("playerSelect").value;
    if (!pName) return document.getElementById("profileStats").style.display = "none";
    const snap = await database.ref('history').once('value');
    const all = snap.val();
    let stats = { w:0, l:0, hw:0, hl:0, aw:0, al:0, pf:0, pa:0, g:0, h2h:{} };

    if (all) {
        Object.keys(all).forEach(sKey => {
            const games = Object.values(all[sKey]);
            games.forEach((g, idx) => {
                const p1 = sKey.split('_')[0], p2 = sKey.split('_')[1];
                const isP1 = p1.toLowerCase() === pName.toLowerCase(), isP2 = p2.toLowerCase() === pName.toLowerCase();
                if (isP1 || isP2) {
                    stats.g++;
                    const gameNum = idx + 1;
                    const isEven = gameNum % 2 === 0;
                    let isHome = (sKey === "jake_zach") ? (isP2 ? !isEven : isEven) : (isP1 ? isEven : !isEven);
                    const won = g.winner.toLowerCase() === pName.toLowerCase();
                    if(won) { stats.w++; isHome ? stats.hw++ : stats.aw++; } else { stats.l++; isHome ? stats.hl++ : stats.al++; }
                    const opp = (isP1 ? p2 : p1).charAt(0).toUpperCase() + (isP1 ? p2 : p1).slice(1);
                    if(!stats.h2h[opp]) stats.h2h[opp] = {w:0, l:0};
                    won ? stats.h2h[opp].w++ : stats.h2h[opp].l++;
                    const pts = g.gScore.split('-').map(Number);
                    if(pts.length===2) { stats.pf += isP1 ? pts[0] : pts[1]; stats.pa += isP1 ? pts[1] : pts[0]; }
                }
            });
        });
    }
    document.getElementById("profileStats").style.display = "block";
    document.getElementById("statTotalRecord").innerText = `${stats.w}-${stats.l}`;
    document.getElementById("statHomeRecord").innerText = `${stats.hw}-${stats.hl}`;
    document.getElementById("statAwayRecord").innerText = `${stats.aw}-${stats.al}`;
    document.getElementById("statWinPct").innerText = stats.g > 0 ? ((stats.w/stats.g)*100).toFixed(1)+"%" : "0%";
    document.getElementById("statAvgFor").innerText = stats.g > 0 ? (stats.pf/stats.g).toFixed(1) : "0.0";
    document.getElementById("statAvgAgainst").innerText = stats.g > 0 ? (stats.pa/stats.g).toFixed(1) : "0.0";
    const h2hBox = document.getElementById("h2hList"); h2hBox.innerHTML = "";
    Object.keys(stats.h2h).forEach(o => { h2hBox.innerHTML += `<div style="display:flex; justify-content:space-between; font-size:0.8rem; margin:5px 0;"><span>vs ${o}</span><span style="color:#ff9800; font-weight:bold;">${stats.h2h[o].w}-${stats.h2h[o].l}</span></div>`; });
}

function showTab(t) { document.querySelectorAll('.tab-content').forEach(e => e.style.display='none'); document.querySelectorAll('.tab-btn').forEach(e => e.classList.remove('active')); document.getElementById(t+'Tab').style.display='block'; document.getElementById(t+'Btn').classList.add('active'); if(t==='history') loadHistory(); if(t==='profiles') loadPlayerProfile(); }
function selectSeries(k) { currentSeries = k; document.getElementById("p1Name").innerText = players[k][0]; document.getElementById("p2Name").innerText = players[k][1]; updateUI(); }

function spinTeams(p) { 
    const pool = teams[currentGameType]; 
    let f = 0, i = setInterval(() => { 
        let temp = pool[Math.floor(Math.random()*pool.length)];
        renderWheel(p, temp); 
        if(++f>12){ 
            clearInterval(i); 
            let final = pool[Math.floor(Math.random()*pool.length)];
            renderWheel(p, final); 
            // Save the final result to global tracking
            if (p === 1) spunTeams.p1 = final;
            else spunTeams.p2 = final;
        }
    }, 80); 
}

function renderWheel(p, t) { 
    const path = currentGameType === 'alltime' ? 'alltime_'+t : t; 
    document.getElementById(`p${p}Wheel`).innerHTML = `<img src="logos/${currentGameType}/${path}.png" style="max-height:120px;" onerror="this.src='logos/placeholder.png'"><div style="font-size:0.7rem; margin-top:5px;">${t.replace(/_/g,' ').toUpperCase()}</div>`; 
}

function spinGameType() { 
    const el = document.getElementById("gameTypeDisplay"); 
    let c = 0, i = setInterval(() => { el.innerText = ["LIVE","HISTORIC","ALLTIME"][c++%3]; }, 100); 
    setTimeout(() => { 
        clearInterval(i); 
        let r = Math.random();
        currentGameType = r < 0.5 ? 'live' : (r < 0.8 ? 'historic' : 'alltime'); 
        el.innerText = currentGameType.toUpperCase() + " TEAMS"; 
    }, 800); 
}

function suicide(p) { document.getElementById('suicideOverlay').classList.add('suicide-active'); spinTeams(p); setTimeout(() => document.getElementById('suicideOverlay').classList.remove('suicide-active'), 1200); }
function toggleTeamList() { const m = document.getElementById("teamListModal"); m.style.display = m.style.display==='block' ? 'none' : 'block'; if(m.style.display==='block') searchTeams(); }
function searchTeams() { const q = document.getElementById("teamSearch").value.toLowerCase(); const list = document.getElementById("fullTeamList"); list.innerHTML = ""; [...teams.live, ...teams.alltime, ...teams.historic].sort().forEach(t => { if(t.includes(q)) list.innerHTML += `<li>${t}</li>`; }); }
function filterHistory(c) { currentHistoryFilter = c; document.querySelectorAll('.history-filters button').forEach(b => b.classList.remove('active')); document.getElementById('filter_'+c).classList.add('active'); loadHistory(); }
function loadHistory() { const b = document.getElementById("historyBody"); const p = currentHistoryFilter === 'all' ? 'history' : 'history/'+currentHistoryFilter; database.ref(p).once('value', snap => { b.innerHTML = ""; let logs = []; if(currentHistoryFilter==='all') snap.forEach(g => g.forEach(m => logs.push({...m.val(), s:g.key}))); else snap.forEach(m => logs.push({...m.val(), s:currentHistoryFilter})); logs.reverse().forEach(l => { b.innerHTML += `<tr><td>${l.date}</td><td>${l.s.replace('_',' v ')}</td><td>${l.winner}</td><td>${l.teams}<br><b>${l.gScore}</b></td><td>${l.sScore}</td></tr>`; }); }); }
function resetCurrentSeries() { if(prompt("Key:") === ADMIN_KEY) { seriesData[currentSeries] = {p1:0, p2:0}; database.ref('scores').set(seriesData); } }

selectSeries('mikey_zach');
