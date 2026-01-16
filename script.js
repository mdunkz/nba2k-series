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
