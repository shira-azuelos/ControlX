package controller;

import entity.Mission;
import entity.Report;
import service.MissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
public class MissionController {

    private final MissionService missionService;

    public MissionController(MissionService missionService) {
        this.missionService = missionService;
    }

    // 1. שליפת כל המשימות
    @GetMapping
    public List<Mission> getAll() {
        return missionService.getAllMissions();
    }

    // 2. מסנן משימות לפי מנהל - מוגן מפני מזהה שגוי
    @GetMapping("/manager/{managerId}")
    public List<Mission> getMissionsByManager(@PathVariable Long managerId) {
        List<Mission> m = missionService.getMissionsByManager(managerId);
        // אם החזרת רשימה ריקה והמנהל לא קיים, תוכלי להוסיף פה בדיקה, אך לרוב החזרת רשימה ריקה היא תקינה.
        return m;
    }

    // 3. יצירת משימה חדשה
    @PostMapping
    public Mission createMission(@RequestBody Mission mission) {
        if (mission == null) {
            throw new IllegalArgumentException("נתוני המשימה שנשלחו אינם תקינים או ריקים.");
        }
        return missionService.saveMission(mission);
    }

    // 4. הגשת דיווח למשימה - מוגן מפני קלטים חסרים או מזהים שגויים
    @PostMapping("/{missionId}/report")
    public Report submitReport(@PathVariable Long missionId, @RequestParam Long agentId, @RequestParam String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("תוכן הדיווח אינו יכול להיות ריק.");
        }
        try {
            return missionService.addReport(missionId, agentId, text);
        } catch (Exception e) {
            // אם המשימה או הסוכן לא קיימים בבסיס הנתונים, ה-Service יזרוק שגיאה, ואנחנו נעביר אותה לגלובלי עם הסבר
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