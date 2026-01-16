// ============================================================
// 1. FIREBASE CONFIGURATION
// PASTE YOUR SETTINGS FROM THE FIREBASE CONSOLE BELOW!
// ============================================================

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

// INITIALIZE FIREBASE
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ============================================================
// 2. APP STATE & DATA
// ============================================================

let currentSeries = "mikey_zach";
let currentGameType = "live";
const ADMIN_KEY = "md"; // Your password for updating scores

let seriesData = {
    mikey_zach: { p1: 0, p2: 0 },
    mikey_jake: { p1: 0, p2: 0 },
    jake_zach: { p1: 0, p2: 0 }
};

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

// ============================================================
// 3. DATABASE SYNC (THIS MAKES IT WORK EVERYWHERE)
// ============================================================

// Listen for live updates from Firebase
database.ref('scores').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        seriesData = data;
        updateScoreUI();
    }
});

function updateScoreUI() {
    const data = seriesData[currentSeries];
    document.getElementById("scoreDisplay").innerText = `${data.p1} - ${data.p2}`;
}

function selectSeries(key) {
    currentSeries = key;
    document.getElementById("p1Name").innerText = players[key][0];
    document.getElementById("p2Name").innerText = players[key][1];
    updateScoreUI();
}

// ============================================================
// 4. GAME FUNCTIONS
// ============================================================

function recordWin(playerNum) {
    const key = prompt("Enter Admin Key:");
    if (key === ADMIN_KEY) {
        if (playerNum === 1) seriesData[currentSeries].p1++;
        else seriesData[currentSeries].p2++;
        
        // SAVE TO THE CLOUD
        database.ref('scores').set(seriesData);
    } else {
        alert("Incorrect Key.");
    }
}

function resetCurrentSeries() {
    const key = prompt("Enter Admin Key to RESET:");
    if (key === ADMIN_KEY) {
        if(confirm("Reset this series to 0-0?")) {
            seriesData[currentSeries].p1 = 0;
            seriesData[currentSeries].p2 = 0;
            database.ref('scores').set(seriesData);
        }
    }
}

function spinGameType() {
    const display = document.getElementById("gameTypeDisplay");
    let count = 0;
    const interval = setInterval(() => {
        const temp = ["LIVE", "HISTORIC", "ALLTIME"];
        display.innerText = temp[count % 3];
        count++;
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        const rand = Math.random() * 100;
        if (rand < 50) currentGameType = "live";        
        else if (rand < 80) currentGameType = "historic"; 
        else currentGameType = "alltime";                
        display.innerText = currentGameType.toUpperCase() + " TEAMS";
    }, 1000);
}

function animateSelection(player, finalTeam) {
    const wheel = document.getElementById(`p${player}Wheel`);
    const pool = teams[currentGameType];
    let flashes = 0;
    const maxFlashes = 15;

    const flashInterval = setInterval(() => {
        const tempTeam = pool[Math.floor(Math.random() * pool.length)];
        renderTeam(player, tempTeam);
        flashes++;
        
        if (flashes >= maxFlashes) {
            clearInterval(flashInterval);
            renderTeam(player, finalTeam);
            wheel.classList.add('winner-pop');
            setTimeout(() => wheel.classList.remove('winner-pop'), 500);
        }
    }, 80);
}

function spinTeams(player) {
    const pool = teams[currentGameType];
    const t1 = pool[Math.floor(Math.random() * pool.length)];
    const t2 = pool[Math.floor(Math.random() * pool.length)];
    const chosen = Math.random() > 0.5 ? t1 : t2;
    animateSelection(player, chosen);
}

function suicide(player) {
    const overlay = document.getElementById('suicideOverlay');
    overlay.classList.add('suicide-active');
    const pool = teams[currentGameType];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    animateSelection(player, chosen);
    setTimeout(() => { overlay.classList.remove('suicide-active'); }, 1500);
}

function renderTeam(player, team) {
    const wheel = document.getElementById(`p${player}Wheel`);
    let path = team;
    if (currentGameType === 'alltime') path = "alltime_" + team;
    
    wheel.innerHTML = `
        <img src="logos/${currentGameType}/${path}.png" onerror="this.src='logos/placeholder.png'">
        <div class="team-name">${team.replace(/_/g, ' ').toUpperCase()}</div>
    `;
}

// Start with the first series
selectSeries('mikey_zach');
