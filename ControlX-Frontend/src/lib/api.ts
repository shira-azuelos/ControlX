const BASE_URL = "http://localhost:8080/api";


export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const userStr = localStorage.getItem('user');
  let token = '';
  if (userStr) {
    const user = JSON.parse(userStr);
    token = user.token;
  }

  // יוצרים אוביקט חכם לניהול הכותרת
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // שליחת בקשה אמיתית לשרת
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // אם השרת דחה את הבקשה
  if (response.status === 401 || response.status === 403) {
    console.error("Access Denied - Token Expired or Invalid");
    localStorage.removeItem('user');
    window.location.href = '/'; 
    throw new Error("Unauthorized");
  }

  return response;//אם תקין מחזירים לקומפוננטה שביקשה
};

// ---התחברות---
export const loginWithPasskey = async (passkey: string) => { 
  const response = await fetch(`${BASE_URL}/employees/login/${passkey}`);
  
  if (!response.ok) {
    throw new Error("קוד גישה שגוי או שרת כבוי");
  }
  
  return response.json(); 
};

// --- משימות כלליות ---
export const getMissions = async () => {
  const response = await fetchWithAuth('/missions');
  if (!response.ok) throw new Error("נכשל בטעינת משימות");
  return response.json();
};

// --- משימות לפי מנהל ---
export const getMissionsByManager = async (managerId: number) => {
  const response = await fetchWithAuth(`/missions/manager/${managerId}`);
  if (!response.ok) throw new Error("נכשל בטעינת משימות");
  return response.json();
};

// --- סוכנים ---
export const getAgentsByDept = async (dept: string) => {
  const response = await fetchWithAuth(`/employees/department/${dept}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); 
    throw new Error(errorData.error || 'Failed to fetch agents');
  }
  return response.json();
};

// --- הוספת סוכן חדש ---
export const createAgent = async (agentData: any, managerId: number) => {
  const response = await fetchWithAuth(`/employees/recruit?managerId=${managerId}`, {
    method: 'POST',
    body: JSON.stringify({ ...agentData, employee_type: "AGENT" })
  });
  
  if (!response.ok) throw new Error("Failed to create agent");
  return response.json();
};

// --- מחיקת סוכן ---
export const deleteAgent = async (id: number) => {
  const response = await fetchWithAuth(`/employees/${id}`, { 
    method: 'DELETE' 
  });
  if (!response.ok) throw new Error("Failed to delete agent");
};

// --- ניהול משימות ---
export const createMission = async (missionData: any) => {
  const response = await fetchWithAuth(`/missions`, {
    method: 'POST',
    body: JSON.stringify(missionData)
  });
  if (!response.ok) throw new Error("נכשל ביצירת משימה");
  return response.json();
};

export const completeMission = async (id: number) => {
  const response = await fetchWithAuth(`/missions/${id}/complete`, { method: 'POST' });
  if (!response.ok) throw new Error("Failed to complete mission");
  return response.json();
};

export const deleteMission = async (id: number) => {
  const response = await fetchWithAuth(`/missions/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error("Failed to delete mission");
};

// --- דיווחים ובינה מלאכותית ---
export const summarizeMissionAI = async (id: number) => {
  const response = await fetchWithAuth(`/missions/${id}/summarize`, { method: 'POST' });
  if (!response.ok) throw new Error("Failed to generate AI intel");
  return response.json();
};

export const submitReport = async (missionId: number, agentId: number, text: string) => {
  const url = `/missions/${missionId}/report?agentId=${agentId}&text=${encodeURIComponent(text)}`;
  
  const response = await fetchWithAuth(url, {
    method: 'POST'
  });
  
  if (!response.ok) throw new Error("Failed to submit report");
  return response.json();
};

// --- ניהול קריאת הודעות בצ'אט ---

export const getUnreadCount = async (missionId: number, senderId: number, myId: number) => {
  const response = await fetchWithAuth(`/chat/mission/${missionId}/unread?senderId=${senderId}&myId=${myId}`);
  if (!response.ok) throw new Error("Failed to get unread count");
  return response.json();
};

export const markMessagesAsRead = async (missionId: number, senderId: number, myId: number) => {
  const response = await fetchWithAuth(`/chat/mission/${missionId}/read?senderId=${senderId}&myId=${myId}`, { method: 'POST' });
  if (!response.ok) throw new Error("Failed to mark messages as read");
  return response;
};