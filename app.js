const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
          SELECT
          *
          FROM
          todo 
          WHERE
          todo LIKE '%${search_q}%'
          AND status ='${status}'
          AND priority ='${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    todo_id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const postTodoQuery = `
    INSERT INTO
      todo (id,todo,priority,status)
      VALUES
      ('${id}','${todo}','${priority}','${status}');`;
  const dbResponse = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const putTodoQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  todo_id=${todoId};`;
  const putTodo = await db.get(putTodoQuery);

  const {
    todo = putTodo.todo,
    status = putTodo.status,
    priority = putTodo.priority,
  } = request.body;

  const updateTodoQuery = `
  UPDATE
  todo
  SET
  todo='${todo}',
  priority='${priority}',
  status='${status}'
  WHERE
  todo_id=${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE
    FROM
    todo
    WHERE
    todo_id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
