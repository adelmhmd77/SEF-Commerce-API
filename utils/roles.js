const API_ASSIGNABLE_ROLES = ["customer", "admin"]; // Owner مش فيهم

const isOwnerValue = (v) =>
  typeof v === "string" && v.trim().toLowerCase() === "owner";

module.exports = { API_ASSIGNABLE_ROLES, isOwnerValue };
