const BASE_URL = "http://localhost:8080/api";

// --- התחברות ---
export const loginWithPasskey = async (passkey: string) => {
  const response = await fetch(`${BASE_URL}/employees/login/${passkey}`);
  
  if (!response.ok) {
    throw new Error("קוד גישה שגוי או שרת כבוי");
  }
  
  return response.json(); 
};

// --- משימות כלליות ---
export const getMissions = async () => {
  const response = await fetch(`${BASE_URL}/missions`);
  if (!response.ok) throw new Error("נכשל בטעינת משימות");
  return response.json();
};

// --- משימות לפי מנהל (היה חסר!) ---
export const getMissionsByManager = async (managerId: number) => {
  const response = await fetch(`${BASE_URL}/missions/manager/${managerId}`);
  if (!response.ok) throw new Error("נכשל בטעינת משימות");
  return response.json();
};

// --- סוכנים ---
export const getAgentsByDept = async (dept: string) => {
  const response = await fetch(`${BASE_URL}/employees/department/${dept}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); 
    throw new Error(errorData.error || 'Failed to recruit agent');
  }
  return response.json();
};

// 2. הוספת סוכן חדש (המעודכן והנכון!)
export const createAgent = async (agentData: any, managerId: number) => {
  const response = await fetch(`${BASE_URL}/employees/recruit?managerId=${managerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...agentData, employee_type: "AGENT" })
  });
  
  if (!response.ok) throw new Error("Failed to create agent");
  return response.json();
};

export const deleteAgent = async (id: number) => {
  const response = await fetch(`${BASE_URL}/employees/${id}`, { 
    method: 'DELETE' 
  });
  if (!response.ok) throw new Error("Failed to delete agent");
};

// --- ניהול משימות ---
export const createMission = async (missionData: any) => {
  const response = await fetch(`${BASE_URL}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(missionData)
  });
  if (!response.ok) throw new Error("נכשל ביצירת משימה");
  return response.json();
};

export const completeMission = async (id: number) => {
  const response = await fetch(`${BASE_URL}/missions/${id}/complete`, { method: 'POST' });
  if (!response.ok) throw new Error("Failed to complete mission");
  return response.json();
};

export const deleteMission = async (id: number) => {
  const response = await fetch(`${BASE_URL}/missions/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error("Failed to delete mission");
};

// --- דיווחים ובינה מלאכותית ---
export const summarizeMissionAI = async (id: number) => {
  const response = await fetch(`${BASE_URL}/missions/${id}/summarize`, { method: 'POST' });
  if (!response.ok) throw new Error("Failed to generate AI intel");
  return response.json();
};

export const submitReport = async (missionId: number, agentId: number, text: string) => {
  const url = `${BASE_URL}/missions/${missionId}/report?agentId=${agentId}&text=${encodeURIComponent(text)}`;
  
  const response = await fetch(url, {
    method: 'POST'
  });
  
  if (!response.ok) throw new Error("Failed to submit report");
  return response.json();
};

