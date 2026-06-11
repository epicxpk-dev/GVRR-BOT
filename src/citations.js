const { getCitations, getPsDatabase, saveCitations, savePsDatabase } = require("./storage");

function nextId(prefix = "CIT") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function addCitation({ guildId, civilianId, issuerId, offense, count, fine, department, location, notes, evidence }) {
  const citations = getCitations();
  citations[guildId] ||= {};
  citations[guildId][civilianId] ||= [];

  const citation = {
    id: nextId("CIT"),
    civilianId,
    issuerId,
    offense,
    count,
    fine,
    department,
    location,
    notes: notes || "",
    evidence: evidence || "",
    status: "unpaid",
    createdAt: new Date().toISOString()
  };

  citations[guildId][civilianId].push(citation);
  saveCitations(citations);
  return citation;
}

function getUserCitations(guildId, userId) {
  const citations = getCitations();
  return citations[guildId]?.[userId] || [];
}

function getUnpaidCitation(guildId, userId, citationId) {
  const userCitations = getUserCitations(guildId, userId);
  if (citationId) {
    return userCitations.find((citation) => citation.id.toLowerCase() === citationId.toLowerCase() && citation.status === "unpaid") || null;
  }

  return userCitations.find((citation) => citation.status === "unpaid") || null;
}

function markCitationPaid(guildId, userId, citationId) {
  const citations = getCitations();
  const citation = (citations[guildId]?.[userId] || []).find((item) => item.id === citationId);
  if (!citation) return null;

  citation.status = "paid";
  citation.paidAt = new Date().toISOString();
  saveCitations(citations);
  return citation;
}

function removeCitation({ guildId, userId, citationId, removedBy, reason }) {
  const citations = getCitations();
  const userCitations = citations[guildId]?.[userId] || [];
  const citation = userCitations.find((item) => item.id.toLowerCase() === citationId.toLowerCase());
  if (!citation) return null;

  citation.status = "removed";
  citation.removedBy = removedBy;
  citation.removalReason = reason;
  citation.removedAt = new Date().toISOString();
  saveCitations(citations);
  return citation;
}

function addPsRecord({ guildId, department, ownerId, vehicleModel, vehicleColor, vehiclePlate, totalAmountDue, departmentName, location, additionalNotes, recipientSignature, officerId, arrestations }) {
  const psDatabase = getPsDatabase();
  psDatabase[guildId] ||= [];

  const record = {
    id: nextId("DB"),
    department,
    ownerId,
    vehicleModel,
    vehicleColor,
    vehiclePlate,
    totalAmountDue,
    departmentName,
    location,
    additionalNotes: additionalNotes || "",
    recipientSignature: recipientSignature || "",
    officerId,
    arrestations: arrestations || "None",
    createdAt: new Date().toISOString()
  };

  psDatabase[guildId].push(record);
  savePsDatabase(psDatabase);
  return record;
}

module.exports = {
  addCitation,
  addPsRecord,
  getUnpaidCitation,
  getUserCitations,
  markCitationPaid,
  removeCitation
};
