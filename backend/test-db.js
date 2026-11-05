const pool = require("./db");

async function testConnection() {
  try {
    const [rows] = await pool.execute(
      "SELECT menu_item_id, name, price FROM MenuItem"
    );

    console.table(rows);
    console.log("Database connection successful!");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();