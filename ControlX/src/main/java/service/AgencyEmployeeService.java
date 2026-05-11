package service;

import entity.AgencyEmployee;
import entity.DeskManager;
import entity.FieldAgent;
import entity.Mission;
import repository.AgencyEmployeeRepository;
import repository.MissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AgencyEmployeeService {

    private final AgencyEmployeeRepository employeeRepository;
    private final MissionRepository missionRepository;

    public AgencyEmployeeService(AgencyEmployeeRepository employeeRepository, MissionRepository missionRepository) {
        this.employeeRepository = employeeRepository;
        this.missionRepository = missionRepository;
    }

    // 1. שמירה כללית (עבור מנהלים)
    public AgencyEmployee saveEmployee(AgencyEmployee employee) {
        return employeeRepository.save(employee);
    }

    // 2. הפונקציה שהייתה חסרה - גיוס סוכן חכם!
    @Transactional
    public FieldAgent recruitNewAgent(FieldAgent agent, Long managerId) {
        // שליפת המנהל המגייס מהדאטה-בייס
        DeskManager manager = (DeskManager) employeeRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("מנהל מגייס לא נמצא במערכת!"));

        // אוטומציה: הסוכן מקבל את המחלקה והמנהל של מי שגייס אותו
        agent.setDepartment(manager.getDepartment());
        agent.setRecruitingManager(manager);

        // הגדרת סטטוס ראשוני
        if (agent.getStatus() == null) {
            agent.setStatus(FieldAgent.AgentStatus.AVAILABLE);
        }

        return employeeRepository.save(agent);
    }

    public List<AgencyEmployee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Transactional
    public void deleteEmployee(Long id) {
        AgencyEmployee employee = employeeRepository.findById(id).orElse(null);

        if (employee instanceof FieldAgent) {
            FieldAgent agent = (FieldAgent) employee;

            // 1. שליפת כל המשימות שקשורות לסוכן
            List<Mission> allMissions = missionRepository.findAll();

            for (Mission mission : allMissions) {
                if (mission.getAssignedAgents() != null && mission.getAssignedAgents().contains(agent)) {

                    // בדיקה אם המשימה פעילה (IN_PROGRESS)
                    boolean isActive = mission.getStatus() == Mission.MissionStatus.IN_PROGRESS;

                    // בדיקה אם הוא הסוכן האחרון במשימה
                    boolean isLastAgent = mission.getAssignedAgents().size() == 1;

                    if (isActive && isLastAgent) {
                        // מקרה א': משימה פעילה והוא לבד - מוחקים את המשימה
                        missionRepository.delete(mission);
                    } else {
                        // מקרה ב': יש עוד סוכנים או שהמשימה לא פעילה - רק מסירים אותו מהרשימה
                        mission.getAssignedAgents().remove(agent);
                        missionRepository.save(mission);
                    }
                }
            }
        }

        // 2. בסוף מוחקים את הסוכן עצמו
        employeeRepository.deleteById(id);
    }
}