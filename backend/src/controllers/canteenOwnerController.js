const { oracledb } = require("../config/db");

const isValidIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const allowedMealTypes = ["Breakfast", "Lunch", "Snacks", "Dinner"];
const allowedOrderStatuses = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"];

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

    return {
      ...poll,
      TOTAL_VOTES: options.reduce((sum, option) => sum + option.VOTE_COUNT, 0),
      OPTIONS: options
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
  const { date } = req.query;

  if (date && !isValidIsoDate(String(date).trim())) {
    return res.status(400).json({ message: "date must be YYYY-MM-DD" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT
        menu_id,
        TO_CHAR(menu_date, 'YYYY-MM-DD') AS menu_date,
        meal_type,
        item_name,
        is_available,
        created_by,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM canteen_menu
      WHERE (:b_menu_date IS NULL AND menu_date = TRUNC(SYSDATE))
         OR (:b_menu_date IS NOT NULL AND menu_date = TO_DATE(:b_menu_date, 'YYYY-MM-DD'))
      ORDER BY
        CASE meal_type
          WHEN 'Breakfast' THEN 1
          WHEN 'Lunch' THEN 2
          WHEN 'Snacks' THEN 3
          WHEN 'Dinner' THEN 4
          ELSE 5
        END,
        menu_id
      `,
      { b_menu_date: date ? String(date).trim() : null },
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
  const { menuDate, mealType, itemName, isAvailable } = req.body;

  if (!menuDate || !mealType || !itemName) {
    return res.status(400).json({ message: "menuDate, mealType and itemName are required" });
  }
  if (!isValidIsoDate(String(menuDate).trim())) {
    return res.status(400).json({ message: "menuDate must be YYYY-MM-DD" });
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
        TO_DATE(:b_menu_date, 'YYYY-MM-DD'),
        :b_meal_type,
        :b_item_name,
        :b_is_available,
        :b_created_by,
        SYSDATE
      )
      RETURNING menu_id INTO :b_menu_id
      `,
      {
        b_menu_date: String(menuDate).trim(),
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
      `Created ${mealType} item for ${menuDate}: ${itemName}`
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
  const { menuDate, mealType, itemName, isAvailable } = req.body;

  if (!menuId || Number.isNaN(Number(menuId))) {
    return res.status(400).json({ message: "Valid menuId is required" });
  }
  if (menuDate && !isValidIsoDate(String(menuDate).trim())) {
    return res.status(400).json({ message: "menuDate must be YYYY-MM-DD" });
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
      SET menu_date = COALESCE(TO_DATE(:b_menu_date, 'YYYY-MM-DD'), menu_date),
          meal_type = COALESCE(:b_meal_type, meal_type),
          item_name = COALESCE(:b_item_name, item_name),
          is_available = COALESCE(:b_is_available, is_available),
          updated_at = SYSDATE
      WHERE menu_id = :b_menu_id
      `,
      {
        b_menu_date: menuDate ? String(menuDate).trim() : null,
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

exports.getNightFoodOrders = async (req, res) => {
  const { date, status } = req.query;

  if (date && !isValidIsoDate(String(date).trim())) {
    return res.status(400).json({ message: "date must be YYYY-MM-DD" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT
        nfo.order_id,
        u.student_id,
        s.full_name,
        TO_CHAR(nfo.order_date, 'YYYY-MM-DD') AS order_date,
        nfo.item_name,
        nfo.quantity,
        nfo.notes,
        nfo.status,
        TO_CHAR(nfo.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM night_food_orders nfo
      JOIN users u ON u.user_id = nfo.user_id
      LEFT JOIN students s ON s.user_id = nfo.user_id
      WHERE (:b_order_date IS NULL OR TRUNC(nfo.order_date) = TO_DATE(:b_order_date, 'YYYY-MM-DD'))
        AND (:b_status IS NULL OR nfo.status = :b_status)
      ORDER BY nfo.order_date DESC, nfo.order_id DESC
      `,
      {
        b_order_date: date ? String(date).trim() : null,
        b_status: status ? String(status).trim() : null
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ orders: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch night food orders" });
  } finally {
    if (conn) await conn.close();
  }
};

exports.updateNightFoodOrderStatus = async (req, res) => {
  const actorUserId = req.user.userId;
  const { orderId } = req.params;
  const { status } = req.body;

  if (!orderId || Number.isNaN(Number(orderId))) {
    return res.status(400).json({ message: "Valid orderId is required" });
  }
  if (!status || !String(status).trim()) {
    return res.status(400).json({ message: "status is required" });
  }
  if (!allowedOrderStatuses.includes(String(status).trim())) {
    return res.status(400).json({ message: "status must be Pending, Preparing, Ready, Delivered or Cancelled" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const existing = await conn.execute(
      `SELECT order_id FROM night_food_orders WHERE order_id = :b_order_id`,
      { b_order_id: Number(orderId) }
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Night food order not found" });
    }

    await conn.execute(
      `
      UPDATE night_food_orders
      SET status = :b_status,
          updated_at = SYSDATE,
          updated_by = :b_updated_by
      WHERE order_id = :b_order_id
      `,
      {
        b_status: String(status).trim(),
        b_updated_by: actorUserId,
        b_order_id: Number(orderId)
      },
      { autoCommit: false }
    );

    await logSystemAction(
      conn,
      actorUserId,
      "UPDATE_NIGHT_FOOD_ORDER_STATUS",
      "NIGHT_FOOD_ORDER",
      Number(orderId),
      `Updated order ${orderId} status to ${status}`
    );

    await conn.commit();
    return res.json({ message: "Night food order status updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "Failed to update night food order status" });
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
