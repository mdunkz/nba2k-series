// ---------- DATA ----------

// Series and players
let currentSeries = "me_zach";
let lockedTeams = {};

const seriesData = JSON.parse(localStorage.getItem("seriesData")) || {
  me_zach: { p1: 0, p2: 0 },
  me_jake: { p1: 0, p2: 0 },
  jake_zach: { p1: 0, p2: 0 }
};

const players = {
  me_zach: ["Me", "Zach"],
  me_jake: ["Me", "Jake"],
  jake_zach: ["Jake", "Zach"]
};

// Weighted game types
const gameTypes = [
  { type: "live", weight: 50 },
  { type: "historic", weight: 30 },
  { type: "alltime", weight: 20 }
];

const teams = {
  live: ["lakers","celtics","warriors","bucks","nuggets"],
  historic: [
    "2000-01_76ers","1976-77_76ers","1970-71_bucks","1984-85_bucks","1985-86_bulls",
    "1988-89_bulls","1990-91_bulls","1992-93_bulls","1995-96_bulls","1997-98_bulls",
    "2010-11_bulls","1989-90_cavaliers","2006-07_cavaliers","2015-16_cavaliers",
    "2007-08_celtics","1985-86_celtics","2013-14_clippers","2005-06_grizzlies",
    "2012-13_grizzlies","1985-86_hawks","2005-06_heat","1996-97_heat","2012-13_heat",
    "1992-93_hornets","1997-98_jazz","2001-02_kings","1971-72_knicks","1994-95_knicks",
    "1998-99_knicks","2011-12_knicks","1964-65_lakers","1970-71_lakers","1986-87_lakers",
    "1990-91_lakers","1997-98_lakers","2000-01_lakers","2003-04_lakers","1994-95_magic",
    "2002-03_mavericks","2010-11_mavericks","2001-02_nets","1993-94_nuggets","2007-08_nuggets",
    "2013-14_pacers","1988-89_pistons","2003-04_pistons","1999-00_raptors","2018-19_raptors",
    "1993-94_rockets","2007-08_rockets","1997-98_spurs","2004-05_spurs","2013-14_spurs",
    "2002-03_suns","2004-05_suns","1995-96_supersonics","2011-12_thunder","2003-04_timberwolves",
    "1990-91_trailblazers","1999-00_trailblazers","2009-10_trailblazers","1990-91_warriors",
    "2006-07_warriors","2015-16_warriors","2016-17_warriors","2006-07_wizards"
  ],
  alltime: ["alltime_lakers","alltime_bulls","alltime_celtics","alltime_warriors"]
};

// ---------- UTILITY ----------

function shuffle(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

function weightedRandom() {
  let total = gameTypes.reduce((s,o)=>s+o.weight,0);
  let roll = Math.random()*total;
  for (let o of gameTypes) {
    if (roll < o.weight) return o.type;
    roll -= o.weight;
  }
}

// Preload images for smooth spins
function preloadLogos() {
  ["live","historic","alltime"].forEach(type=>{
    teams[type].forEach(team=>{
      const img = new Image();
      img.src = `logos/${type}/${team}.png`;
    });
  });
}
preloadLogos();

// ---------- SERIES SELECT ----------

function selectSeries(key) {
  currentSeries = key;
  lockedTeams = {};
  document.getElementById("p1Name").innerText = players[key][0];
  document.getElementById("p2Name").innerText = players[key][1];
  updateScore();
}

function updateScore() {
  let s = seriesData[currentSeries];
  document.getElementById("scoreDisplay").innerText =
    `${players[currentSeries][0]} ${s.p1} - ${s.p2} ${players[currentSeries][1]}`;
}

// ---------- GAME TYPE SPIN ----------

let currentGameType = null;

function spinGameType() {
  const types = gameTypes.map(t=>t.type);
  const result = weightedRandom();

  const display = document.getElementById("gameType");
  let i=0;
  const interval = setInterval(()=>{
    display.innerText = types[i%types.length].toUpperCase();
    i++;
  },120);

  setTimeout(()=>{
    clearInterval(interval);
    currentGameType = result;
    display.innerText = result.toUpperCase() + " TEAMS";
  },1500);
}

// ---------- TEAM SPIN ----------

function spinWheel(player,pool,finalPick,duration=2000){
  const wheel = document.getElementById(`p${player}Wheel`);
  let start = null;
  function animate(timestamp){
    if(!start) start = timestamp;
    const progress = timestamp - start;
    const speed = Math.max(50,300-progress/5);
    if(progress<duration){
      const tempPick = pool[Math.floor(Math.random()*pool.length)];
      renderWheel(wheel,tempPick);
      setTimeout(()=>requestAnimationFrame(animate),speed);
    } else renderWheel(wheel,finalPick);
  }
  requestAnimationFrame(animate);
}

function renderWheel(wheel,team){
  wheel.innerHTML = `<img src="logos/${currentGameType}/${team}.png">
                     <div class="team-name">${formatTeamName(team)}</div>`;
}

function formatTeamName(team){
  return team.replace(/_/g," ").replace(/\b[a-z]/g,l=>l.toUpperCase());
}

// Two Randoms
function spinTeams(player){
  const used = Object.values(lockedTeams);
  const pool = teams[currentGameType].filter(t=>!used.includes(t));
  const shuffled = shuffle(pool);
  const options = shuffled.slice(0,2);
  const chosen = options[Math.floor(Math.random()*2)];
  lockedTeams[`p${player}`] = chosen;
  spinWheel(player,pool,chosen);
}

// Suicide
function suicide(player){
  const used = Object.values(lockedTeams);
  const pool = teams[currentGameType].filter(t=>!used.includes(t));
  const chosen = pool[Math.floor(Math.random()*pool.length)];
  lockedTeams[`p${player}`] = chosen;
  spinWheel(player,pool,chosen);
}

// ---------- RECORD WIN ----------

function recordWin(player){
  seriesData[currentSeries][`p${player}`]++;
  localStorage.setItem("seriesData",JSON.stringify(seriesData));
  updateScore();
}

// ---------- INIT ----------

selectSeries("me_zach");
