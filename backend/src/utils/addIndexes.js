const { initialize, oracledb } = require("../config/db");

const indexesToCreate = [
  "CREATE INDEX idx_users_role_id ON users(role_id)",
  "CREATE INDEX idx_leave_user_id ON leave_requests(user_id)",
  "CREATE INDEX idx_leave_reviewed_by ON leave_requests(reviewed_by)",
  "CREATE INDEX idx_attendance_user_id ON attendance_records(user_id)",
  "CREATE INDEX idx_entry_user_id ON entry_exit_logs(user_id)",
  "CREATE INDEX idx_entry_leave_id ON entry_exit_logs(leave_id)",
  "CREATE INDEX idx_entry_created_by ON entry_exit_logs(created_by)",
  "CREATE INDEX idx_entry_updated_by ON entry_exit_logs(updated_by)",
  "CREATE INDEX idx_fees_user_id ON student_fees(user_id)",
  "CREATE INDEX idx_feedback_user_id ON student_feedback(user_id)",
  "CREATE INDEX idx_canteen_created_by ON canteen_menu(created_by)",
  "CREATE INDEX idx_room_alloc_user_id ON room_allocation_requests(user_id)",
  "CREATE INDEX idx_room_alloc_room_no ON room_allocation_requests(assigned_room_no)",
  "CREATE INDEX idx_room_alloc_rev_by ON room_allocation_requests(reviewed_by)",
  "CREATE INDEX idx_revoked_user_id ON revoked_tokens(user_id)",
  "CREATE INDEX idx_polls_created_by ON dinner_polls(created_by)",
  "CREATE INDEX idx_poll_opts_poll_id ON dinner_poll_options(poll_id)",
  "CREATE INDEX idx_poll_votes_opt_id ON dinner_poll_votes(option_id)",
  "CREATE INDEX idx_sys_logs_actor_id ON system_logs(actor_user_id)"
];

async function addIndexes() {
  await initialize();
  let conn;
  try {
    conn = await oracledb.getConnection();
    console.log("Connected to database. Creating indexes...");

    for (const sql of indexesToCreate) {
      try {
        await conn.execute(sql);
        console.log(`Successfully executed: ${sql}`);
      } catch (err) {
        // ORA-00955: name is already used by an existing object
        if (err.message && err.message.includes("ORA-00955")) {
          console.log(`Index already exists, skipping: ${sql}`);
        } else {
          console.error(`Failed to execute: ${sql} - Error: ${err.message}`);
        }
      }
    }
    console.log("Finished creating indexes.");
  } catch (err) {
    console.error("Database connection failed", err);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error("Error closing connection", err);
      }
    }
    process.exit(0);
  }
}

addIndexes();
