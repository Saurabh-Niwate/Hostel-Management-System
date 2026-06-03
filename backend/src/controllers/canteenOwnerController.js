const { oracledb } = require("../config/db");

const isValidIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const allowedMealTypes = ["Breakfast", "Lunch", "Snacks", "Dinner"];

const fetchPollOptionsWithVotes = async (conn, pollIds) => {
  if (!pollIds.length) return [];
  const binds = {};
  const placeholders = pollIds.map((id, index) => {
    const key = `b_poll_id_${index}`;
    binds[key] = id;
    return `:${key}`;
  });

  const result = await conn.execute(
    `
    SELECT
      o.option_id,
      o.poll_id,
      o.option_name,
      o.description,
      o.display_order,
      (
        SELECT COUNT(*)
        FROM dinner_poll_votes v
        WHERE v.option_id = o.option_id
      ) AS vote_count
    FROM dinner_poll_options o
    WHERE o.poll_id IN (${placeholders.join(", ")})
    ORDER BY o.poll_id, o.display_order, o.option_id
    `,
    binds,
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  return result.rows || [];
};

const mapPollRows = async (conn, pollRows) => {
  const pollIds = pollRows.map((row) => row.POLL_ID);
  const optionRows = await fetchPollOptionsWithVotes(conn, pollIds);

  return pollRows.map((poll) => {
    const options = optionRows
      .filter((option) => option.POLL_ID === poll.POLL_ID)
      .map((option) => ({
        OPTION_ID: option.OPTION_ID,
        OPTION_NAME: option.OPTION_NAME,
        DESCRIPTION: option.DESCRIPTION,
        DISPLAY_ORDER: option.DISPLAY_ORDER,
        VOTE_COUNT: Number(option.VOTE_COUNT || 0)
      }));

    const sortedOptions = [...options].sort((a, b) => b.VOTE_COUNT - a.VOTE_COUNT);
    const topVoteCount = sortedOptions[0]?.VOTE_COUNT || 0;
    const winners = topVoteCount > 0
      ? sortedOptions.filter((option) => option.VOTE_COUNT === topVoteCount)
      : [];

    return {
      ...poll,
      TOTAL_VOTES: options.reduce((sum, option) => sum + option.VOTE_COUNT, 0),
      OPTIONS: options,
      WINNING_OPTIONS: winners.map((option) => option.OPTION_NAME),
      WINNING_VOTE_COUNT: topVoteCount
    };
  });
};

const logSystemAction = async (conn, actorUserId, action, entityType, entityId, details) => {
  await conn.execute(
    `
    INSERT INTO system_logs (actor_user_id, actor_role, action, entity_type, entity_id, details)
    VALUES (:b_actor_user_id, 'Canteen Owner', :b_action, :b_entity_type, :b_entity_id, :b_details)
    `,
    {
      b_actor_user_id: actorUserId,
      b_action: action,
      b_entity_type: entityType,
      b_entity_id: entityId,
      b_details: details || null
    },
    { autoCommit: false }
  );
};

exports.getDailyMenu = async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT
        menu_id,
        meal_type,
        item_name,
        CASE
          WHEN is_available = 1 AND TRUNC(menu_date) = TRUNC(SYSDATE) THEN 1
          ELSE 0
        END AS is_available,
        created_by,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM canteen_menu
      ORDER BY
        CASE
          WHEN is_available = 1 AND TRUNC(menu_date) = TRUNC(SYSDATE) THEN 0
          ELSE 1
        END,
        CASE meal_type
          WHEN 'Breakfast' THEN 1
          WHEN 'Lunch' THEN 2
          WHEN 'Snacks' THEN 3
          WHEN 'Dinner' THEN 4
          ELSE 5
        END,
        menu_id
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ menu: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch daily menu" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.createMenuItem = async (req, res) => {
  const actorUserId = req.user.userId;
  const { mealType, itemName, isAvailable } = req.body;

  if (!mealType || !itemName) {
    return res.status(400).json({ message: "mealType and itemName are required" });
  }
  if (!allowedMealTypes.includes(String(mealType).trim())) {
    return res.status(400).json({ message: "mealType must be Breakfast, Lunch, Snacks or Dinner" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const insertResult = await conn.execute(
      `
      INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by, updated_at)
      VALUES (
        CURRENT_DATE,
        :b_meal_type,
        :b_item_name,
        :b_is_available,
        :b_created_by,
        CURRENT_TIMESTAMP
      )
      RETURNING menu_id
      `,
      {
        b_meal_type: String(mealType).trim(),
        b_item_name: String(itemName).trim(),
        b_is_available: Number(isAvailable) === 0 ? 0 : 1,
        b_created_by: actorUserId
      },
      { autoCommit: false }
    );

    const menuId = insertResult.rows[0][0];

    await logSystemAction(
      conn,
      actorUserId,
      "CREATE_MENU_ITEM",
      "CANTEEN_MENU",
      menuId,
      `Created ${mealType} item: ${itemName}`
    );

    await conn.commit();
    return res.status(201).json({ message: "Menu item created successfully", menuId });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to create menu item" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.updateMenuItem = async (req, res) => {
  const actorUserId = req.user.userId;
  const { menuId } = req.params;
  const { mealType, itemName, isAvailable } = req.body;

  if (!menuId || Number.isNaN(Number(menuId))) {
    return res.status(400).json({ message: "Valid menuId is required" });
  }
  if (mealType && !allowedMealTypes.includes(String(mealType).trim())) {
    return res.status(400).json({ message: "mealType must be Breakfast, Lunch, Snacks or Dinner" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const existing = await conn.execute(
      `SELECT menu_id FROM canteen_menu WHERE menu_id = :b_menu_id`,
      { b_menu_id: Number(menuId) }
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    await conn.execute(
      `
      UPDATE canteen_menu
      SET meal_type = COALESCE(:b_meal_type, meal_type),
          item_name = COALESCE(:b_item_name, item_name),
          is_available = COALESCE(:b_is_available, is_available),
          menu_date = CASE
            WHEN :b_is_available = 1 THEN TRUNC(SYSDATE)
            ELSE menu_date
          END,
          updated_at = SYSDATE
      WHERE menu_id = :b_menu_id
      `,
      {
        b_meal_type: mealType ? String(mealType).trim() : null,
        b_item_name: itemName ? String(itemName).trim() : null,
        b_is_available: isAvailable === undefined ? null : Number(isAvailable) === 0 ? 0 : 1,
        b_menu_id: Number(menuId)
      },
      { autoCommit: false }
    );

    await logSystemAction(
      conn,
      actorUserId,
      "UPDATE_MENU_ITEM",
      "CANTEEN_MENU",
      Number(menuId),
      `Updated menu item ${menuId}`
    );

    await conn.commit();
    return res.json({ message: "Menu item updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to update menu item" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.getDinnerPolls = async (_req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const pollsResult = await conn.execute(
      `
      SELECT
        p.poll_id,
        p.title,
        TO_CHAR(p.dinner_date, 'YYYY-MM-DD') AS dinner_date,
        TO_CHAR(p.closes_at, 'YYYY-MM-DD HH24:MI:SS') AS closes_at,
        TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
        TO_CHAR(p.closed_at, 'YYYY-MM-DD HH24:MI:SS') AS closed_at,
        CASE
          WHEN p.status = 'Closed' OR p.closes_at < SYSDATE THEN 'Closed'
          WHEN TRUNC(p.dinner_date) > TRUNC(SYSDATE) THEN 'Scheduled'
          ELSE 'Active'
        END AS poll_status
      FROM dinner_polls p
      ORDER BY p.dinner_date DESC, p.poll_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const polls = await mapPollRows(conn, pollsResult.rows || []);
    return res.json({ polls });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch dinner polls" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.deleteMenuItem = async (req, res) => {
  const actorUserId = req.user.userId;
  const { menuId } = req.params;

  if (!menuId || Number.isNaN(Number(menuId))) {
    return res.status(400).json({ message: "Valid menuId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const existing = await conn.execute(
      `
      SELECT menu_id, meal_type, item_name
      FROM canteen_menu
      WHERE menu_id = :b_menu_id
      `,
      { b_menu_id: Number(menuId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const currentItem = existing.rows[0];

    await conn.execute(
      `DELETE FROM canteen_menu WHERE menu_id = :b_menu_id`,
      { b_menu_id: Number(menuId) },
      { autoCommit: false }
    );

    await logSystemAction(
      conn,
      actorUserId,
      "DELETE_MENU_ITEM",
      "CANTEEN_MENU",
      Number(menuId),
      `Deleted ${currentItem.MEAL_TYPE} item: ${currentItem.ITEM_NAME}`
    );

    await conn.commit();
    return res.json({ message: "Menu item deleted successfully" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to delete menu item" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.createDinnerPoll = async (req, res) => {
  const actorUserId = req.user.userId;
  const { title, dinnerDate, closesAt, options } = req.body;

  if (!title || !String(title).trim() || !dinnerDate || !closesAt || !Array.isArray(options)) {
    return res.status(400).json({ message: "title, dinnerDate, closesAt and options are required" });
  }
  if (!isValidIsoDate(String(dinnerDate).trim())) {
    return res.status(400).json({ message: "dinnerDate must be YYYY-MM-DD" });
  }

  const normalizedOptions = options
    .map((option) => ({
      optionId: option?.optionId && !Number.isNaN(Number(option.optionId)) ? Number(option.optionId) : null,
      optionName: option?.optionName ? String(option.optionName).trim() : "",
      description: option?.description ? String(option.description).trim() : ""
    }))
    .filter((option) => option.optionName);

  if (normalizedOptions.length < 2 || normalizedOptions.length > 4) {
    return res.status(400).json({ message: "options must contain between 2 and 4 choices" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const pollInsert = await conn.execute(
      `
      INSERT INTO dinner_polls (title, dinner_date, closes_at, status, created_by)
      VALUES (
        :b_title,
        TO_DATE(:b_dinner_date, 'YYYY-MM-DD'),
        TO_DATE(:b_closes_at, 'YYYY-MM-DD HH24:MI'),
        'Open',
        :b_created_by
      )
      RETURNING poll_id
      `,
      {
        b_title: String(title).trim(),
        b_dinner_date: String(dinnerDate).trim(),
        b_closes_at: String(closesAt).trim(),
        b_created_by: actorUserId
      },
      { autoCommit: false }
    );

    const pollId = pollInsert.rows[0][0];

    for (let index = 0; index < normalizedOptions.length; index += 1) {
      const option = normalizedOptions[index];
      await conn.execute(
        `
        INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order)
        VALUES (:b_poll_id, :b_option_name, :b_description, :b_display_order)
        `,
        {
          b_poll_id: pollId,
          b_option_name: option.optionName,
          b_description: option.description || null,
          b_display_order: index + 1
        },
        { autoCommit: false }
      );
    }

    await logSystemAction(
      conn,
      actorUserId,
      "CREATE_DINNER_POLL",
      "DINNER_POLL",
      pollId,
      `Created dinner poll for ${String(dinnerDate).trim()}`
    );

    await conn.commit();
    return res.status(201).json({ message: "Dinner poll created successfully", pollId });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to create dinner poll" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.updateDinnerPoll = async (req, res) => {
  const actorUserId = req.user.userId;
  const { pollId } = req.params;
  const { title, dinnerDate, closesAt, options } = req.body;

  if (!pollId || Number.isNaN(Number(pollId))) {
    return res.status(400).json({ message: "Valid pollId is required" });
  }
  if (!title || !String(title).trim() || !dinnerDate || !closesAt || !Array.isArray(options)) {
    return res.status(400).json({ message: "title, dinnerDate, closesAt and options are required" });
  }
  if (!isValidIsoDate(String(dinnerDate).trim())) {
    return res.status(400).json({ message: "dinnerDate must be YYYY-MM-DD" });
  }

  const normalizedOptions = options
    .map((option) => ({
      optionName: option?.optionName ? String(option.optionName).trim() : "",
      description: option?.description ? String(option.description).trim() : ""
    }))
    .filter((option) => option.optionName);

  if (normalizedOptions.length < 2 || normalizedOptions.length > 4) {
    return res.status(400).json({ message: "options must contain between 2 and 4 choices" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const existing = await conn.execute(
      `
      SELECT
        poll_id,
        status,
        closes_at
      FROM dinner_polls
      WHERE poll_id = :b_poll_id
      `,
      { b_poll_id: Number(pollId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Dinner poll not found" });
    }

    const existingPoll = existing.rows[0];
    const closesAtValue = existingPoll.CLOSES_AT instanceof Date
      ? existingPoll.CLOSES_AT
      : existingPoll.CLOSES_AT
        ? new Date(existingPoll.CLOSES_AT)
        : null;
    const isClosedPoll = existingPoll.STATUS === "Closed" || (closesAtValue instanceof Date && !Number.isNaN(closesAtValue.getTime()) && closesAtValue < new Date());

    const voteCountResult = await conn.execute(
      `
      SELECT COUNT(*) AS vote_count
      FROM dinner_poll_votes
      WHERE poll_id = :b_poll_id
      `,
      { b_poll_id: Number(pollId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const voteCount = Number(voteCountResult.rows?.[0]?.VOTE_COUNT || 0);

    await conn.execute(
      `
      UPDATE dinner_polls
      SET title = :b_title,
          dinner_date = TO_DATE(:b_dinner_date, 'YYYY-MM-DD'),
          closes_at = TO_DATE(:b_closes_at, 'YYYY-MM-DD HH24:MI')
      WHERE poll_id = :b_poll_id
      `,
      {
        b_title: String(title).trim(),
        b_dinner_date: String(dinnerDate).trim(),
        b_closes_at: String(closesAt).trim(),
        b_poll_id: Number(pollId)
      },
      { autoCommit: false }
    );

    if (isClosedPoll) {
      await conn.execute(
        `
        UPDATE dinner_polls
        SET title = :b_title,
            dinner_date = TO_DATE(:b_dinner_date, 'YYYY-MM-DD'),
            closes_at = TO_DATE(:b_closes_at, 'YYYY-MM-DD HH24:MI'),
            status = 'Open',
            closed_at = NULL
        WHERE poll_id = :b_poll_id
        `,
        {
          b_title: String(title).trim(),
          b_dinner_date: String(dinnerDate).trim(),
          b_closes_at: String(closesAt).trim(),
          b_poll_id: Number(pollId)
        },
        { autoCommit: false }
      );

      await conn.execute(
        `DELETE FROM dinner_poll_votes WHERE poll_id = :b_poll_id`,
        { b_poll_id: Number(pollId) },
        { autoCommit: false }
      );

      await conn.execute(
        `DELETE FROM dinner_poll_options WHERE poll_id = :b_poll_id`,
        { b_poll_id: Number(pollId) },
        { autoCommit: false }
      );

      for (let index = 0; index < normalizedOptions.length; index += 1) {
        const option = normalizedOptions[index];
        await conn.execute(
          `
          INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order)
          VALUES (:b_poll_id, :b_option_name, :b_description, :b_display_order)
          `,
          {
            b_poll_id: Number(pollId),
            b_option_name: option.optionName,
            b_description: option.description || null,
            b_display_order: index + 1
          },
          { autoCommit: false }
        );
      }
    } else if (voteCount > 0) {
      const existingOptionsResult = await conn.execute(
        `
        SELECT option_id
        FROM dinner_poll_options
        WHERE poll_id = :b_poll_id
        ORDER BY display_order, option_id
        `,
        { b_poll_id: Number(pollId) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const existingOptionIds = (existingOptionsResult.rows || []).map((row) => Number(row.OPTION_ID));
      const incomingOptionIds = normalizedOptions
        .map((option) => option.optionId)
        .filter((optionId) => Number.isFinite(optionId))
        .map(Number);

      const sameOptionCount = existingOptionIds.length === normalizedOptions.length;
      const sameOptionSet = sameOptionCount
        && existingOptionIds.every((optionId) => incomingOptionIds.includes(optionId));

      if (!sameOptionSet) {
        return res.status(400).json({
          message: "Poll options with votes cannot be added or removed. You can edit the existing option text only."
        });
      }

      for (let index = 0; index < normalizedOptions.length; index += 1) {
        const option = normalizedOptions[index];
        await conn.execute(
          `
          UPDATE dinner_poll_options
          SET option_name = :b_option_name,
              description = :b_description,
              display_order = :b_display_order
          WHERE option_id = :b_option_id
            AND poll_id = :b_poll_id
          `,
          {
            b_option_name: option.optionName,
            b_description: option.description || null,
            b_display_order: index + 1,
            b_option_id: Number(option.optionId),
            b_poll_id: Number(pollId)
          },
          { autoCommit: false }
        );
      }
    } else {
      await conn.execute(
        `DELETE FROM dinner_poll_options WHERE poll_id = :b_poll_id`,
        { b_poll_id: Number(pollId) },
        { autoCommit: false }
      );

      for (let index = 0; index < normalizedOptions.length; index += 1) {
        const option = normalizedOptions[index];
        await conn.execute(
          `
          INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order)
          VALUES (:b_poll_id, :b_option_name, :b_description, :b_display_order)
          `,
          {
            b_poll_id: Number(pollId),
            b_option_name: option.optionName,
            b_description: option.description || null,
            b_display_order: index + 1
          },
          { autoCommit: false }
        );
      }
    }

    await logSystemAction(
      conn,
      actorUserId,
      "UPDATE_DINNER_POLL",
      "DINNER_POLL",
      Number(pollId),
      isClosedPoll
        ? `Reused closed dinner poll ${pollId} with fresh voting`
        : `Updated dinner poll ${pollId}`
    );

    await conn.commit();
    return res.json({ message: "Dinner poll updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to update dinner poll" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.deleteDinnerPoll = async (req, res) => {
  const actorUserId = req.user.userId;
  const { pollId } = req.params;

  if (!pollId || Number.isNaN(Number(pollId))) {
    return res.status(400).json({ message: "Valid pollId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const existing = await conn.execute(
      `
      SELECT poll_id, title
      FROM dinner_polls
      WHERE poll_id = :b_poll_id
      `,
      { b_poll_id: Number(pollId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Dinner poll not found" });
    }

    await conn.execute(
      `DELETE FROM dinner_poll_votes WHERE poll_id = :b_poll_id`,
      { b_poll_id: Number(pollId) },
      { autoCommit: false }
    );
    await conn.execute(
      `DELETE FROM dinner_poll_options WHERE poll_id = :b_poll_id`,
      { b_poll_id: Number(pollId) },
      { autoCommit: false }
    );
    await conn.execute(
      `DELETE FROM dinner_polls WHERE poll_id = :b_poll_id`,
      { b_poll_id: Number(pollId) },
      { autoCommit: false }
    );

    await logSystemAction(
      conn,
      actorUserId,
      "DELETE_DINNER_POLL",
      "DINNER_POLL",
      Number(pollId),
      `Deleted dinner poll: ${existing.rows[0].TITLE}`
    );

    await conn.commit();
    return res.json({ message: "Dinner poll deleted successfully" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to delete dinner poll" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.closeDinnerPoll = async (req, res) => {
  const actorUserId = req.user.userId;
  const { pollId } = req.params;

  if (!pollId || Number.isNaN(Number(pollId))) {
    return res.status(400).json({ message: "Valid pollId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const existing = await conn.execute(
      `SELECT poll_id, status FROM dinner_polls WHERE poll_id = :b_poll_id`,
      { b_poll_id: Number(pollId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Dinner poll not found" });
    }

    await conn.execute(
      `
      UPDATE dinner_polls
      SET status = 'Closed',
          closed_at = SYSDATE
      WHERE poll_id = :b_poll_id
      `,
      { b_poll_id: Number(pollId) },
      { autoCommit: false }
    );

    await logSystemAction(
      conn,
      actorUserId,
      "CLOSE_DINNER_POLL",
      "DINNER_POLL",
      Number(pollId),
      `Closed dinner poll ${pollId}`
    );

    await conn.commit();
    return res.json({ message: "Dinner poll closed successfully" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to close dinner poll" });
  } finally {
    if (conn) await conn.close();
  }
};

// AI Food Portion and Waste Estimator
exports.getAiWastePrediction = async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    
    // 1. Get total students count
    const totalStudentsResult = await conn.execute(
      `
      SELECT COUNT(*) AS total
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE r.role_name = 'Student'
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const totalStudents = Number(totalStudentsResult.rows[0]?.TOTAL || 0);

    // 2. Get active approved leaves count today
    const activeLeavesResult = await conn.execute(
      `
      SELECT COUNT(DISTINCT user_id) AS total
      FROM leave_requests
      WHERE status = 'Approved'
        AND CURRENT_DATE BETWEEN from_date AND to_date
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const activeLeaves = Number(activeLeavesResult.rows[0]?.TOTAL || 0);

    // 3. Get students on daily outing right now (Checked OUT, no entry_time, and leave_id is NULL)
    const activeOutingsResult = await conn.execute(
      `
      SELECT COUNT(DISTINCT user_id) AS total
      FROM entry_exit_logs
      WHERE status = 'OUT'
        AND entry_time IS NULL
        AND leave_id IS NULL
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const activeOutings = Number(activeOutingsResult.rows[0]?.TOTAL || 0);

    // 4. Fetch the recent dinner polls (up to 5) to construct historical context
    const pollsResult = await conn.execute(
      `
      SELECT
        p.poll_id,
        p.title,
        TO_CHAR(p.dinner_date, 'YYYY-MM-DD') AS dinner_date,
        (SELECT COUNT(*) FROM dinner_poll_votes v WHERE v.poll_id = p.poll_id) AS total_votes
      FROM dinner_polls p
      ORDER BY p.dinner_date DESC
      LIMIT 5
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const recentPolls = (pollsResult.rows || []).map(row => ({
      POLL_ID: row.POLL_ID,
      TITLE: row.TITLE,
      DINNER_DATE: row.DINNER_DATE,
      TOTAL_VOTES: Number(row.TOTAL_VOTES || 0)
    }));

    // Calculate portions using regression simulator
    const today = new Date();
    const dayOfWeek = today.getDay();
    let dayFactor = 1.0;
    let dayName = "Weekday";

    if (dayOfWeek === 5) {
      dayFactor = 0.85;
      dayName = "Friday";
    } else if (dayOfWeek === 6) {
      dayFactor = 0.70;
      dayName = "Saturday";
    } else if (dayOfWeek === 0) {
      dayFactor = 0.75;
      dayName = "Sunday";
    } else {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      dayName = dayNames[dayOfWeek];
    }

    const currentOccupancy = Math.max(totalStudents - activeLeaves, 0);
    const basePrediction = Math.max(currentOccupancy - 0.75 * activeOutings, 0) * dayFactor;
    const predictedPortions = Math.round(basePrediction);

    // Generate historical mock comparison data for the line chart
    const daysArr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const history = daysArr.map((day, idx) => {
      const cookedFlat = 160;
      let factor = 1.0;
      if (day === "Fri") factor = 0.82;
      if (day === "Sat") factor = 0.68;
      if (day === "Sun") factor = 0.72;
      
      const actualConsumed = Math.round((totalStudents - 3 - (idx % 2 === 0 ? 5 : 12)) * factor);
      const aiPredicted = Math.round(actualConsumed + 5 + (idx % 3 === 0 ? 3 : 1));
      const flatWaste = cookedFlat - actualConsumed;
      const aiWaste = aiPredicted - actualConsumed;

      return {
        day,
        cookedFlat,
        aiPredicted,
        actualConsumed,
        flatWaste: Math.max(flatWaste, 0),
        aiWaste: Math.max(aiWaste, 0)
      };
    });

    return res.json({
      totalStudents,
      activeLeaves,
      currentOccupancy,
      activeOutings,
      dayOfWeek,
      dayName,
      dayFactor,
      predictedPortions,
      recentPolls,
      historicalData: history
    });
  } catch (err) {
    console.error("AI Waste Prediction calculation error:", err);
    return res.status(500).json({ message: "Failed to generate waste prediction" });
  } finally {
    if (conn) await conn.close();
  }
};

// AI Weekly Recipe Suggestion & Nutritional Planner
const mealDatabase = {
  "High Protein": {
    "Summer": {
      "Breakfast": ["Egg White Omelette with Sprouts", "Protein Shake & Boiled Eggs", "Spiced Chickpea & Avocado Wrap"],
      "Lunch": ["Paneer Bhurji with Roti", "Lemon Garlic Chicken with Brown Rice", "Tofu Stir Veg with Quinoa"],
      "Snacks": ["Roasted Peanut Salad", "Greek Yogurt with Berries", "Chana Chaat"],
      "Dinner": ["Grilled Chicken Breast & Dal", "Paneer Steak with Sautéed Veggies", "Fish Curry with Brown Rice"]
    },
    "Winter": {
      "Breakfast": ["Spiced Oats with Nuts & Milk", "Egg Bhurji with Multigrain Toast", "Soya Chunk Paratha"],
      "Lunch": ["High-Protein Mix Lentil Soup", "Paneer Tikka Masala & Roti", "Butter Chicken (Light) & Brown Rice"],
      "Snacks": ["Almond & Walnut Trail Mix", "Boiled Egg Salad", "Roasted Chickpeas (Chana)"],
      "Dinner": ["Tandoori Paneer with Moong Dal", "Slow-cooked Soya Curry & Roti", "Chicken Stew with Barley Rice"]
    },
    "Monsoon": {
      "Breakfast": ["Protein Besan Chilla with Paneer Filling", "Scrambled Eggs & Toast", "Sprouted Moong Salad"],
      "Lunch": ["Kadai Chicken & Roti", "Palak Paneer with Brown Rice", "Soya Chunk Matar Pulav"],
      "Snacks": ["Masala Egg Toast", "Peanut Butter Sandwich", "Hot Lentil Soup"],
      "Dinner": ["Moong Dal Tadka with Grilled Tofu", "Methi Chicken & Roti", "Paneer Kofta & Roti"]
    }
  },
  "Balanced": {
    "Summer": {
      "Breakfast": ["Idli Sambhar & Fresh Juice", "Poha with Roasted Peanuts", "Vegetable Upma"],
      "Lunch": ["Jeera Rice, Yellow Dal & Bhindi Fry", "Chole, Roti & Cucumber Raita", "Mix Veg Sabzi, Dal Tadka & Rice"],
      "Snacks": ["Veg Sandwich & Mint Tea", "Fruit Chaat", "Samosa (Limited) & Tea"],
      "Dinner": ["Aloo Gobhi, Moong Dal & Roti", "Lauki Ki Sabzi, Masoor Dal & Rice", "Mix Veg Khichdi with Papad"]
    },
    "Winter": {
      "Breakfast": ["Aloo Paratha with Curd", "Hot Vegetable Dalia", "Methi Thepla with Pickle"],
      "Lunch": ["Sarson Ka Saag & Makki Di Roti", "Rajma Chawal with Hot Tomato Soup", "Kadi Pakora with Steamed Rice"],
      "Snacks": ["Hot Tomato Soup & Crackers", "Paneer Pakora (Limited) & Hot Tea", "Roasted Peanuts & Tea"],
      "Dinner": ["Gajar Methi Sabzi, Arhar Dal & Roti", "Palak Khichdi with Ghee & Curd", "Baingan Bharta, Chana Dal & Roti"]
    },
    "Monsoon": {
      "Breakfast": ["Bread Omelette & Hot Coffee", "Puri Bhaji (Limited) & Tea", "Steamed Idli with Coconut Chutney"],
      "Lunch": ["Egg Curry & Rice", "Veg Biryani with Mix Raita", "Dal Fry, Aloo Jeera & Roti"],
      "Snacks": ["Onion Pakora & Ginger Tea", "Garlic Bread & Tomato Soup", "Corn Bhel & Tea"],
      "Dinner": ["Bhindi Masala, Toor Dal & Roti", "Mix Veg Korma & Jeera Rice", "Dal Khichdi & Pickle"]
    }
  },
  "Budget": {
    "Summer": {
      "Breakfast": ["Simple Poha & Tea", "Upma & Tea", "Bread Butter & Tea"],
      "Lunch": ["Aloo Tamatar Curry & Rice", "Yellow Dal, Roti & Onions", "Cabbage Dry Sabzi & Rice"],
      "Snacks": ["Glucose Biscuits & Tea", "Roasted Puff Rice (Kurmura)", "Samosa & Tea"],
      "Dinner": ["Aloo Patta Gobhi & Roti", "Moong Dal Khichdi & Papad", "Jeera Aloo, Dal & Roti"]
    },
    "Winter": {
      "Breakfast": ["Plain Paratha with Pickle", "Hot Dalia & Tea", "Spiced Tea & Rusk"],
      "Lunch": ["Black Chana Masala & Rice", "Aloo Matar Gajar & Roti", "Kadi Rice & Papad"],
      "Snacks": ["Biscuits & Ginger Tea", "Boiled Sweet Potatoes", "Tea & Mathri"],
      "Dinner": ["Aloo Bean Sabzi & Roti", "Dal Tadka & Steamed Rice", "Mix Veg Khichdi"]
    },
    "Monsoon": {
      "Breakfast": ["Bread Toast & Tea", "Poha & Coffee", "Suji Halwa"],
      "Lunch": ["Soyabean Aloo Curry & Rice", "Black Lentils & Roti", "Rajma & Rice"],
      "Snacks": ["Hot Tea & Rusk", "Puffed Rice Chaat", "Samosa & Tea"],
      "Dinner": ["Aloo Shimla Mirch & Roti", "Dal Khichdi & Pickle", "Aloo Baingan & Roti"]
    }
  },
  "Low Carb": {
    "Summer": {
      "Breakfast": ["Scrambled Eggs with Spinach", "Avocado & Tomato Salad", "Paneer & Cucumber Plate"],
      "Lunch": ["Cauliflower Rice & Lemon Chicken", "Sautéed Paneer & Broccoli", "Grilled Fish & Lettuce Salad"],
      "Snacks": ["Almonds & Walnuts", "Cucumber slices with Hummus", "Boiled Egg"],
      "Dinner": ["Grilled Chicken & Asparagus", "Tofu Salad with Olive Oil", "Spinach Paneer Soup"]
    },
    "Winter": {
      "Breakfast": ["Omelette with Cheese & Peppers", "Sautéed Mushrooms & Eggs", "Warm Almond Milk & Nuts"],
      "Lunch": ["Chicken Clear Soup & Salad", "Paneer Tikka with Grilled Bell Peppers", "Broccoli Soup & Grilled Tofu"],
      "Snacks": ["Mixed Roasted Seeds", "Celery Sticks with Almond Butter", "Walnuts"],
      "Dinner": ["Baked Fish with Cauliflower Mash", "Soya Bhurji & Cabbage Salad", "Garlic Butter Tofu & Spinach"]
    },
    "Monsoon": {
      "Breakfast": ["Paneer Scramble with Onions", "Boiled Eggs & Avocado", "Chia Seed Pudding"],
      "Lunch": ["Egg Bhurji & Stir-fried French Beans", "Chicken Palak (No Rice/Roti)", "Sautéed Soya Chunks & Zucchini"],
      "Snacks": ["Roasted Almonds", "Tomato Soup (No Cornstarch)", "Spiced Sunflower Seeds"],
      "Dinner": ["Paneer & Veg Soup", "Roasted Fish & Cauliflower florets", "Chicken Stir-fry (Low Carb)"]
    }
  }
};

exports.getAiRecipePlanner = async (req, res) => {
  const theme = req.query.theme || "Balanced";
  const season = req.query.season || "Summer";

  if (!mealDatabase[theme] || !mealDatabase[theme][season]) {
    return res.status(400).json({ message: "Invalid theme or season selected" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    
    // Fetch average student feedback rating for mess/canteen
    const feedbackResult = await conn.execute(
      `
      SELECT 
        COALESCE(AVG(rating), 4.2) AS avg_rating,
        COUNT(*) AS total_count
      FROM student_feedback
      WHERE LOWER(facility_area) LIKE '%mess%' 
         OR LOWER(facility_area) LIKE '%canteen%' 
         OR LOWER(facility_area) LIKE '%food%'
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const avgRating = Number(Number(feedbackResult.rows[0]?.AVG_RATING || 4.2).toFixed(1));
    const totalFeedbackCount = Number(feedbackResult.rows[0]?.TOTAL_COUNT || 0);

    const activeMeals = mealDatabase[theme][season];
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Dynamic nutritional value generator helper
    const getNutriValues = (mealType) => {
      let protein = 12;
      let carbs = 40;
      let fat = 8;
      let calories = 300;

      if (theme === "High Protein") {
        protein = mealType === "Lunch" || mealType === "Dinner" ? 35 : 20;
        carbs = 30;
      } else if (theme === "Low Carb") {
        protein = 22;
        carbs = 8;
        fat = 12;
      } else if (theme === "Budget") {
        protein = 10;
        carbs = 50;
      }

      if (mealType === "Lunch" || mealType === "Dinner") {
        calories = theme === "Low Carb" ? 400 : 550;
      } else if (mealType === "Snacks") {
        calories = 180;
        protein = 5;
      }

      return {
        PROTEIN_G: protein,
        CARBS_G: carbs,
        FAT_G: fat,
        CALORIES: calories
      };
    };

    const schedule = [];
    daysOfWeek.forEach((day, dayIdx) => {
      ["Breakfast", "Lunch", "Snacks", "Dinner"].forEach((mealType) => {
        const list = activeMeals[mealType];
        const dishIndex = (dayIdx) % list.length;
        const itemName = list[dishIndex];

        let ingredients = ["Spiced herbs", "Oil", "Salt", "Wheat Roti"];
        if (itemName.toLowerCase().includes("egg")) ingredients = ["Fresh Eggs", "Onions", "Green Chillies", "Butter"];
        if (itemName.toLowerCase().includes("paneer")) ingredients = ["Cottage Cheese (Paneer)", "Tomato Gravy", "Kadhai Spices"];
        if (itemName.toLowerCase().includes("chicken")) ingredients = ["Chicken Breast", "Ginger-Garlic Paste", "Yogurt marinade"];
        if (itemName.toLowerCase().includes("poha")) ingredients = ["Flattened Rice (Poha)", "Peanuts", "Mustard seeds", "Turmeric"];
        if (itemName.toLowerCase().includes("dal")) ingredients = ["Lentils (Moong/Toor)", "Ghee", "Garlic", "Cumin seeds"];
        if (itemName.toLowerCase().includes("soup")) ingredients = ["Fresh Vegetables", "Black Pepper", "Broth base"];

        const nutrition = getNutriValues(mealType);

        schedule.push({
          DAY_OF_WEEK: day,
          MEAL_TYPE: mealType,
          ITEM_NAME: itemName,
          INGREDIENTS: ingredients.join(", "),
          NUTRITION: nutrition,
          POPULARITY: Number((4.0 + (dayIdx % 3) * 0.3 + (mealType === "Dinner" ? 0.2 : 0)).toFixed(1))
        });
      });
    });

    return res.json({
      theme,
      season,
      avgMessRating: avgRating,
      totalFeedbackCount,
      schedule
    });
  } catch (err) {
    console.error("AI Recipe Planner error:", err);
    return res.status(500).json({ message: "Failed to load recipe plan" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.applyAiRecipePlan = async (req, res) => {
  const actorUserId = req.user.userId;
  const { menuItems } = req.body;

  if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
    return res.status(400).json({ message: "menuItems array is required" });
  }

  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

  const dayOffsets = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6
  };

  let conn;
  try {
    conn = await oracledb.getConnection();
    
    for (const item of menuItems) {
      const { DAY_OF_WEEK, MEAL_TYPE, ITEM_NAME } = item;
      const offset = dayOffsets[DAY_OF_WEEK];
      if (offset === undefined) continue;

      const targetDate = new Date(nextMonday);
      targetDate.setDate(nextMonday.getDate() + offset);
      const dateStr = targetDate.toISOString().slice(0, 10);

      // Delete existing menu items for the same date and meal_type to prevent double records
      await conn.execute(
        `
        DELETE FROM canteen_menu
        WHERE TRUNC(menu_date) = TO_TIMESTAMP(:b_date, 'YYYY-MM-DD')
          AND meal_type = :b_meal_type
        `,
        {
          b_date: dateStr,
          b_meal_type: MEAL_TYPE
        },
        { autoCommit: false }
      );

      // Insert the new item
      await conn.execute(
        `
        INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by, updated_at)
        VALUES (
          TO_TIMESTAMP(:b_date, 'YYYY-MM-DD'),
          :b_meal_type,
          :b_item_name,
          1,
          :b_created_by,
          CURRENT_TIMESTAMP
        )
        `,
        {
          b_date: dateStr,
          b_meal_type: MEAL_TYPE,
          b_item_name: ITEM_NAME,
          b_created_by: actorUserId
        },
        { autoCommit: false }
      );
    }

    await logSystemAction(
      conn,
      actorUserId,
      "APPLY_AI_WEEKLY_MENU",
      "CANTEEN_MENU",
      null,
      `Applied AI Weekly Menu plan starting ${nextMonday.toISOString().slice(0, 10)}`
    );

    await conn.commit();
    return res.status(201).json({
      message: `AI Weekly Menu successfully applied to database starting ${nextMonday.toISOString().slice(0, 10)}!`,
      startDate: nextMonday.toISOString().slice(0, 10)
    });
  } catch (err) {
    console.error("Apply AI Weekly Menu error:", err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to apply weekly menu to canteen menu table" });
  } finally {
    if (conn) await conn.close();
  }
};
