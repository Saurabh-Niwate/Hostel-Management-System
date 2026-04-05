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
        TRUNC(SYSDATE),
        :b_meal_type,
        :b_item_name,
        :b_is_available,
        :b_created_by,
        SYSDATE
      )
      RETURNING menu_id INTO :b_menu_id
      `,
      {
        b_meal_type: String(mealType).trim(),
        b_item_name: String(itemName).trim(),
        b_is_available: Number(isAvailable) === 0 ? 0 : 1,
        b_created_by: actorUserId,
        b_menu_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: false }
    );

    const menuId = insertResult.outBinds.b_menu_id[0];

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
      RETURNING poll_id INTO :b_poll_id
      `,
      {
        b_title: String(title).trim(),
        b_dinner_date: String(dinnerDate).trim(),
        b_closes_at: String(closesAt).trim(),
        b_created_by: actorUserId,
        b_poll_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: false }
    );

    const pollId = pollInsert.outBinds.b_poll_id[0];

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
      SELECT poll_id, status
      FROM dinner_polls
      WHERE poll_id = :b_poll_id
      `,
      { b_poll_id: Number(pollId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Dinner poll not found" });
    }

    if (existing.rows[0].STATUS === "Closed") {
      return res.status(400).json({ message: "Closed dinner polls cannot be edited" });
    }

    const voteCountResult = await conn.execute(
      `
      SELECT COUNT(*) AS vote_count
      FROM dinner_poll_votes
      WHERE poll_id = :b_poll_id
      `,
      { b_poll_id: Number(pollId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (Number(voteCountResult.rows?.[0]?.VOTE_COUNT || 0) > 0) {
      return res.status(400).json({ message: "Dinner polls with votes cannot be edited" });
    }

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

    await logSystemAction(
      conn,
      actorUserId,
      "UPDATE_DINNER_POLL",
      "DINNER_POLL",
      Number(pollId),
      `Updated dinner poll ${pollId}`
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
