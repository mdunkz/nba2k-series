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

// --- STATE ---
let currentSeries = "mikey_zach";
let currentGameType = "live";
let currentTeams = { p1: "None", p2: "None" };
let currentHistoryFilter = 'all';
const ADMIN_KEY = "Md";

const players = {
    mikey_zach: ["Mikey", "Zach"],
    mikey_jake: ["Mikey", "Jake"],
    jake_zach: ["Jake", "Zach"]
};

let seriesData = {
    mikey_zach: { p1: 0, p2: 0 },
    mikey_jake: { p1: 0, p2: 0 },
    jake_zach: { p1: 0, p2: 0 }
};

const teams = {
    live: ["hawks", "celtics", "nets", "hornets", "bulls", "cavaliers", "mavericks", "nuggets", "pistons", "warriors", "rockets", "pacers", "clippers", "lakers", "grizzlies", "heat", "bucks", "timberwolves", "pelicans", "knicks", "thunder", "magic", "76ers", "suns", "trail_blazers", "kings", "spurs", "raptors", "jazz", "wizards"],
    alltime: ["76ers", "bucks", "bulls", "cavaliers", "celtics", "clippers", "grizzlies", "hawks", "heat", "hornets", "jazz", "kings", "knicks", "lakers", "magic", "mavericks", "nets", "nuggets", "pacers", "pelicans", "pistons", "raptors", "rockets", "spurs", "suns", "thunder", "timberwolves", "trail_blazers", "warriors", "wizards"],
    historic: ["2000-01_76ers","1976-77_76ers","1970-71_bucks","1984-85_bucks","1985-86_bulls","1988-89_bulls","1990-91_bulls","1992-93_bulls","1995-96_bulls","1997-98_bulls","2010-11_bulls","1989-90_cavaliers","2006-07_cavaliers","2015-16_cavaliers","2007-08_celtics","1985-86_celtics","2013-14_clippers","2005-06_grizzlies","2012-13_grizzlies","1985-86_hawks","2005-06_heat","1996-97_heat","2012-13_heat","1992-93_hornets","1997-98_jazz","2001-02_kings","1971-72_knicks","1994-95_knicks","1998-99_knicks","2011-12_knicks","1964-65_lakers","1970-71_lakers","1986-87_lakers","1990-91_lakers","1997-98_lakers","2000-01_lakers","2003-04_lakers","1994-95_magic","2002-03_mavericks","2010-11_mavericks","2001-02_nets","1993-94_nuggets","2007-08_nuggets","2013-14_pacers","1988-89_pistons","2003-04_pistons","1999-00_raptors","2018-19_raptors","1993-94_rockets","2007-08_rockets","1997-98_spurs","2004-05_spurs","2013-14_spurs","2002-03_suns","2004-05_suns","1995-96_supersonics","2011-12_thunder","2003-04_timberwolves","1990-91_trailblazers","1999-00_trailblazers","2009-10_trailblazers","1990-91_warriors","2006-07_warriors","2015-16_warriors","2016-17_warriors","2006-07_wizards"]
};

// --- REALTIME SYNC ---
database.ref('scores').on('value', (snap) => {
    if (snap.val()) { seriesData = snap.val(); updateScoreUI(); }
});

function updateScoreUI() {
    const data = seriesData[currentSeries];
    document.getElementById("scoreDisplay").innerText = `${data.p1} - ${data.p2}`;
    document.getElementById("gameNumberLabel").innerText = `GAME ${data.p1 + data.p2 + 1}`;
    updateHomeAwayStatus();
    calculateStreaks();
}

// --- HOME/AWAY LOGIC ---
function updateHomeAwayStatus() {
    const data = seriesData[currentSeries];
    const isEven = (data.p1 + data.p2 + 1) % 2 === 0;
    let p1Home = (currentSeries === "jake_zach") ? !isEven : isEven;
    
    const p1S = document.getElementById("p1Status"), p2S = document.getElementById("p2Status");
    const p1W = document.getElementById("p1Wheel"), p2W = document.getElementById("p2Wheel");

    p1S.innerText = p1Home ? "Home" : "Away";
    p2S.innerText = p1Home ? "Away" : "Home";
    
    [p1S, p2S].forEach(el => el.className = `status-badge ${el.innerText === 'Home' ? 'home-bg' : 'away-bg'}`);
    [p1W, p2W].forEach((el, i) => {
        const isHome = (i === 0 && p1Home) || (i === 1 && !p1Home);
        el.className = `wheel ${isHome ? 'home-team-border' : 'away-team-border'}`;
    });
}

// --- STREAK LOGIC ---
function calculateStreaks() {
    database.ref('history/' + currentSeries).limitToLast(20).once('value', (snap) => {
        let logs = []; snap.forEach(c => logs.push(c.val()));
        displayStreak("p1Streak", getStreakInfo(logs, players[currentSeries][0]));
        displayStreak("p2Streak", getStreakInfo(logs, players[currentSeries][1]));
    });
}

function getStreakInfo(logs, pName) {
    if (logs.length === 0) return { type: '', count: 0 };
    let count = 0, type = '';
    for (let i = logs.length - 1; i >= 0; i--) {
        let curType = logs[i].winner === pName ? 'W' : 'L';
        if (type === '') { type = curType; count = 1; }
        else if (type === curType) count++;
        else break;
    }
    return { type, count };
}

function displayStreak(id, data) {
    const el = document.getElementById(id);
    el.innerText = data.count > 0 ? `${data.type}${data.count}` : "";
    el.className = `streak-label ${data.type === 'W' ? 'streak-win' : 'streak-loss'}`;
}

// --- GAME ACTIONS ---
function selectSeries(key) {
    currentSeries = key;
    document.getElementById("p1Name").innerText = players[key][0];
    document.getElementById("p2Name").innerText = players[key][1];
    updateScoreUI();
}

function recordWin(playerNum) {
    if (prompt("Admin Key:") !== ADMIN_KEY) return alert("Wrong key");
    playerNum === 1 ? seriesData[currentSeries].p1++ : seriesData[currentSeries].p2++;
    
    const entry = {
        date: new Date().toLocaleString(),
        winner: players[currentSeries][playerNum - 1],
        p1Team: currentTeams.p1,
        p2Team: currentTeams.p2,
        scoreAtTime: `${seriesData[currentSeries].p1}-${seriesData[currentSeries].p2}`
    };
    database.ref('scores').set(seriesData);
    database.ref('history/' + currentSeries).push(entry);
}

function spinTeams(p) {
    const pool = teams[currentGameType];
    const chosen = Math.random() > 0.5 ? pool[Math.floor(Math.random()*pool.length)] : pool[Math.floor(Math.random()*pool.length)];
    animateSelection(p, chosen);
}

function animateSelection(p, final) {
    const pool = teams[currentGameType];
    let f = 0, inter = setInterval(() => {
        renderTeam(p, pool[Math.floor(Math.random()*pool.length)]);
        if (++f > 15) { clearInterval(inter); renderTeam(p, final); }
    }, 80);
}

function renderTeam(p, t) {
    currentTeams[`p${p}`] = t.replace(/_/g, ' ').toUpperCase();
    const path = currentGameType === 'alltime' ? 'alltime_'+t : t;
    document.getElementById(`p${p}Wheel`).innerHTML = `<img src="logos/${currentGameType}/${path}.png" onerror="this.src='logos/placeholder.png'"><div class="team-name">${currentTeams[`p${p}`]}</div>`;
}

function suicide(p) {
    const ov = document.getElementById('suicideOverlay');
    ov.classList.add('suicide-active');
    spinTeams(p);
    setTimeout(() => ov.classList.remove('suicide-active'), 1500);
}

function spinGameType() {
    const el = document.getElementById("gameTypeDisplay");
    let c = 0, inter = setInterval(() => { el.innerText = ["LIVE","HISTORIC","ALLTIME"][c++%3]; }, 100);
    setTimeout(() => {
        clearInterval(inter);
        const r = Math.random()*100;
        currentGameType = r < 50 ? 'live' : (r < 80 ? 'historic' : 'alltime');
        el.innerText = currentGameType.toUpperCase() + " TEAMS";
    }, 1000);
}

// --- HISTORY LOGS ---
function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(t+'Tab').style.display = 'block';
    document.getElementById(t+'Btn').classList.add('active');
    if (t === 'history') loadHistory();
}

function filterHistory(cat) {
    currentHistoryFilter = cat;
    document.querySelectorAll('.history-filters button').forEach(b => b.classList.remove('active'));
    document.getElementById('filter_'+cat).classList.add('active');
    loadHistory();
}

function loadHistory() {
    const body = document.getElementById('historyBody');
    const path = currentHistoryFilter === 'all' ? 'history' : `history/${currentHistoryFilter}`;
    database.ref(path).once('value', (snap) => {
        body.innerHTML = "";
        let logs = [];
        if (currentHistoryFilter === 'all') {
            snap.forEach(group => group.forEach(g => logs.push({...g.val(), s: group.key})));
        } else {
            snap.forEach(g => logs.push({...g.val(), s: currentHistoryFilter}));
        }
        logs.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(l => {
            body.innerHTML += `<tr><td>${l.date.split(',')[0]}</td><td>${l.s.replace('_',' v ')}</td><td class="streak-win">${l.winner}</td><td>${l.p1Team} vs ${l.p2Team}</td><td>${l.scoreAtTime}</td></tr>`;
        });
    });
}

function resetCurrentSeries() {
    if (prompt("Admin Key:") === ADMIN_KEY && confirm("Reset to 0-0?")) {
        seriesData[currentSeries] = {p1:0, p2:0};
        database.ref('scores').set(seriesData);
    }
}

selectSeries('mikey_zach');
