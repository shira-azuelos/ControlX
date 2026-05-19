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

    // 1. לוגין - מעודכן לזריקת שגיאה גלובלית
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
                // במקום 401 ידני, זורקים שגיאה שמגיעה ישר ל-GlobalExceptionHandler
                .orElseThrow(() -> new IllegalArgumentException("קוד הגישה (Passkey) שהוזן אינו קיים במערכת."));
    }

    // 2. גיוס סוכן חכם
    @PostMapping("/recruit")
    public AgencyEmployee recruitAgent(@RequestBody FieldAgent agent, @RequestParam Long managerId) {
        return employeeService.recruitNewAgent(agent, managerId);
    }

    // 3. שליפת סוכנים לפי מחלקה - מעודכן לטיפול חכם ב-Enum שגוי
    @GetMapping("/department/{dept}")
    public List<FieldAgent> getAgentsByDepartment(@PathVariable String dept) {
        try {
            // אם הטקסט ב-dept לא קיים ב-Enum, השורה הזו תזרוק שגיאה אוטומטית
            AgencyEmployee.Department department = AgencyEmployee.Department.valueOf(dept.toUpperCase());

            return employeeService.getAllEmployees().stream()
                    .filter(e -> e instanceof FieldAgent)
                    .map(e -> (FieldAgent) e)
                    .filter(a -> a.getDepartment() == department)
                    .toList();

        } catch (IllegalArgumentException e) {
            // אנחנו תופסים את השגיאה הטכנית ומעבירים אותה הלאה לגלובלי עם הסבר ברור בעברית
            throw new IllegalArgumentException("המחלקה המבוקשת '" + dept + "' אינה קיימת במערכת.");
        }
    }

    // 4. מחיקת עובד
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok().build();
    }

    // 5. יצירת עובד רגיל
    @PostMapping
    public AgencyEmployee create(@RequestBody AgencyEmployee employee) {
        return employeeService.saveEmployee(employee);
    }

    // 6. שליפת כל העובדים בארגון
    @GetMapping
    public List<AgencyEmployee> getAll() {
        return employeeService.getAllEmployees();
    }
}