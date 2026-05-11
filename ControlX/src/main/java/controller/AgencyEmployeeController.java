package controller;

import entity.AgencyEmployee;
import entity.FieldAgent;
import service.AgencyEmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class AgencyEmployeeController {

    private final AgencyEmployeeService employeeService;

    public AgencyEmployeeController(AgencyEmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // 1. לוגין
    @GetMapping("/login/{passkey}")
    public ResponseEntity<?> login(@PathVariable String passkey) {
        return employeeService.getAllEmployees().stream()
                .filter(e -> e.getId().toString().equals(passkey))
                .findFirst()
                .map(employee -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", employee.getId());
                    response.put("name", employee.getFullName());
                    response.put("department", employee.getDepartment());
                    response.put("employeeType", employee instanceof entity.DeskManager ? "DeskManager" : "FieldAgent");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(401).build());
    }

    // 2. גיוס סוכן חכם (זה הנתיב שהריאקט קורא לו עכשיו!)
    @PostMapping("/recruit")
    public AgencyEmployee recruitAgent(@RequestBody FieldAgent agent, @RequestParam Long managerId) {
        return employeeService.recruitNewAgent(agent, managerId);
    }

    // 3. שליפת סוכנים לפי מחלקה (עבור ה-Overview והרשימות)
    @GetMapping("/department/{dept}")
    public List<FieldAgent> getAgentsByDepartment(@PathVariable String dept) {
        AgencyEmployee.Department department = AgencyEmployee.Department.valueOf(dept);
        return employeeService.getAllEmployees().stream()
                .filter(e -> e instanceof FieldAgent)
                .map(e -> (FieldAgent) e)
                .filter(a -> a.getDepartment() == department)
                .toList();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok().build();
    }
    // --- יצירת עובד רגיל (כמו מנהל) - השורה שהעלמתי בטעות! ---
    @PostMapping
    public AgencyEmployee create(@RequestBody AgencyEmployee employee) {
        return employeeService.saveEmployee(employee);
    }

    // --- שליפת כל העובדים בארגון ---
    @GetMapping
    public List<AgencyEmployee> getAll() {
        return employeeService.getAllEmployees();
    }
}