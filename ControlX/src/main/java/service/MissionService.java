package service;

import entity.*;
import repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class MissionService {

    private final MissionRepository missionRepository;
    private final AgencyEmployeeRepository employeeRepository;
    private final ReportRepository reportRepository;
    private final GeminiService geminiService;

    public MissionService(MissionRepository missionRepository, AgencyEmployeeRepository employeeRepository, ReportRepository reportRepository, GeminiService geminiService) {
        this.missionRepository = missionRepository;
        this.employeeRepository = employeeRepository;
        this.reportRepository = reportRepository;
        this.geminiService = geminiService;
    }

    @Transactional
    public Mission saveMission(Mission mission) {
        // המשימה הופכת לפעילה
        mission.setStatus(Mission.MissionStatus.IN_PROGRESS);

        // ---> התיקון שלנו: חותמת זמן התחלה מדויקת <---
        mission.setStartedAt(LocalDateTime.now());

        if (mission.getCreatorManager() != null && mission.getCreatorManager().getId() != null) {
            DeskManager realManager = (DeskManager) employeeRepository.findById(mission.getCreatorManager().getId()).orElse(null);
            mission.setCreatorManager(realManager);
        }

        if (mission.getAssignedAgents() != null && !mission.getAssignedAgents().isEmpty()) {
            List<FieldAgent> managedAgents = mission.getAssignedAgents().stream()
                    .map(a -> (FieldAgent) employeeRepository.findById(a.getId()).orElse(null))
                    .filter(a -> a != null)
                    .collect(Collectors.toList());

            // שינוי הסטטוס לסוכנים
            for (FieldAgent agent : managedAgents) {
                agent.setStatus(FieldAgent.AgentStatus.ON_MISSION);
            }

            // שמירת הסוכנים במסד הנתונים
            employeeRepository.saveAll(managedAgents);

            mission.setAssignedAgents(managedAgents);
        }
        return missionRepository.save(mission);
    }

    @Transactional
    public Report addReport(Long missionId, Long agentId, String text) {
        Mission mission = missionRepository.findById(missionId).orElseThrow();
        AgencyEmployee employee = employeeRepository.findById(agentId).orElseThrow();
        Report report = new Report();
        report.setRawText(text);
        report.setTimestamp(LocalDateTime.now());
        report.setMission(mission);
        if (employee instanceof FieldAgent) {
            report.setAuthor((FieldAgent) employee);
        }
        return reportRepository.save(report);
    }

    @Transactional
    public Mission completeMission(Long missionId) {
        Mission mission = missionRepository.findById(missionId).orElseThrow();
        mission.setStatus(Mission.MissionStatus.COMPLETED);

        if (mission.getAssignedAgents() != null) {
            for (FieldAgent agent : mission.getAssignedAgents()) {
                agent.setStatus(FieldAgent.AgentStatus.AVAILABLE);
            }
            // שחרור הסוכנים חזרה למסד הנתונים כדי שיופיעו כפנויים שוב
            employeeRepository.saveAll(mission.getAssignedAgents());
        }
        return missionRepository.save(mission);
    }

    @Transactional
    public Mission generateAiSummary(Long missionId) {
        Mission mission = missionRepository.findById(missionId).orElseThrow();
        List<Report> allReports = reportRepository.findByMissionId(missionId);
        String combined = allReports.stream().map(Report::getRawText).collect(Collectors.joining("\n"));
        if (!combined.isEmpty()) {
            try {
                String prompt = "Please summarize the following field reports into a tactical, concise, and professional intelligence brief: \n" + combined;
                String summary = geminiService.summarizeReports(prompt);
                mission.setAiIntelligenceSummary(summary);
            } catch (Exception e) {
                mission.setAiIntelligenceSummary("SYSTEM ERROR: AI Intel connection failed.");
            }
        }
        return missionRepository.save(mission);
    }

    @Transactional
    public void deleteMission(Long missionId) {
        Mission mission = missionRepository.findById(missionId).orElse(null);
        if (mission != null) {
            if (mission.getAssignedAgents() != null) {
                for (FieldAgent agent : mission.getAssignedAgents()) {
                    agent.setStatus(FieldAgent.AgentStatus.AVAILABLE);
                }
                // שחרור הסוכנים במקרה של מחיקת משימה
                employeeRepository.saveAll(mission.getAssignedAgents());
            }
            missionRepository.delete(mission);
        }
    }

    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }

    public List<Mission> getMissionsByManager(Long managerId) {
        return missionRepository.findByCreatorManagerId(managerId);
    }
}