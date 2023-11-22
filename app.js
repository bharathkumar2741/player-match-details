const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
intializeDBAndServer()

module.exports = app

const convertdisDbObjectToResponsiveObject = dbobject => {
  return {
    playerId: dbobject.player_id,
    playerName: dbobject.player_name,
  }
}

const convertDbObjectToResponsiveObject = dbobject => {
  return { 
  matchId:dbobject.match_id ,
  match: dbobject.match,
  year: dbobject.year
}
}

app.get('/players/', async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;
    `
  const statesArray = await db.all(getPlayerQuery)
  response.send(statesArray.map(i => convertdisDbObjectToResponsiveObject(i)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getStatesQuery = `
    SELECT * FROM player_details WHERE player_id=${playerId};
    `
  const state = await db.get(getStatesQuery)
  response.send(convertdisDbObjectToResponsiveObject(state))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerName} = request.body
  const {playerId} = request.params
  const updateQuery = `
  update player_details SET 
  player_name="${playerName}"
  WHERE
  player_id=${playerId};
  `
  await db.run(updateQuery)
  response.send('Player Details Updated');
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getStatesQuery = `
    SELECT * FROM match_details WHERE match_id=${matchId};
    `
  const state = await db.get(getStatesQuery)
  response.send(convertDbObjectToResponsiveObject(state))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN match_details
    WHERE
    player_id=${playerId};
    `;
  const statesArray = await db.all(getPlayerQuery)
  response.send(statesArray.map(i => convertDbObjectToResponsiveObject(i)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN player_details
    WHERE
    match_id=${matchId};
    `;
  const statesArray = await db.all(getPlayerQuery)
  response.send(statesArray.map(i => convertdisDbObjectToResponsiveObject(i)))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params;
    const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const statesArray = await db.get(getPlayerQuery)
  response.send(statesArray);
})