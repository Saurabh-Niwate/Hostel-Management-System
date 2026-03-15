export type WardenRoom = {
  ROOM_NO: string;
  BLOCK_NAME: string;
  FLOOR_NO: number;
  CAPACITY: number;
  ROOM_TYPE: string;
  IS_ACTIVE: number;
  OCCUPIED: number;
};

export type WardenStudent = {
  USER_ID?: number;
  STUDENT_ID: string;
  EMAIL?: string;
  FULL_NAME?: string;
  PHONE?: string;
  GUARDIAN_NAME?: string;
  GUARDIAN_PHONE?: string;
  ADDRESS?: string;
  ROOM_NO?: string;
  PROFILE_IMAGE_URL?: string;
};

export type WardenAttendanceRow = {
  ATTENDANCE_ID?: number;
  ATTENDANCE_DATE: string;
  STATUS: "Present" | "Absent" | string;
  REMARKS?: string;
  STUDENT_ID: string;
  FULL_NAME?: string;
  ROOM_NO?: string;
};

export type WardenLeaveRow = {
  LEAVE_ID: number;
  STUDENT_ID: string;
  FULL_NAME?: string;
  ROOM_NO?: string;
  LEAVE_TYPE: string;
  FROM_DATE: string;
  TO_DATE: string;
  REASON: string;
  STATUS: "Pending" | "Approved" | "Rejected" | string;
  CREATED_AT: string;
};
