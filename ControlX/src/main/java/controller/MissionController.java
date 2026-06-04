package controller;

import entity.Mission;
import entity.Report;
import service.MissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate; // הוספנו ייבוא

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
public class MissionController {

    private final MissionService missionService;
    // הרכיב שמאפשר לנו לדחוף הודעות בזמן אמת
    private final SimpMessagingTemplate messagingTemplate;

    // עדכנו את הבנאי (Constructor) שיקבל גם את רכיב השידור
    public MissionController(MissionService missionService, SimpMessagingTemplate messagingTemplate) {
        this.missionService = missionService;
        this.messagingTemplate = messagingTemplate;
    }

    // 1. שליפת כל המשימות
    @GetMapping
    public List<Mission> getAll() {
        return missionService.getAllMissions();
    }

    // 2. מסנן משימות לפי מנהל - מוגן מפני מזהה שגוי
    @GetMapping("/manager/{managerId}")
    public List<Mission> getMissionsByManager(@PathVariable Long managerId) {
        return missionService.getMissionsByManager(managerId);
    }

    // 3. יצירת משימה חדשה
    @PostMapping
    public Mission createMission(@RequestBody Mission mission) {
        if (mission == null) {
            throw new IllegalArgumentException("נתוני המשימה שנשלחו אינם תקינים או ריקים.");
        }
        return missionService.saveMission(mission);
    }

    // 4. הגשת דיווח למשימה + שידור ההתראה בזמן אמת למנהל!
    @PostMapping("/{missionId}/report")
    public Report submitReport(@PathVariable Long missionId, @RequestParam Long agentId, @RequestParam String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("תוכן הדיווח אינו יכול להיות ריק.");
        }
        try {
            // שמירת הדיווח במסד הנתונים
            Report savedReport = missionService.addReport(missionId, agentId, text);

            // ==========================================
            // חדש: יצירת ההתראה ושליחתה למנהל!
            // ==========================================
            try {
                // מזהים מי המנהל שיצר את המשימה כדי לשלוח אליו את ההתראה
                Long managerId = savedReport.getMission().getCreatorManager().getId();

                // בונים אובייקט "דמה" שייראה כמו הודעת צ'אט כדי שהריאקט ידע לקרוא אותו
                Map<String, Object> notification = new HashMap<>();
                notification.put("senderId", agentId);

                Map<String, Object> senderInfo = new HashMap<>();
                // שולפים את שם הסוכן מהדיווח
                senderInfo.put("codename", savedReport.getAuthor().getCodename());
                notification.put("sender", senderInfo);

                // מוסיפים קידומת [FIELD REPORT] כדי שהמנהל ידע שזה דיווח ולא צ'אט רגיל
                notification.put("text", "[FIELD REPORT] " + text);

                // משדרים לערוץ ההתראות של המנהל
                messagingTemplate.convertAndSend("/topic/notifications/user/" + managerId, notification);
            } catch (Exception ex) {
                System.out.println("WebSocket Report Notification Failed: " + ex.getMessage());
            }
            // ==========================================

            return savedReport;
        } catch (Exception e) {
            throw new IllegalArgumentException("נכשל בהגשת הדיווח. ודא כי מזהה המשימה (" + missionId + ") ומזהה הסוכן (" + agentId + ") קיימים במערכת.");
        }
    }

    // 5. סגירת/השלמת משימה
    @PostMapping("/{missionId}/complete")
    public Mission completeMission(@PathVariable Long missionId) {
        try {
            return missionService.completeMission(missionId);
        } catch (Exception e) {
            throw new IllegalArgumentException("לא ניתן להשלים את המשימה. מזהה משימה " + missionId + " לא נמצא במערכת.");
        }
    }

    // 6. סיכום משימה באמצעות AI
    @PostMapping("/{id}/summarize")
    public ResponseEntity<?> summarizeMission(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(missionService.generateAiSummary(id));
        } catch (Exception e) {
            throw new IllegalArgumentException("נכשל בהפקת סיכום AI עבור משימה מספר " + id + ". ודא שהמשימה קיימת ומכילה דיווחים.");
        }
    }

    // 7. מחיקת משימה
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMission(@PathVariable Long id) {
        try {
            missionService.deleteMission(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            throw new IllegalArgumentException("מחיקת המשימה נכשלה. מזהה משימה " + id + " לא נמצא במערכת.");
        }
    }
}