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

    @GetMapping
    public List<Mission> getAll() {
        return missionService.getAllMissions();
    }

    // ---> הנתיב שהיה חסר! מסנן משימות לפי המנהל <---
    @GetMapping("/manager/{managerId}")
    public List<Mission> getMissionsByManager(@PathVariable Long managerId) {
        return missionService.getMissionsByManager(managerId);
    }

    @PostMapping
    public Mission createMission(@RequestBody Mission mission) {
        return missionService.saveMission(mission);
    }

    @PostMapping("/{missionId}/report")
    public Report submitReport(@PathVariable Long missionId, @RequestParam Long agentId, @RequestParam String text) {
        return missionService.addReport(missionId, agentId, text);
    }

    @PostMapping("/{missionId}/complete")
    public Mission completeMission(@PathVariable Long missionId) {
        return missionService.completeMission(missionId);
    }

    @PostMapping("/{id}/summarize")
    public ResponseEntity<?> summarizeMission(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.generateAiSummary(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMission(@PathVariable Long id) {
        missionService.deleteMission(id);
        return ResponseEntity.ok().build();
    }
}