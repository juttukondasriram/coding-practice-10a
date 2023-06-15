const express = require("express");
const app = express();
const path = require("path");
let dbPath = path.join(__dirname, "covid19IndiaPortal.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Started Successfully");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const logger = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authentication"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "ram", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "ram");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.get("/states/", async (request, response) => {
  const getStatesQuery = `select * from state;`;
  const statesArray = await db.all(getStatesQuery);
  statesArray.map((each) => {
    return {
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    };
  });
  response.send(statesArray);
});

app.get("/states/:stateId/", logger, async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select * from state where state_id='${stateId}';`;
  const stateArray = await db.get(getStateQuery);
  stateArray.map((each) => {
    return {
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    };
  });
  response.send(stateArray);
});

app.post("/districts/", logger, async (request, response) => {
  const {
    district_id,
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths,
  } = request.body;
  const insertStateQuery = `insert into district (district_id, district_name, state_id, cases, cured, active, deaths) values (${district_id}, '${district_name}', ${staate_id}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(insertStateQuery);
  response.send("District Added Successfully");
});

app.get("/districts/:districtId/", logger, async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `select * from district where district_id='${districtId}';`;
  const districtArray = await db.get(getDistrictQuery);
  districtArray.map((each) => {
    return {
      districtId: each.district_id,
      districtName: each.district_name,
      stateId: each.state_id,
      cases: each.cases,
      cured: each.cured,
      active: each.active,
      deaths: each.deaths,
    };
  });
  response.send(districtArray);
});

app.delete("/districts/:districtId/", logger, async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district where district_id='${districtId}';`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", logger, async (request, response) => {
  const {
    district_id,
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths,
  } = request.body;
  const updateDistrictQuery = `update district set district_id = ${district_id}, district_name = '${district_name}', state_id = ${state_id}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths} where district_id=${district_id};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", logger, async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths from state where state_id='${stateId}';`;
  const stateArray = await db.get(getStateQuery);
  stateArray.map((each) => {
    return {
      totalCases: each.totalCases,
      totalCured: each.totalCured,
      totalActive: each.totalActive,
      totalDeaths: each.totalDeaths,
    };
  });
  response.send(stateArray);
});

module.exports = app;

