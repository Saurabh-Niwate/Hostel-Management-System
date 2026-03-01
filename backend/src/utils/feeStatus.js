const syncOverdueFeeStatuses = async (conn) => {
  // Move unpaid past-due records to Overdue.
  await conn.execute(
    `
    UPDATE student_fees
    SET status = 'Overdue',
        updated_at = SYSDATE
    WHERE due_date IS NOT NULL
      AND TRUNC(due_date) < TRUNC(SYSDATE)
      AND NVL(amount_paid, 0) < NVL(amount_total, 0)
      AND status IN ('Pending', 'Partially Paid')
    `,
    {},
    { autoCommit: false }
  );

  // Keep paid records normalized.
  await conn.execute(
    `
    UPDATE student_fees
    SET status = 'Paid',
        updated_at = SYSDATE
    WHERE NVL(amount_paid, 0) >= NVL(amount_total, 0)
      AND status <> 'Paid'
    `,
    {},
    { autoCommit: false }
  );

  // If due date is now future/null and record is unpaid, normalize Overdue back.
  await conn.execute(
    `
    UPDATE student_fees
    SET status =
      CASE
        WHEN NVL(amount_paid, 0) = 0 THEN 'Pending'
        ELSE 'Partially Paid'
      END,
      updated_at = SYSDATE
    WHERE (due_date IS NULL OR TRUNC(due_date) >= TRUNC(SYSDATE))
      AND NVL(amount_paid, 0) < NVL(amount_total, 0)
      AND status = 'Overdue'
    `,
    {},
    { autoCommit: false }
  );

  await conn.commit();
};

module.exports = {
  syncOverdueFeeStatuses
};

