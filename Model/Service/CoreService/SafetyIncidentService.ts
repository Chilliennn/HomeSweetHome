import {
  SafetyIncidentInput,
  SafetyIncidentRecord,
  IncidentType,
  Severity,
} from "../../types/safetyIncident";

import {
  fetchSafetyFormConfig,
  uploadEvidenceToStorage,
  insertSafetyIncident,
  triggerCriticalIncidentAlert,
} from "../../Repository/SafetyIncidentRepository/safetyIncidentRepository";

export async function loadSafetyFormConfig() {
  return fetchSafetyFormConfig();
}

// Severity Auto Classification (simple "AI" rules)
export function classifySeverity(description: string): Severity {
  const text = description.toLowerCase();

  const criticalKeywords = ["abuse", "hit", "violence", "threat", "danger", "police"];
  const highKeywords = ["harrass", "harassment", "bully", "unsafe", "scared"];
  const mediumKeywords = ["uncomfortable", "problem", "rude", "late"];

  const contains = (list: string[]) =>
    list.some((word) => text.includes(word));

  if (contains(criticalKeywords)) return "critical";
  if (contains(highKeywords)) return "high";
  if (contains(mediumKeywords)) return "medium";
  return "low";
}

// Map UI Report Type → DB incident_type
export function mapUiReportTypeToIncidentType(
  uiType: SafetyIncidentInput["uiReportType"],
): IncidentType {
  if (uiType === "Positive Feedback") {
    return "other";
  }
  return "other";
}

// Main Submit logic
export async function submitSafetyIncident(
  input: SafetyIncidentInput,
): Promise<SafetyIncidentRecord> { // ✅ FIXED return type

  // UC401_8 / A2 – validate input
  if (
    !input.uiReportType ||
    !input.subject.trim() ||
    !input.description.trim()
  ) {
    throw new Error("EMPTY_FIELDS");
  }

  // ✅ FIXED union type syntax
  let evidenceJson: { files: any[] } | null = null;

  if (input.evidenceUrls.length > 0) {
    const uploaded = await uploadEvidenceToStorage(
      input.reporterId,
      input.evidenceUrls,
    );

    evidenceJson = { files: uploaded };
  }

  const severity = classifySeverity(input.description);

  const incidentType = mapUiReportTypeToIncidentType(input.uiReportType);
  const status = "new";

  const record = await insertSafetyIncident({
    input,
    incidentType,
    severity,
    status,
    evidence: evidenceJson,
  });

  // Trigger alert for critical incidents
  if (severity === "critical") {
    await triggerCriticalIncidentAlert(record.id);
  }

  return record;
}
