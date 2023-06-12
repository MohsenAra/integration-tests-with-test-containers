const { Client } = require("pg");
const { PostgreSqlContainer } = require("testcontainers");
const { getRandomDatabaseName } = require("./get-random-database-name.js");

jest.setTimeout(20000);

beforeAll(async () => {
  await initializeContainer();
  await initDb();
});
afterAll(async () => {
  await disposeContainer();
});
async function initializeContainer() {
  const container = await new PostgreSqlContainer("postgres:alpine")
  .withEnvironment({
    POSTGRES_HOST_AUTH_METHOD: "trust",
    PGDATA: "/var/lib/postgresql/data",
  })
  .withCommand([
    "-c",
    "max_connections=1000",
    "-c",
    "fsync=off",
    "-c",
    "synchronous_commit=off",
    "-c",
    "full_page_writes=off",
  ])
  .withTmpFs({ "/var/lib/postgresql/data": "rw" })
  .withStartupTimeout(120_000)
  .start();
  this.testContext = {};
  const client = new Client({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  });
  await client.connect();
  container, (this.testContext.container = container);
  this.testContext.client = client;
}
exports.testContext = this.testContext;

async function initDb() {
  var q1 = "CREATE TABLE t1 (id serial PRIMARY KEY ,title VARCHAR(100));";
  var s1 = await run_query(q1);
  var q2 = "Insert Into   t1 (title ) values('test0');";
  var s2 = await run_query(q2);

    var q3 = `ALTER DATABASE ${this.testContext.container.getDatabase()} WITH is_template TRUE;`;
  var s2 = await run_query(q3);

}
async function run_query(query) {
  console.log(`run query ${query}`);
  const res = await this.testContext.client.query(query);
}

function getClient() {
  return this.testContext.client;
}

async function disposeContainer() {
try {
  await this.testContext.client.end();
  // this.testContext.container.stop();
} catch (error) {
  
} 
}

var testDbName = "";
var testClient;
async function createDatabase() {
  testDbName = getRandomDatabaseName();
  var q = `CREATE DATABASE ${testDbName} TEMPLATE ${this.testContext.container.getDatabase()}`;
  await run_query(q);
  testClient = new Client({
     host: this.testContext.container.getHost(),
     port: this.testContext.container.getPort(),
     database: testDbName,
     user: this.testContext.container.getUsername(),
     password: this.testContext.container.getPassword(),
  });
  await testClient.connect();

}
beforeEach(async () => {
  await createDatabase();
});

afterEach(async () => {
await  testClient.end();
});

it("should create and add new item and assert", async () => {
  var q2 = "Insert Into   t1 (title ) values('test1');";
  await testClient.query(q2);
  
  var res1 = await testClient.query("select * from t1");
   console.log(`---------------------------------${JSON.stringify(res1.rows)}`);

   var res2 = await testClient.query("select count(*) from t1");
    expect(res2.rows[0].count).toEqual("2");
});

it("should create and add new item and assert", async () => {
  var q2 = "Insert Into   t1 (title ) values('test2');";
   await testClient.query(q2);
   var res1 = await testClient.query("select * from t1");
   console.log(`---------------------------------${JSON.stringify(res1.rows)}`);
  var res2 = await testClient.query("select count(*) from t1");

  expect(res2.rows[0].count).toEqual("2");
});

