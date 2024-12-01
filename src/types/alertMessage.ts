export interface optionMessage {
  severityLevel: string;
  severity: string;
  description: string;
  message: string;
  riverOrSea: string;
  county: string;
  timeMessageChanged: string;
}

export interface popupMessage {
  severityLevel: string;
  severity: string;
  description: string;
}

export interface BackgroundPopupMessage {
  id: string;
  severityLevel: string;
  severity: string;
  description: string;
  message: string;
  riverOrSea: string;
  county: string;
  timeMessageChanged: string;
}
